import { Request, Response } from 'express';
import { CreateAppRequestBody } from '@/v2/controllers/types/params/apps/create-app.params.js';
import CreateAppRes, {
	CreateAppErrorCode,
	CreateAppResAppData,
} from '@/v2/controllers/types/responses/apps/create-app.response.js';
import {
	CreateAppServiceErrorCode,
	CreateAppServiceResAppData,
} from '@/v2/services/types/responses/apps/create-app.response.js';
import { GetAllAppsRequestBody } from '@/v2/controllers/types/params/apps/get-all-apps.params.js';
import GetAllAppsRes, {
	GetAllAppsResAppData,
} from '@/v2/controllers/types/responses/apps/get-all-apps.response.js';
import {
	GetAllAppsServiceErrorCode,
	GetAllAppsServiceResAppData,
} from '@/v2/services/types/responses/apps/get-all-apps.response.js';
import {
	GetAppRequestBody,
	GetAppRequestQueryParams,
} from '@/v2/controllers/types/params/apps/get-app.params.js';
import GetAppRes, {
	GetAppErrorCode,
	GetAppResAppData,
} from '@/v2/controllers/types/responses/apps/get-app.response.js';
import {
	GetAppServiceErrorCode,
	GetAppServiceResAppData,
} from '@/v2/services/types/responses/apps/get-app.response.js';
import UpdateAppNameRes, {
	UpdateAppNameErrorCode,
	UpdateAppNameResAppData,
} from '@/v2/controllers/types/responses/apps/update-app-name.response.js';
import {
	UpdateAppNameServiceErrorCode,
	UpdateAppNameServiceResAppData,
} from '@/v2/services/types/responses/apps/update-app-name.response.js';
import {
	DeleteAppRequestBody,
	DeleteAppRequestQueryParams,
} from '@/v2/controllers/types/params/apps/delete-app.params.js';
import DeleteAppRes, {
	DeleteAppErrorCode,
	DeleteAppResAppData,
} from '@/v2/controllers/types/responses/apps/delete-app.response.js';
import {
	DeleteAppServiceErrorCode,
	DeleteAppServiceResAppData,
} from '@/v2/services/types/responses/apps/delete-app.response.js';
import {
	CreateAppTokenRequestBody,
	CreateAppTokenRequestQueryParams,
} from '@/v2/controllers/types/params/app-tokens/create-app-token.params.js';
import CreateAppTokenRes, {
	CreateAppTokenErrorCode,
	CreateAppTokenResApiKeyData,
} from '@/v2/controllers/types/responses/app-tokens/create-app-token.response.js';
import {
	CreateAppTokenServiceErrorCode,
	CreateAppTokenServiceResApiKeyData,
} from '@/v2/services/types/responses/app-tokens/create-app-token.response.js';
import {
	GetAppTokenRequestBody,
	GetAppTokenRequestQueryParams,
} from '@/v2/controllers/types/params/app-tokens/get-app-token.params.js';
import GetAppTokenRes, {
	GetAppTokenErrorCode,
	GetAppTokenResApiKeyData,
} from '@/v2/controllers/types/responses/app-tokens/get-app-token.response.js';
import {
	GetAppTokenServiceErrorCode,
	GetAppTokenServiceResApiKeyData,
} from '@/v2/services/types/responses/app-tokens/get-app-token.response.js';
import {
	RegenerateAppTokenRequestBody,
	RegenerateAppTokenRequestQueryParams,
} from '@/v2/controllers/types/params/app-tokens/regenerate-app-token.params.js';
import RegenerateAppTokenRes, {
	RegenerateAppTokenErrorCode,
	RegenerateAppTokenResApiKeyData,
} from '@/v2/controllers/types/responses/app-tokens/regenerate-app-token.response.js';
import {
	RegenerateAppTokenServiceErrorCode,
	RegenerateAppTokenServiceResApiKeyData,
} from '@/v2/services/types/responses/app-tokens/regenerate-app-token.response.js';
import appTokensService from '@/v2/services/app-tokens.service.js';
import { Decimal } from 'decimal.js';
import {
	UpdateAppNameRequestBody,
	UpdateAppNameRequestQueryParams,
} from '@/v2/controllers/types/params/apps/update-app-name.params.js';
import appsService from '@/v2/services/apps.service.js';

