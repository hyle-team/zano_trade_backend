import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import crypto from 'crypto';

import AuthData from '@/interfaces/bodies/user/AuthData.js';
import RequestAuthBody from '@/interfaces/bodies/auth/RequestAuthBody.js';
import authMessagesModel from '@/models/AuthMessages.js';
import { AUTH_MESSAGE_EXPIRATION_TIME_MS } from 'shared/constants.js';
import RequestAuthRes from '@/interfaces/responses/auth/RequestAuthRes.js';
import validateWallet from '../methods/validateWallet.js';
import userModel from '../models/User.js';

dotenv.config();

class AuthController {
	requestAuth = async (req: Request, res: Response<RequestAuthRes>) => {
		const { address, alias } = req.body as RequestAuthBody;

		const message = crypto.randomUUID();
		const expiresAt = new Date(Date.now() + AUTH_MESSAGE_EXPIRATION_TIME_MS);

		const authMessageRow = await authMessagesModel.create({
			address,
			alias,
			message,
			expiresAt,
		});

		return res.status(200).send({
			success: true,
			data: authMessageRow.message,
		});
	};

	async auth(req: Request, res: Response) {
		try {
			const userData: AuthData = req.body.data;
			const { neverExpires } = req.body;
			const { address, alias, signature, message } = userData;

			if (!address || !alias || !signature || !message) {
				return res.status(400).send({ success: false, data: 'Invalid auth data' });
			}

			const authMessageRow = await authMessagesModel.findOne({
				address,
				alias,
				message,
			});

			if (!authMessageRow) {
				return res.status(400).send({ success: false, data: 'Invalid auth message' });
			}

			const dataValid = !!(
				userData &&
				userData.address &&
				alias &&
				(await validateWallet(userData))
			);
			if (!dataValid) {
				return res.status(400).send({ success: false, data: 'Invalid auth data' });
			}

			const success = await userModel.add(userData);

			if (success) {
				const token = jwt.sign(
					{ ...userData },
					process.env.JWT_SECRET || '',
					neverExpires ? undefined : { expiresIn: '24h' },
				);
				res.status(200).send({ success, data: token });
			} else {
				res.status(500).send({ success, data: 'Internal error' });
			}
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}
}

const authController = new AuthController();

export default authController;
