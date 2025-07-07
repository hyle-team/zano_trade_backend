import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import AuthData from '@/interfaces/bodies/user/AuthData.js';
import validateWallet from '../methods/validateWallet.js';
import userModel from '../models/User.js';

dotenv.config();

class AuthController {
	async auth(req: Request, res: Response) {
		try {
			const userData: AuthData = req.body.data;
			const { neverExpires } = req.body;
			const { address, alias, signature, message } = userData;

			if (!address || !alias || !signature || !message) {
				return res.status(400).send({ success: false, data: 'Invalid auth data' });
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
				res.cookie('authToken', token, {
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					sameSite: 'strict',
					maxAge: 24 * 60 * 60 * 1000, // 24 hour
				});
				res.status(200).send({ success });
			} else {
				res.status(500).send({ success, data: 'Internal error' });
			}
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}
	logout(_req: Request, res: Response) {
		res.clearCookie('authToken', {
			httpOnly: true,
			sameSite: 'strict',
			secure: process.env.NODE_ENV === 'production',
		});
		res.status(200).send({ success: true });
	}
}

const authController = new AuthController();

export default authController;
