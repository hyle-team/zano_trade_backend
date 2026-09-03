import { Request, Response } from 'express';
import CreateAppBody from '@/interfaces/bodies/apps/CreateAppBody.js';
import CreateAppRes, { CreateAppErrorCode } from '@/interfaces/responses/apps/CreateAppRes.js';
import { CreateAppModelErrorCode } from '@/interfaces/models/Apps/responses/CreateAppModelRes.js';
import GetAllAppsBody from '@/interfaces/bodies/apps/GetAllAppsBody.js';
import GetAllAppsRes from '@/interfaces/responses/apps/GetAllAppsRes.js';
import { GetAllAppsModelErrorCode } from '@/interfaces/models/Apps/responses/GetAllAppsModelRes.js';
import GetAppBody from '@/interfaces/bodies/apps/GetAppBody.js';
import GetAppParams from '@/interfaces/params/apps/GetAppParams.js';
import GetAppRes, { GetAppErrorCode } from '@/interfaces/responses/apps/GetAppRes.js';
import { GetAppModelErrorCode } from '@/interfaces/models/Apps/responses/GetAppModelRes.js';
import UpdateAppNameBody from '@/interfaces/bodies/apps/UpdateAppNameBody.js';
import UpdateAppNameParams from '@/interfaces/params/apps/UpdateAppNameParams.js';
import UpdateAppNameRes, {
	UpdateAppNameErrorCode,
} from '@/interfaces/responses/apps/UpdateAppNameRes.js';
import { UpdateAppNameModelErrorCode } from '@/interfaces/models/Apps/responses/UpdateAppNameModelRes.js';
import DeleteAppBody from '@/interfaces/bodies/apps/DeleteAppBody.js';
import DeleteAppParams from '@/interfaces/params/apps/DeleteAppParams.js';
import DeleteAppRes, { DeleteAppErrorCode } from '@/interfaces/responses/apps/DeleteAppRes.js';
import { DeleteAppModelErrorCode } from '@/interfaces/models/Apps/responses/DeleteAppModelRes.js';
import CreateAppTokenBody from '@/interfaces/bodies/app-tokens/CreateAppTokenBody.js';
import CreateAppTokenParams from '@/interfaces/params/app-tokens/CreateAppTokenParams.js';
import CreateAppTokenRes, {
	CreateAppTokenErrorCode,
} from '@/interfaces/responses/app-tokens/CreateAppTokenRes.js';
import { CreateAppTokenModelErrorCode } from '@/interfaces/models/AppTokens/responses/CreateAppTokenModelRes.js';
import GetAppTokenBody from '@/interfaces/bodies/app-tokens/GetAppTokenBody.js';
import GetAppTokenParams from '@/interfaces/params/app-tokens/GetAppTokenParams.js';
import GetAppTokenRes, {
	GetAppTokenErrorCode,
} from '@/interfaces/responses/app-tokens/GetAppTokenRes.js';
import { GetAppTokenModelErrorCode } from '@/interfaces/models/AppTokens/responses/GetAppTokenModelRes.js';
import RegenerateAppTokenBody from '@/interfaces/bodies/app-tokens/RegenerateAppTokenBody.js';
import RegenerateAppTokenParams from '@/interfaces/params/app-tokens/RegenerateAppTokenParams.js';
import RegenerateAppTokenRes, {
	RegenerateAppTokenErrorCode,
} from '@/interfaces/responses/app-tokens/RegenerateAppTokenRes.js';
import { RegenerateAppTokenModelErrorCode } from '@/interfaces/models/AppTokens/responses/RegenerateAppTokenModelRes.js';
import appTokensModel from '@/models/AppTokens.js';
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

	getOne = async (req: Request, res: Response<GetAppRes>) => {
		const body = req.body as GetAppBody;
		const params = req.params as unknown as GetAppParams;

		const { userData } = body;

		const result = await appsModel.getOne({
			appId: new Decimal(params.appId).toNumber(),
			address: userData.address,
		});

		if (!result.success) {
			const errorCode = result.data;

			switch (errorCode) {
				case GetAppModelErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: GetAppErrorCode.APP_NOT_FOUND,
					});
					return;

				case GetAppModelErrorCode.USER_NOT_FOUND:
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
			data: {
				id: result.data.id,
				name: result.data.name,
				apiKeyExists: result.data.apiKey !== null,
			},
		});
	};

	updateName = async (req: Request, res: Response<UpdateAppNameRes>) => {
		const body = req.body as UpdateAppNameBody;
		const params = req.params as unknown as UpdateAppNameParams;

		const { name, userData } = body;

		const result = await appsModel.updateName({
			appId: new Decimal(params.appId).toNumber(),
			address: userData.address,
			name,
		});

		if (!result.success) {
			const errorCode = result.data;

			switch (errorCode) {
				case UpdateAppNameModelErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: UpdateAppNameErrorCode.APP_NOT_FOUND,
					});
					return;

				case UpdateAppNameModelErrorCode.NAME_TAKEN:
					res.status(400).send({
						success: false,
						data: UpdateAppNameErrorCode.NAME_TAKEN,
					});
					return;

				case UpdateAppNameModelErrorCode.USER_NOT_FOUND:
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

	createApiKey = async (req: Request, res: Response<CreateAppTokenRes>) => {
		const body = req.body as CreateAppTokenBody;
		const params = req.params as unknown as CreateAppTokenParams;

		const { userData } = body;

		const result = await appTokensModel.create({
			appId: new Decimal(params.appId).toNumber(),
			address: userData.address,
		});

		if (!result.success) {
			const errorCode = result.data;

			switch (errorCode) {
				case CreateAppTokenModelErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: CreateAppTokenErrorCode.APP_NOT_FOUND,
					});
					return;

				case CreateAppTokenModelErrorCode.API_KEY_ALREADY_EXISTS:
					res.status(400).send({
						success: false,
						data: CreateAppTokenErrorCode.API_KEY_ALREADY_EXISTS,
					});
					return;

				case CreateAppTokenModelErrorCode.USER_NOT_FOUND:
					throw new Error('JWT token of non-existent user');

				default: {
					const unhandledErrorCode: never = errorCode;
					throw new Error(
						`Unhandled app tokens model error: ${JSON.stringify(unhandledErrorCode)}`,
					);
				}
			}
		}

		res.status(200).send({
			success: true,
			data: result.data,
		});
	};

	regenerateApiKey = async (req: Request, res: Response<RegenerateAppTokenRes>) => {
		const body = req.body as RegenerateAppTokenBody;
		const params = req.params as unknown as RegenerateAppTokenParams;

		const { userData } = body;

		const result = await appTokensModel.regenerate({
			appId: new Decimal(params.appId).toNumber(),
			address: userData.address,
		});

		if (!result.success) {
			const errorCode = result.data;

			switch (errorCode) {
				case RegenerateAppTokenModelErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: RegenerateAppTokenErrorCode.APP_NOT_FOUND,
					});
					return;

				case RegenerateAppTokenModelErrorCode.API_KEY_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: RegenerateAppTokenErrorCode.API_KEY_NOT_FOUND,
					});
					return;

				case RegenerateAppTokenModelErrorCode.USER_NOT_FOUND:
					throw new Error('JWT token of non-existent user');

				default: {
					const unhandledErrorCode: never = errorCode;
					throw new Error(
						`Unhandled app tokens model error: ${JSON.stringify(unhandledErrorCode)}`,
					);
				}
			}
		}

		res.status(200).send({
			success: true,
			data: result.data,
		});
	};

	getApiKey = async (req: Request, res: Response<GetAppTokenRes>) => {
		const body = req.body as GetAppTokenBody;
		const params = req.params as unknown as GetAppTokenParams;

		const { userData } = body;

		const result = await appTokensModel.getOne({
			appId: new Decimal(params.appId).toNumber(),
			address: userData.address,
		});

		if (!result.success) {
			const errorCode = result.data;

			switch (errorCode) {
				case GetAppTokenModelErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: GetAppTokenErrorCode.APP_NOT_FOUND,
					});
					return;

				case GetAppTokenModelErrorCode.API_KEY_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: GetAppTokenErrorCode.API_KEY_NOT_FOUND,
					});
					return;

				case GetAppTokenModelErrorCode.USER_NOT_FOUND:
					throw new Error('JWT token of non-existent user');

				default: {
					const unhandledErrorCode: never = errorCode;
					throw new Error(
						`Unhandled app tokens model error: ${JSON.stringify(unhandledErrorCode)}`,
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
