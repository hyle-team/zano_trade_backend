import { Event } from 'socket.io';
import jwt from 'jsonwebtoken';
import chatsModel from '../models/Chats.js';
import UserData from '../interfaces/common/UserData.js';

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
		userData = jwt.verify(data.token, process.env.JWT_SECRET || '') as UserData;
	} catch {
		return next(new Error('Unauthorized'));
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
			userData = jwt.verify(data.token, process.env.JWT_SECRET || '') as UserData;
		} catch {
			return next(new Error('Unauthorized'));
		}

		data.userData = userData;

		next();
	}

	return middleware;
}

export default socketMiddleware;