class AppsController {
	private createSuccessResponseMapper = (
		createAppServiceResAppData: CreateAppServiceResAppData,
	): CreateAppResAppData => {
		const param = createAppServiceResAppData;

		return {
			id: param.id,
			name: param.name,
		};
	};

	create = async (req: Request, res: Response<CreateAppRes>) => {
		const body = req.body as CreateAppRequestBody;
		const { name, userData } = body;

		const result = await appsService.create({ name, address: userData.address });

		if (!result.success) {
			const errorCode = result.data;

			switch (errorCode) {
				case CreateAppServiceErrorCode.NAME_TAKEN:
					res.status(400).send({ success: false, data: CreateAppErrorCode.NAME_TAKEN });
					return;

				case CreateAppServiceErrorCode.APP_LIMIT_REACHED:
					res.status(400).send({
						success: false,
						data: CreateAppErrorCode.APP_LIMIT_REACHED,
					});
					return;

				case CreateAppServiceErrorCode.USER_NOT_FOUND:
					throw new Error('JWT token of non-existent user');

				default: {
					const unhandledErrorCode: never = errorCode;
					throw new Error(
						`Unhandled apps service error: ${JSON.stringify(unhandledErrorCode)}`,
					);
				}
			}
		}

		res.status(200).send({
			success: true,
			data: this.createSuccessResponseMapper(result.data),
		});
	};

	private getAllSuccessResponseMapper = (
		getAllAppsServiceResAppData: GetAllAppsServiceResAppData[],
	): GetAllAppsResAppData[] => {
		const param = getAllAppsServiceResAppData;

		return param.map((appData) => ({
			id: appData.id,
			name: appData.name,
			apiKeyExists: appData.apiKeyExists,
		}));
	};

	getAll = async (req: Request, res: Response<GetAllAppsRes>) => {
		const body = req.body as GetAllAppsRequestBody;
		const { userData } = body;

		const result = await appsService.getAll({ address: userData.address });

		if (!result.success) {
			const errorCode = result.data;

			if (errorCode === GetAllAppsServiceErrorCode.USER_NOT_FOUND) {
				throw new Error('JWT token of non-existent user');
			} else {
				const unhandledErrorCode: never = errorCode;
				throw new Error(
					`Unhandled apps service error: ${JSON.stringify(unhandledErrorCode)}`,
				);
			}
		}

		res.status(200).send({
			success: true,
			data: this.getAllSuccessResponseMapper(result.data),
		});
	};

	private getOneSuccessResponseMapper = (
		getAppServiceResAppData: GetAppServiceResAppData,
	): GetAppResAppData => {
		const param = getAppServiceResAppData;

		return {
			id: param.id,
			name: param.name,
			apiKeyExists: param.apiKey !== null,
		};
	};

