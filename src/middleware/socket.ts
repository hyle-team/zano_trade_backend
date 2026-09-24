import { Event, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import proxyaddr from 'proxy-addr';
import { RateLimiterMemory } from 'rate-limiter-flexible';

import { env } from '@/config/env.js';
import { validateIntegrationKey } from '@/methods/validateIntegrationKey.js';
import chatsModel from '../models/Chats.js';
import UserData from '../interfaces/common/UserData.js';
import { sha256 } from '../../shared/utils.js';
import { INTEGRATION_KEY_HEADER_NAME } from '../../shared/constants.js';

export const UNAUTHORIZED_ERROR_MESSAGE = 'Unauthorized';

export const TOO_MANY_REQUESTS_ERROR_MESSAGE = 'TOO_MANY_REQUESTS';

const defaultSocketRateLimiter = new RateLimiterMemory({
	points: 120,
	duration: 1,
});

const integrationSocketRateLimiter = new RateLimiterMemory({
	points: 10_000,
	duration: 1,
});

function getSocketClientIp(socket: Socket) {
	const clientIp = proxyaddr(socket.request, (_, i) => i < env.TRUST_PROXY_DEPTH);

	return clientIp;
}

export const socketRateLimiterMiddleware = (socket: Socket, next: (_err?: Error) => void) => {
	const providedIntegrationKeyHeader = socket.request.headers[INTEGRATION_KEY_HEADER_NAME];
	const providedIntegrationKey =
		typeof providedIntegrationKeyHeader === 'string' ? providedIntegrationKeyHeader : undefined;

	const { isIntegrationRequest, isValidKey } = validateIntegrationKey({
		providedKey: providedIntegrationKey,
		expectedKeyHash: sha256(env.INTEGRATION_KEY),
	});

	if (isIntegrationRequest && !isValidKey) {
		next(new Error(UNAUTHORIZED_ERROR_MESSAGE));
		return;
	}

	const socketRateLimit = isIntegrationRequest
		? integrationSocketRateLimiter
		: defaultSocketRateLimiter;

	const clientIp = getSocketClientIp(socket);

	socketRateLimit
		.consume(clientIp)
		.then(() => next())
		.catch(() => {
			next(new Error(TOO_MANY_REQUESTS_ERROR_MESSAGE));
		});
};

async function socketMiddleware(event: Event, next: (_err?: Error | undefined) => void) {
	const [path, data] = event;

	const skipPaths = [
		'in-account',
		'in-trading',
		'out-trading',
		'in-dex-notifications',
		'out-dex-notifications',
		'error',
		'leave',
		'disconnect',
	];

	const isSkip = skipPaths.includes(path);

	if (isSkip) return next();

	let userData: UserData;

	try {
		userData = jwt.verify(data.token, env.JWT_SECRET, {
			algorithms: ['HS256'],
		}) as UserData;
	} catch {
		return next(new Error(UNAUTHORIZED_ERROR_MESSAGE));
	}

	data.userData = userData;

	const result = await chatsModel.getChat({ id: data.chat_id, userData });

	if (!result.success) return next(new Error(result.data));

	next();
}

export function verifyUser(paths: string[]) {
	async function middleware(event: Event, next: (_err?: Error | undefined) => void) {
		const [path, data] = event;

		if (!paths.includes(path)) {
			return next();
		}

		let userData;

		try {
			userData = jwt.verify(data.token, env.JWT_SECRET, {
				algorithms: ['HS256'],
			}) as UserData;
		} catch {
			return next(new Error(UNAUTHORIZED_ERROR_MESSAGE));
		}

		data.userData = userData;

		next();
	}

	return middleware;
}

export default socketMiddleware;
