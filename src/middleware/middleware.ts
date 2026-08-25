import { NextFunction, Request, Response } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { rateLimit } from 'express-rate-limit';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import proxyaddr from 'proxy-addr';
import z from 'zod';

import User from '@/schemes/User';
import { env } from '@/config/env.js';
import UserData from '../interfaces/common/UserData';

const sha256 = (value: string): Buffer =>
	crypto.createHash('sha256').update(value, 'utf8').digest();

const defaultRateLimitMiddleware = rateLimit({
	windowMs: 10 * 60 * 1000, // 10 minutes
	max: 6000, // limit each IP to 6000 requests per windowMs (10 requests/second)
	message: {
		success: false,
		data: 'Too many requests from this IP, please try again later.',
	},
	standardHeaders: true,
	legacyHeaders: false,
});

class Middleware {
	private corsProtectedRouteMiddleware = (
		req: Request,
		res: Response,
		next: NextFunction,
	): void => {
		const { origin } = req.headers;

		// SSR / server-side requests (no Origin header) — allow
		if (!origin) {
			return next();
		}

		const frontendBaseUrl = new URL(env.FRONTEND_URL).toString();
		const originUrl = new URL(origin).toString();

		if (originUrl !== frontendBaseUrl) {
			res.status(500).json({
				success: false,
				data: 'Internal error',
			});
			return;
		}

		// Allowed origin — let cors set the response headers, then continue
		return cors({ origin, credentials: true })(req, res, next);
	};

