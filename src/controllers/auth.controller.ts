import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
// @ts-expect-error - Disabling TS error while importing /shared submodule
// due to global tsconfig "moduleResolution" prop is set to "node"
import { generateSecureMessageForSigning } from 'zano_web3/shared';

import AuthData from '@/interfaces/bodies/user/AuthData.js';
import RequestAuthBody from '@/interfaces/bodies/auth/RequestAuthBody.js';
import authMessagesModel from '@/models/AuthMessages.js';
import { AUTH_MESSAGE_EXPIRATION_TIME_MS } from 'shared/constants.js';
import RequestAuthRes from '@/interfaces/responses/auth/RequestAuthRes.js';
import sequelize from '@/sequelize.js';
import AuthBody from '@/interfaces/bodies/auth/AuthBody.js';
import { env } from '@/config/env.js';
import validateWallet from '../methods/validateWallet.js';
import userModel from '../models/User.js';

class AuthController {
	requestAuth = async (req: Request, res: Response<RequestAuthRes>) => {
		const { address, alias, path } = req.body as RequestAuthBody;

		const frontendBaseUrlStr = env.FRONTEND_URL;

		const frontendBaseUrl = new URL(frontendBaseUrlStr);
		const { host } = frontendBaseUrl;

		const fullUri = new URL(frontendBaseUrlStr);
		fullUri.pathname = path;

		const statement = `This is a authentication message of ${frontendBaseUrlStr}. Sign this message to authenticate in Zano Trade.`;

		const expiresAt = new Date(Date.now() + AUTH_MESSAGE_EXPIRATION_TIME_MS);

		const generateSecureMessageResult = generateSecureMessageForSigning({
			domain: host,
			address,
			statement,
			uri: fullUri.toString(),
			nonce: crypto.randomUUID(),
			expirationTime: expiresAt,
		});

		if (!generateSecureMessageResult.success) {
			throw new Error('MESSAGE_SIGN_UNKNOWN_ERROR');
		}

		const authMessageRow = await authMessagesModel.create({
			address,
			alias,
			message: generateSecureMessageResult.message,
			expiresAt,
		});

		return res.status(200).send({
			success: true,
			data: authMessageRow.message,
		});
	};

	async auth(req: Request<Record<string, never>, unknown, AuthBody>, res: Response) {
		try {
			const userData: AuthData = req.body.data;
			const { address, alias, message, pkey } = userData;

			const authMessageRow = await authMessagesModel.findOne({
				address,
				alias,
				message,
			});

			const isAuthMessageValid =
				!!authMessageRow && authMessageRow.expires_at.getTime() > Date.now();

			if (!isAuthMessageValid) {
				return res.status(400).send({ success: false, data: 'Invalid auth message' });
			}

			const dataValid = !!(
				userData &&
				userData.address &&
				alias &&
				(await validateWallet({
					originalMessage: authMessageRow.message,
					signedMessage: message,
					signature: userData.signature,
					address,
					pkeyFromSignature: pkey,
					alias,
				}))
			);
			if (!dataValid) {
				return res.status(400).send({ success: false, data: 'Invalid auth data' });
			}

			let token: string | undefined;

			await sequelize.transaction(async (transaction) => {
				const success = await userModel.add(userData, { transaction });

				if (success) {
					await authMessagesModel.deleteOne(
						{
							address,
							alias,
							message,
						},
						{ transaction },
					);

					token = jwt.sign({ ...userData }, env.JWT_SECRET, {
						algorithm: 'HS256',
						expiresIn: '24h',
					});
				}
			});

			if (token !== undefined) {
				res.status(200).send({ success: true, data: token });
			} else {
				res.status(500).send({ success: false, data: 'Internal error' });
			}
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}
}

const authController = new AuthController();

export default authController;
