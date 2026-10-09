import { Request, Response } from 'express';
import { appTokensService } from '@/v2/services/app-tokens.service.js';
import { Decimal } from 'decimal.js';
import { appsService } from '@/v2/services/apps.service.js';
import { Controllers } from '@/v2/controllers/types';
import { Services } from '@/v2/services/types';

class AppsController {
	private createSuccessResponseMapper = (
		createAppServiceResAppData: Services.Responses.CreateAppServiceResAppData,
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
				case Services.Responses.CreateAppServiceErrorCode.NAME_TAKEN:
					res.status(400).send({
						success: false,
						data: Controllers.Responses.CreateAppErrorCode.NAME_TAKEN,
					});
					return;

				case Services.Responses.CreateAppServiceErrorCode.APP_LIMIT_REACHED:
					res.status(400).send({
						success: false,
						data: Controllers.Responses.CreateAppErrorCode.APP_LIMIT_REACHED,
					});
					return;

				case Services.Responses.CreateAppServiceErrorCode.USER_NOT_FOUND:
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
		getAllAppsServiceResAppData: Services.Responses.GetAllAppsServiceResAppData[],
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

			if (errorCode === Services.Responses.GetAllAppsServiceErrorCode.USER_NOT_FOUND) {
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
		getAppServiceResAppData: Services.Responses.GetAppServiceResAppData,
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
				case Services.Responses.GetAppServiceErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: Controllers.Responses.GetAppErrorCode.APP_NOT_FOUND,
					});
					return;

				case Services.Responses.GetAppServiceErrorCode.USER_NOT_FOUND:
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
		updateAppNameServiceResAppData: Services.Responses.UpdateAppNameServiceResAppData,
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
				case Services.Responses.UpdateAppNameServiceErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: Controllers.Responses.UpdateAppNameErrorCode.APP_NOT_FOUND,
					});
					return;

				case Services.Responses.UpdateAppNameServiceErrorCode.NAME_TAKEN:
					res.status(400).send({
						success: false,
						data: Controllers.Responses.UpdateAppNameErrorCode.NAME_TAKEN,
					});
					return;

				case Services.Responses.UpdateAppNameServiceErrorCode.USER_NOT_FOUND:
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
		deleteAppServiceResAppData: Services.Responses.DeleteAppServiceResAppData,
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
				case Services.Responses.DeleteAppServiceErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: Controllers.Responses.DeleteAppErrorCode.APP_NOT_FOUND,
					});
					return;

				case Services.Responses.DeleteAppServiceErrorCode.USER_NOT_FOUND:
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
		createAppTokenServiceResApiKeyData: Services.Responses.CreateAppTokenServiceResApiKeyData,
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
				case Services.Responses.CreateAppTokenServiceErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: Controllers.Responses.CreateAppTokenErrorCode.APP_NOT_FOUND,
					});
					return;

				case Services.Responses.CreateAppTokenServiceErrorCode.API_KEY_ALREADY_EXISTS:
					res.status(400).send({
						success: false,
						data: Controllers.Responses.CreateAppTokenErrorCode.API_KEY_ALREADY_EXISTS,
					});
					return;

				case Services.Responses.CreateAppTokenServiceErrorCode.USER_NOT_FOUND:
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
		regenerateAppTokenServiceResApiKeyData: Services.Responses.RegenerateAppTokenServiceResApiKeyData,
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
				case Services.Responses.RegenerateAppTokenServiceErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: Controllers.Responses.RegenerateAppTokenErrorCode.APP_NOT_FOUND,
					});
					return;

				case Services.Responses.RegenerateAppTokenServiceErrorCode.API_KEY_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: Controllers.Responses.RegenerateAppTokenErrorCode.API_KEY_NOT_FOUND,
					});
					return;

				case Services.Responses.RegenerateAppTokenServiceErrorCode.USER_NOT_FOUND:
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
		getAppTokenServiceResApiKeyData: Services.Responses.GetAppTokenServiceResApiKeyData,
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
				case Services.Responses.GetAppTokenServiceErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: Controllers.Responses.GetAppTokenErrorCode.APP_NOT_FOUND,
					});
					return;

				case Services.Responses.GetAppTokenServiceErrorCode.API_KEY_NOT_FOUND:
					res.status(400).send({
						success: false,
						data: Controllers.Responses.GetAppTokenErrorCode.API_KEY_NOT_FOUND,
					});
					return;

				case Services.Responses.GetAppTokenServiceErrorCode.USER_NOT_FOUND:
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