	private verifyToken = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userData = jwt.verify(req.body.token, env.JWT_SECRET, {
				algorithms: ['HS256'],
			}) as UserData;
			req.body.userData = userData;
			next();
		} catch {
			res.status(401).send({ success: false, data: 'Unauthorized (JWT)' });
		}
	};

	private verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
		const userAlias = req?.body?.userData?.alias || null;

		console.log(req?.body?.userData);

		const userField = await User.findOne({
			where: {
				alias: userAlias,
			},
		});

		const isAdmin = userField && userField.isAdmin;
		const isOwner = env.OWNER_ALIAS && env.OWNER_ALIAS === userField?.alias;

		if (isAdmin || isOwner) {
			next();
		} else {
			res.status(401).send({ success: false, data: 'Unauthorized' });
		}
	};

	private readonly INTEGRATION_KEY_HEADER_NAME = 'x-integration-key';

	private readonly INTEGRATION_KEY_HASH = sha256(env.INTEGRATION_KEY);

	private verifyIntegrationKey = async (req: Request, res: Response, next: NextFunction) => {
		const providedKey = req.headers[this.INTEGRATION_KEY_HEADER_NAME];

		const isValid =
			typeof providedKey === 'string' &&
			crypto.timingSafeEqual(sha256(providedKey), this.INTEGRATION_KEY_HASH);

		if (!isValid) {
			res.status(401).send({ success: false, data: 'Unauthorized' });
			return;
		}

		next();
	};

	authGuard = [this.corsProtectedRouteMiddleware.bind(this), this.verifyToken.bind(this)];

	adminAuthGuard = [
		this.corsProtectedRouteMiddleware.bind(this),
		this.verifyToken.bind(this),
		this.verifyAdmin.bind(this),
	];

	integrationKeyAuthGuard = [this.verifyIntegrationKey.bind(this)];

	defaultRateLimit = async (req: Request, res: Response, next: NextFunction) =>
		defaultRateLimitMiddleware(req, res, next);

	defaultCors = cors({ credentials: true });

	expressValidator(validators: ValidationChain[]) {
		return [
			...validators,
			(req: Request, res: Response, next: NextFunction) => {
				const errors = validationResult(req);

				if (!errors.isEmpty()) {
					res.status(500).send({
						success: false,
						data: errors
							.array()
							.map((err) => err.msg)
							.join(', '),
					});
					return;
				}

				next();
			},
		];
	}

	static readonly INVALID_BFF_IP_SIGNATURE_ERR_MSG = 'INVALID_BFF_IP_SIGNATURE';
	bffTrustedProxyIpSignatureCheckMiddleware = async (
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		try {
			const SIGNATURE_HEADER = 'x-bff-client-ip-sig';
			const SIGNATURE_TTL_MS = 15 * 1000; // 15 seconds

			const payloadSchema = z.object({
				ip: z.string().min(1),
				index: z.number().int().nonnegative(),
				method: z.string().min(1),
				path: z.string().min(1),
				iat: z.number().int(),
			});

			const signature = req.get(SIGNATURE_HEADER);

			if (signature === undefined) {
				next();
				return;
			}

			const signatureKeyBuffer = Buffer.from(env.TRUSTED_PROXY_BFF_IP_SIGNATURE_KEY, 'utf-8');

			let rawPayload;

			try {
				rawPayload = await new Promise((resolve, reject) => {
					jwt.verify(
						signature,
						signatureKeyBuffer,
						{ algorithms: ['HS256'] },
						(err, payload) => {
							if (err) {
								reject(err);
								return;
							}

							resolve(payload);
						},
					);
				});
			} catch (error) {
				if (error instanceof jwt.JsonWebTokenError) {
					throw new Error(Middleware.INVALID_BFF_IP_SIGNATURE_ERR_MSG);
				}

				throw error;
			}

			let payload;

			try {
				payload = payloadSchema.parse(rawPayload);
			} catch (error) {
				if (error instanceof z.ZodError) {
					throw new Error(Middleware.INVALID_BFF_IP_SIGNATURE_ERR_MSG);
				}

				throw error;
			}

			const { ip, index: signaturePayloadIPIndex, method, path: jwtPath } = payload;

			if (method !== req.method) {
				throw new Error(Middleware.INVALID_BFF_IP_SIGNATURE_ERR_MSG);
			}

			if (jwtPath !== req.path) {
				throw new Error(Middleware.INVALID_BFF_IP_SIGNATURE_ERR_MSG);
			}

			const xForwardedFor = req.headers['x-forwarded-for'];

			if (typeof xForwardedFor !== 'string') {
				throw new Error(Middleware.INVALID_BFF_IP_SIGNATURE_ERR_MSG);
			}

			const xffEntries = xForwardedFor.split(',').map((s) => s.trim());

			const autoTrustedProxyCount = env.TRUST_PROXY_DEPTH;
			const bffIpIndex = xffEntries.length - autoTrustedProxyCount;
			const expectedClientIpIndex = bffIpIndex - 1;

			if (
				xffEntries[signaturePayloadIPIndex] !== ip ||
				xffEntries[expectedClientIpIndex] !== ip
			) {
				throw new Error(Middleware.INVALID_BFF_IP_SIGNATURE_ERR_MSG);
			}

			const signatureIssuedAt = payload.iat * 1000;

			const now = Date.now();

			const isExpired = now > signatureIssuedAt + SIGNATURE_TTL_MS || now < signatureIssuedAt;

			if (isExpired) {
				throw new Error(Middleware.INVALID_BFF_IP_SIGNATURE_ERR_MSG);
			}

			const newIPFormatted = proxyaddr(req, (_address, i) => i < env.TRUST_PROXY_DEPTH + 1);

			Object.defineProperty(req, 'ip', {
				get: () => newIPFormatted,
				configurable: true,
			});

			next();
		} catch (error) {
			if (
				error instanceof Error &&
				error.message === Middleware.INVALID_BFF_IP_SIGNATURE_ERR_MSG
			) {
				res.status(500).send({
					success: false,
					data: 'Internal error',
				});

				return;
			}

			throw error;
		}
	};

	expressJSONErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
		const isExpressJSONError =
			err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err;

		if (isExpressJSONError) {
			res.status(500).send({
				success: false,
				data: 'Internal error',
			});
		} else {
			next(err);
		}
	};

	globalErrorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
		console.error('Global error handler:');
		console.error(err);
		res.status(500).send({
			success: false,
			data: 'Internal error',
		});
	};

	resultGlobalErrorHandler = [this.expressJSONErrorHandler, this.globalErrorHandler];
}

const middleware = new Middleware();

export default middleware;
