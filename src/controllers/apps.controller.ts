import { Request, Response } from 'express';
import CreateAppBody from '@/interfaces/bodies/apps/CreateAppBody.js';
import CreateAppRes from '@/interfaces/responses/apps/CreateAppRes.js';
import appsModel, { CreateAppModelErrorCode } from '../models/Apps.js';

class AppsController {
	create = async (req: Request, res: Response<CreateAppRes>) => {
		const body = req.body as CreateAppBody;
		const { name, userData } = body;

		const result = await appsModel.create({ name, address: userData.address });

		if (!result.success) {
			const errorCode = result.data;

			if (errorCode === CreateAppModelErrorCode.USER_NOT_FOUND) {
				throw new Error('JWT token of non-existent user');
			} else {
				const unhandledErrorCode: never = errorCode;
				throw new Error(
					`Unhandled apps model error: ${JSON.stringify(unhandledErrorCode)}`,
				);
			}
		}

		res.status(200).send({
			success: true,
			data: result.data,
		});
	};
}

const appsController = new AppsController();

export default appsController;
