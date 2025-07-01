import { Request, Response } from 'express';
import configModel from '../models/Config.js';
import userModel from '../models/User.js';
import GetUserBody from '../interfaces/bodies/user/GetUserBody.js';
import SetFavouriteCurrsBody from '../interfaces/bodies/user/SetFavouriteCurrsBody.js';

class UserController {
	async getUser(req: Request, res: Response) {
		try {
			if (!req.body.userData?.address)
				return res.status(400).send({ success: false, data: 'Invalid user data' });

			const result = await userModel.getUser({
				address: req.body.userData.address,
			} as GetUserBody);

			if (result.success) {
				return res.status(200).send(result);
			}

			if (result.data === 'User not registered') {
				return res.status(400).send(result);
			}

			return res.status(500).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}

	async getNotificationsAmount(req: Request, res: Response) {
		try {
			if (!req.body.userData?.address)
				return res.status(400).send({ success: false, data: 'Invalid user data' });

			const result = await userModel.getNotificationsAmount({
				address: req.body.userData.address,
			} as GetUserBody);

			if (result.success) {
				return res.status(200).send(result);
			}

			if (result.data === 'User not found') {
				return res.status(400).send(result);
			}

			return res.status(500).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}

	async setFavouriteCurrencies(req: Request, res: Response) {
		try {
			if (!req.body.data)
				return res.status(400).send({ success: false, data: 'Invalid currencies data' });

			try {
				JSON.stringify(req.body.data);
				const configGetResult = await configModel.get();

				if (!configGetResult.success) return res.status(400).send(configGetResult);

				const { currencies } = configGetResult.data;
				if (
					(req.body as SetFavouriteCurrsBody).data.find(
						(e) => !currencies.find((curr) => curr.code === e),
					)
				)
					throw new Error();
			} catch {
				return res.status(400).send({ success: false, data: 'Invalid currencies data' });
			}

			const result = await userModel.setFavouriteCurrencies(req.body);

			if (result.success) {
				return res.status(200).send(result);
			}

			if (result.data === 'User not registered') {
				return res.status(400).send(result);
			}

			return res.status(500).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}
}

const userController = new UserController();

export default userController;
