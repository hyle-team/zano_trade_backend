import { Request, Response } from 'express';
import CreateAppBody from '@/interfaces/bodies/apps/CreateAppBody.js';
import CreateAppRes, { CreateAppErrorCode } from '@/interfaces/responses/apps/CreateAppRes.js';
import { CreateAppModelErrorCode } from '@/interfaces/models/Apps/responses/CreateAppModelRes.js';
import GetAllAppsBody from '@/interfaces/bodies/apps/GetAllAppsBody.js';
import GetAllAppsRes from '@/interfaces/responses/apps/GetAllAppsRes.js';
import { GetAllAppsModelErrorCode } from '@/interfaces/models/Apps/responses/GetAllAppsModelRes.js';
import DeleteAppBody from '@/interfaces/bodies/apps/DeleteAppBody.js';
import DeleteAppParams from '@/interfaces/params/apps/DeleteAppParams.js';
import DeleteAppRes, { DeleteAppErrorCode } from '@/interfaces/responses/apps/DeleteAppRes.js';
import { DeleteAppModelErrorCode } from '@/interfaces/models/Apps/responses/DeleteAppModelRes.js';
import { Decimal } from 'decimal.js';
import appsModel from '../models/Apps.js';

class AppsController {
	create = async (req: Request, res: Response<CreateAppRes>) => {
		const body = req.body as CreateAppBody;
		const { name, userData } = body;

		const result = await appsModel.create({ name, address: userData.address });

		if (!result.success) {
			const errorCode = result.data;

			switch (errorCode) {
				case CreateAppModelErrorCode.NAME_TAKEN:
					res.status(400).send({ success: false, data: CreateAppErrorCode.NAME_TAKEN });
					return;

				case CreateAppModelErrorCode.APP_LIMIT_REACHED:
					res.status(400).send({
						success: false,
						data: CreateAppErrorCode.APP_LIMIT_REACHED,
					});
					return;

				case CreateAppModelErrorCode.USER_NOT_FOUND:
					throw new Error('JWT token of non-existent user');

				default: {
					const unhandledErrorCode: never = errorCode;
					throw new Error(
						`Unhandled apps model error: ${JSON.stringify(unhandledErrorCode)}`,
					);
				}
			}
		}

		res.status(200).send({
			success: true,
			data: result.data,
		});
	};

	getAll = async (req: Request, res: Response<GetAllAppsRes>) => {
		const body = req.body as GetAllAppsBody;
		const { userData } = body;

		const result = await appsModel.getAll({ address: userData.address });

		if (!result.success) {
			const errorCode = result.data;

			if (errorCode === GetAllAppsModelErrorCode.USER_NOT_FOUND) {
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

	delete = async (req: Request, res: Response<DeleteAppRes>) => {
		const body = req.body as DeleteAppBody;
		const params = req.params as unknown as DeleteAppParams;

		const { userData } = body;

		const result = await appsModel.delete({
			appId: new Decimal(params.appId).toNumber(),
			address: userData.address,
		});

		if (!result.success) {
			const errorCode = result.data;

			switch (errorCode) {
				case DeleteAppModelErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: DeleteAppErrorCode.APP_NOT_FOUND,
					});
					return;

				case DeleteAppModelErrorCode.USER_NOT_FOUND:
					throw new Error('JWT token of non-existent user');

				default: {
					const unhandledErrorCode: never = errorCode;
					throw new Error(
						`Unhandled apps model error: ${JSON.stringify(unhandledErrorCode)}`,
					);
				}
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
