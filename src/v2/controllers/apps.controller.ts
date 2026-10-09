import { Request, Response } from 'express';
import {
	CreateAppServiceErrorCode,
	CreateAppServiceResAppData,
} from '@/v2/services/types/responses/apps/create-app.response.js';
import {
	GetAllAppsServiceErrorCode,
	GetAllAppsServiceResAppData,
} from '@/v2/services/types/responses/apps/get-all-apps.response.js';
import {
	GetAppServiceErrorCode,
	GetAppServiceResAppData,
} from '@/v2/services/types/responses/apps/get-app.response.js';
import {
	UpdateAppNameServiceErrorCode,
	UpdateAppNameServiceResAppData,
} from '@/v2/services/types/responses/apps/update-app-name.response.js';
import {
	DeleteAppServiceErrorCode,
	DeleteAppServiceResAppData,
} from '@/v2/services/types/responses/apps/delete-app.response.js';
import {
	CreateAppTokenServiceErrorCode,
	CreateAppTokenServiceResApiKeyData,
} from '@/v2/services/types/responses/app-tokens/create-app-token.response.js';
import {
	GetAppTokenServiceErrorCode,
	GetAppTokenServiceResApiKeyData,
} from '@/v2/services/types/responses/app-tokens/get-app-token.response.js';
import {
	RegenerateAppTokenServiceErrorCode,
	RegenerateAppTokenServiceResApiKeyData,
} from '@/v2/services/types/responses/app-tokens/regenerate-app-token.response.js';
import { appTokensService } from '@/v2/services/app-tokens.service.js';
import { Decimal } from 'decimal.js';
import { appsService } from '@/v2/services/apps.service.js';
import { Controllers } from '@/v2/controllers/types';

class AppsController {
	private createSuccessResponseMapper = (
		createAppServiceResAppData: CreateAppServiceResAppData,
	): Controllers.Responses.CreateAppResAppData => {
		const param = createAppServiceResAppData;

		return {
			id: param.id,
			name: param.name,
		};
	};

