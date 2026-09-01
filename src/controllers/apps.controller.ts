import { Request, Response } from 'express';
import CreateAppBody from '@/interfaces/bodies/apps/CreateAppBody.js';
import CreateAppRes, { CreateAppErrorCode } from '@/interfaces/responses/apps/CreateAppRes.js';
import appsModel from '../models/Apps.js';

class AppsController {
	create = async (req: Request, res: Response<CreateAppRes>) => {
		try {
			const body = req.body as CreateAppBody;
			const { name } = body;

			const result = await appsModel.create({ name });

			res.status(200).send({
				success: true,
				data: result.data,
			});
		} catch (err) {
			console.log(err);
			res.status(500).send({
				success: false,
				data: CreateAppErrorCode.UNHANDLED_ERROR,
			});
		}
	};
}

const appsController = new AppsController();

export default appsController;
