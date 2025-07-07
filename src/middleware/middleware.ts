import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../schemes/User';
import UserData from '../interfaces/common/UserData';

class Middleware {
	async verifyToken(req: Request, res: Response, next: NextFunction) {
		try {
			const token = req.cookies?.authToken;

			if (!token) {
				return res.status(401).send({ success: false, data: 'No token provided (cookie)' });
			}

			const userData = jwt.verify(token, process.env.JWT_SECRET || '') as UserData;
			req.body.userData = userData;
			next();
		} catch (err) {
			console.error('JWT error:', err);
			res.status(401).send({ success: false, data: 'Unauthorized (JWT)' });
		}
	}

	async verifyAdmin(req: Request, res: Response, next: NextFunction) {
		const userAlias = req?.body?.userData?.alias || null;

		console.log(req?.body?.userData);

		const userField = await User.findOne({
			where: {
				alias: userAlias,
			},
		});

		const isAdmin = userField && userField.isAdmin;
		const isOwner = process.env.OWNER_ALIAS && process.env.OWNER_ALIAS === userField?.alias;

		if (isAdmin || isOwner) {
			next();
		} else {
			res.status(401).send({ success: false, data: 'Unauthorized' });
		}
	}
}

const middleware = new Middleware();

export default middleware;