	create = async (req: Request, res: Response<Controllers.Responses.CreateAppRes>) => {
		const body = req.body as Controllers.Params.CreateAppRequestBody;
		const { name, userData } = body;

		const result = await appsService.create({ name, address: userData.address });

		if (!result.success) {
			const errorCode = result.data;

			switch (errorCode) {
				case CreateAppServiceErrorCode.NAME_TAKEN:
					res.status(400).send({
						success: false,
						data: Controllers.Responses.CreateAppErrorCode.NAME_TAKEN,
					});
					return;

				case CreateAppServiceErrorCode.APP_LIMIT_REACHED:
					res.status(400).send({
						success: false,
						data: Controllers.Responses.CreateAppErrorCode.APP_LIMIT_REACHED,
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
	): Controllers.Responses.GetAllAppsResAppData[] => {
		const param = getAllAppsServiceResAppData;

		return param.map((appData) => ({
			id: appData.id,
			name: appData.name,
			apiKeyExists: appData.apiKeyExists,
		}));
	};

	getAll = async (req: Request, res: Response<Controllers.Responses.GetAllAppsRes>) => {
		const body = req.body as Controllers.Params.GetAllAppsRequestBody;
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
	): Controllers.Responses.GetAppResAppData => {
		const param = getAppServiceResAppData;

		return {
			id: param.id,
			name: param.name,
			apiKeyExists: param.apiKey !== null,
		};
	};

	getOne = async (req: Request, res: Response<Controllers.Responses.GetAppRes>) => {
		const body = req.body as Controllers.Params.GetAppRequestBody;
		const params = req.params as unknown as Controllers.Params.GetAppRequestQueryParams;

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
						data: Controllers.Responses.GetAppErrorCode.APP_NOT_FOUND,
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
	): Controllers.Responses.UpdateAppNameResAppData => {
		const param = updateAppNameServiceResAppData;

		return {
			id: param.id,
			name: param.name,
		};
	};

	updateName = async (req: Request, res: Response<Controllers.Responses.UpdateAppNameRes>) => {
		const body = req.body as Controllers.Params.UpdateAppNameRequestBody;
		const params = req.params as unknown as Controllers.Params.UpdateAppNameRequestQueryParams;

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
						data: Controllers.Responses.UpdateAppNameErrorCode.APP_NOT_FOUND,
					});
					return;

				case UpdateAppNameServiceErrorCode.NAME_TAKEN:
					res.status(400).send({
						success: false,
						data: Controllers.Responses.UpdateAppNameErrorCode.NAME_TAKEN,
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
	): Controllers.Responses.DeleteAppResAppData => {
		const param = deleteAppServiceResAppData;

		return {
			id: param.id,
		};
	};

	delete = async (req: Request, res: Response<Controllers.Responses.DeleteAppRes>) => {
		const body = req.body as Controllers.Params.DeleteAppRequestBody;
		const params = req.params as unknown as Controllers.Params.DeleteAppRequestQueryParams;

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
						data: Controllers.Responses.DeleteAppErrorCode.APP_NOT_FOUND,
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
	): Controllers.Responses.CreateAppTokenResApiKeyData => {
		const param = createAppTokenServiceResApiKeyData;

		return {
			valueEncryptedHex: param.valueEncryptedHex,
			issuedAtEncryptedHex: param.issuedAtEncryptedHex,
			intermediateEncryptionPublicKeyHex: param.intermediateEncryptionPublicKeyHex,
		};
	};

	createApiKey = async (req: Request, res: Response<Controllers.Responses.CreateAppTokenRes>) => {
		const body = req.body as Controllers.Params.CreateAppTokenRequestBody;
		const params = req.params as unknown as Controllers.Params.CreateAppTokenRequestQueryParams;

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
						data: Controllers.Responses.CreateAppTokenErrorCode.APP_NOT_FOUND,
					});
					return;

				case CreateAppTokenServiceErrorCode.API_KEY_ALREADY_EXISTS:
					res.status(400).send({
						success: false,
						data: Controllers.Responses.CreateAppTokenErrorCode.API_KEY_ALREADY_EXISTS,
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
	): Controllers.Responses.RegenerateAppTokenResApiKeyData => {
		const param = regenerateAppTokenServiceResApiKeyData;

		return {
			valueEncryptedHex: param.valueEncryptedHex,
			issuedAtEncryptedHex: param.issuedAtEncryptedHex,
			intermediateEncryptionPublicKeyHex: param.intermediateEncryptionPublicKeyHex,
		};
	};

	regenerateApiKey = async (
		req: Request,
		res: Response<Controllers.Responses.RegenerateAppTokenRes>,
	) => {
		const body = req.body as Controllers.Params.RegenerateAppTokenRequestBody;
		const params =
			req.params as unknown as Controllers.Params.RegenerateAppTokenRequestQueryParams;

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
						data: Controllers.Responses.RegenerateAppTokenErrorCode.APP_NOT_FOUND,
					});
					return;

				case RegenerateAppTokenServiceErrorCode.API_KEY_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: Controllers.Responses.RegenerateAppTokenErrorCode.API_KEY_NOT_FOUND,
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
	): Controllers.Responses.GetAppTokenResApiKeyData => {
		const param = getAppTokenServiceResApiKeyData;

		return {
			valueEncryptedHex: param.valueEncryptedHex,
			issuedAtEncryptedHex: param.issuedAtEncryptedHex,
			intermediateEncryptionPublicKeyHex: param.intermediateEncryptionPublicKeyHex,
		};
	};

	getApiKey = async (req: Request, res: Response<Controllers.Responses.GetAppTokenRes>) => {
		const body = req.body as Controllers.Params.GetAppTokenRequestBody;
		const { appId } = req.params as unknown as Controllers.Params.GetAppTokenRequestQueryParams;

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
						data: Controllers.Responses.GetAppTokenErrorCode.APP_NOT_FOUND,
					});
					return;

				case GetAppTokenServiceErrorCode.API_KEY_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: Controllers.Responses.GetAppTokenErrorCode.API_KEY_NOT_FOUND,
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

export const appsController = new AppsController();