	getOne = async (req: Request, res: Response<GetAppRes>) => {
		const body = req.body as GetAppRequestBody;
		const params = req.params as unknown as GetAppRequestQueryParams;

		const { userData } = body;

		const result = await appsService.getOne({
			appId: new Decimal(params.appId).toNumber(),
			address: userData.address,
		});

		if (!result.success) {
			const errorCode = result.data;

			switch (errorCode) {
				case GetAppServiceErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: GetAppErrorCode.APP_NOT_FOUND,
					});
					return;

				case GetAppServiceErrorCode.USER_NOT_FOUND:
					throw new Error('JWT token of non-existent user');

				default: {
					const unhandledErrorCode: never = errorCode;
					throw new Error(
						`Unhandled apps service error: ${JSON.stringify(unhandledErrorCode)}`,
					);
				}
			}
		}

		res.status(200).send({
			success: true,
			data: this.getOneSuccessResponseMapper(result.data),
		});
	};

	private updateNameSuccessResponseMapper = (
		updateAppNameServiceResAppData: UpdateAppNameServiceResAppData,
	): UpdateAppNameResAppData => {
		const param = updateAppNameServiceResAppData;

		return {
			id: param.id,
			name: param.name,
		};
	};

	updateName = async (req: Request, res: Response<UpdateAppNameRes>) => {
		const body = req.body as UpdateAppNameRequestBody;
		const params = req.params as unknown as UpdateAppNameRequestQueryParams;

		const { name, userData } = body;

		const result = await appsService.updateName({
			appId: new Decimal(params.appId).toNumber(),
			address: userData.address,
			name,
		});

		if (!result.success) {
			const errorCode = result.data;

			switch (errorCode) {
				case UpdateAppNameServiceErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: UpdateAppNameErrorCode.APP_NOT_FOUND,
					});
					return;

				case UpdateAppNameServiceErrorCode.NAME_TAKEN:
					res.status(400).send({
						success: false,
						data: UpdateAppNameErrorCode.NAME_TAKEN,
					});
					return;

				case UpdateAppNameServiceErrorCode.USER_NOT_FOUND:
					throw new Error('JWT token of non-existent user');

				default: {
					const unhandledErrorCode: never = errorCode;
					throw new Error(
						`Unhandled apps service error: ${JSON.stringify(unhandledErrorCode)}`,
					);
				}
			}
		}

		res.status(200).send({
			success: true,
			data: this.updateNameSuccessResponseMapper(result.data),
		});
	};

	private deleteSuccessResponseMapper = (
		deleteAppServiceResAppData: DeleteAppServiceResAppData,
	): DeleteAppResAppData => {
		const param = deleteAppServiceResAppData;

		return {
			id: param.id,
		};
	};

	delete = async (req: Request, res: Response<DeleteAppRes>) => {
		const body = req.body as DeleteAppRequestBody;
		const params = req.params as unknown as DeleteAppRequestQueryParams;

		const { userData } = body;

		const result = await appsService.delete({
			appId: new Decimal(params.appId).toNumber(),
			address: userData.address,
		});

		if (!result.success) {
			const errorCode = result.data;

			switch (errorCode) {
				case DeleteAppServiceErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: DeleteAppErrorCode.APP_NOT_FOUND,
					});
					return;

				case DeleteAppServiceErrorCode.USER_NOT_FOUND:
					throw new Error('JWT token of non-existent user');

				default: {
					const unhandledErrorCode: never = errorCode;
					throw new Error(
						`Unhandled apps service error: ${JSON.stringify(unhandledErrorCode)}`,
					);
				}
			}
		}

		res.status(200).send({
			success: true,
			data: this.deleteSuccessResponseMapper(result.data),
		});
	};

	private createApiKeySuccessResponseMapper = (
		createAppTokenServiceResApiKeyData: CreateAppTokenServiceResApiKeyData,
	): CreateAppTokenResApiKeyData => {
		const param = createAppTokenServiceResApiKeyData;

		return {
			valueEncryptedHex: param.valueEncryptedHex,
			issuedAtEncryptedHex: param.issuedAtEncryptedHex,
			intermediateEncryptionPublicKeyHex: param.intermediateEncryptionPublicKeyHex,
		};
	};

	createApiKey = async (req: Request, res: Response<CreateAppTokenRes>) => {
		const body = req.body as CreateAppTokenRequestBody;
		const params = req.params as unknown as CreateAppTokenRequestQueryParams;

		const { userData, publicKeyHex } = body;

		const result = await appTokensService.create({
			appId: new Decimal(params.appId).toNumber(),
			address: userData.address,
			publicKeyHex,
		});

		if (!result.success) {
			const errorCode = result.data;

			switch (errorCode) {
				case CreateAppTokenServiceErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: CreateAppTokenErrorCode.APP_NOT_FOUND,
					});
					return;

				case CreateAppTokenServiceErrorCode.API_KEY_ALREADY_EXISTS:
					res.status(400).send({
						success: false,
						data: CreateAppTokenErrorCode.API_KEY_ALREADY_EXISTS,
					});
					return;

				case CreateAppTokenServiceErrorCode.USER_NOT_FOUND:
					throw new Error('JWT token of non-existent user');

				default: {
					const unhandledErrorCode: never = errorCode;
					throw new Error(
						`Unhandled app tokens service error: ${JSON.stringify(unhandledErrorCode)}`,
					);
				}
			}
		}

		res.status(200).send({
			success: true,
			data: this.createApiKeySuccessResponseMapper(result.data),
		});
	};

	private regenerateApiKeySuccessResponseMapper = (
		regenerateAppTokenServiceResApiKeyData: RegenerateAppTokenServiceResApiKeyData,
	): RegenerateAppTokenResApiKeyData => {
		const param = regenerateAppTokenServiceResApiKeyData;

		return {
			valueEncryptedHex: param.valueEncryptedHex,
			issuedAtEncryptedHex: param.issuedAtEncryptedHex,
			intermediateEncryptionPublicKeyHex: param.intermediateEncryptionPublicKeyHex,
		};
	};

	regenerateApiKey = async (req: Request, res: Response<RegenerateAppTokenRes>) => {
		const body = req.body as RegenerateAppTokenRequestBody;
		const params = req.params as unknown as RegenerateAppTokenRequestQueryParams;

		const { userData, publicKeyHex } = body;

		const result = await appTokensService.regenerate({
			appId: new Decimal(params.appId).toNumber(),
			address: userData.address,
			publicKeyHex,
		});

		if (!result.success) {
			const errorCode = result.data;

			switch (errorCode) {
				case RegenerateAppTokenServiceErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: RegenerateAppTokenErrorCode.APP_NOT_FOUND,
					});
					return;

				case RegenerateAppTokenServiceErrorCode.API_KEY_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: RegenerateAppTokenErrorCode.API_KEY_NOT_FOUND,
					});
					return;

				case RegenerateAppTokenServiceErrorCode.USER_NOT_FOUND:
					throw new Error('JWT token of non-existent user');

				default: {
					const unhandledErrorCode: never = errorCode;
					throw new Error(
						`Unhandled app tokens service error: ${JSON.stringify(unhandledErrorCode)}`,
					);
				}
			}
		}

		res.status(200).send({
			success: true,
			data: this.regenerateApiKeySuccessResponseMapper(result.data),
		});
	};

	private getApiKeySuccessResponseMapper = (
		getAppTokenServiceResApiKeyData: GetAppTokenServiceResApiKeyData,
	): GetAppTokenResApiKeyData => {
		const param = getAppTokenServiceResApiKeyData;

		return {
			valueEncryptedHex: param.valueEncryptedHex,
			issuedAtEncryptedHex: param.issuedAtEncryptedHex,
			intermediateEncryptionPublicKeyHex: param.intermediateEncryptionPublicKeyHex,
		};
	};

	getApiKey = async (req: Request, res: Response<GetAppTokenRes>) => {
		const body = req.body as GetAppTokenRequestBody;
		const { appId } = req.params as unknown as GetAppTokenRequestQueryParams;

		const { userData, publicKeyHex } = body;

		const result = await appTokensService.getOne({
			appId: new Decimal(appId).toNumber(),
			address: userData.address,
			publicKeyHex,
		});

		if (!result.success) {
			const errorCode = result.data;

			switch (errorCode) {
				case GetAppTokenServiceErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: GetAppTokenErrorCode.APP_NOT_FOUND,
					});
					return;

				case GetAppTokenServiceErrorCode.API_KEY_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: GetAppTokenErrorCode.API_KEY_NOT_FOUND,
					});
					return;

				case GetAppTokenServiceErrorCode.USER_NOT_FOUND:
					throw new Error('JWT token of non-existent user');

				default: {
					const unhandledErrorCode: never = errorCode;
					throw new Error(
						`Unhandled app tokens service error: ${JSON.stringify(unhandledErrorCode)}`,
					);
				}
			}
		}

		res.status(200).send({
			success: true,
			data: this.getApiKeySuccessResponseMapper(result.data),
		});
	};
}

const appsController = new AppsController();

export default appsController;
