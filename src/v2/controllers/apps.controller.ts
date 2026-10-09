import { Request, Response } from 'express';
import { appTokensService } from '@/v2/services/app-tokens.service.js';
import { Decimal } from 'decimal.js';
import { appsService } from '@/v2/services/apps.service.js';
import { Controllers } from '@/v2/controllers/types';
import { Services } from '@/v2/services/types';

class AppsController {
	private createSuccessResponseMapper = (
		createAppServiceResAppData: Services.Responses.CreateAppDTOAppData,
	): Controllers.Responses.CreateAppDTOAppData => {
		const param = createAppServiceResAppData;

		return {
			id: param.id,
			name: param.name,
		};
	};

	create = async (req: Request, res: Response<Controllers.Responses.CreateAppDTO>) => {
		const body = req.body as Controllers.Params.CreateAppBodyDTO;
		const { name, userData } = body;

		const result = await appsService.create({ name, address: userData.address });

		if (!result.success) {
			const errorCode = result.data;

			switch (errorCode) {
				case Services.Responses.CreateAppErrorCode.NAME_TAKEN:
					res.status(400).send({
						success: false,
						error: { code: Controllers.Responses.CreateAppErrorCode.NAME_TAKEN },
					});
					return;

				case Services.Responses.CreateAppErrorCode.APP_LIMIT_REACHED:
					res.status(400).send({
						success: false,
						error: { code: Controllers.Responses.CreateAppErrorCode.APP_LIMIT_REACHED },
					});
					return;

				case Services.Responses.CreateAppErrorCode.USER_NOT_FOUND:
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
			result: this.createSuccessResponseMapper(result.data),
		});
	};

	private getAllSuccessResponseMapper = (
		getAllAppsServiceResAppData: Services.Responses.GetAllAppsDTOAppData[],
	): Controllers.Responses.GetAllAppsDTOAppData[] => {
		const param = getAllAppsServiceResAppData;

		return param.map((appData) => ({
			id: appData.id,
			name: appData.name,
			apiKeyExists: appData.apiKeyExists,
		}));
	};

	getAll = async (req: Request, res: Response<Controllers.Responses.GetAllAppsDTO>) => {
		const body = req.body as Controllers.Params.GetAllAppsBodyDTO;
		const { userData } = body;

		const result = await appsService.getAll({ address: userData.address });

		if (!result.success) {
			const errorCode = result.data;

			if (errorCode === Services.Responses.GetAllAppsErrorCode.USER_NOT_FOUND) {
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
			result: this.getAllSuccessResponseMapper(result.data),
		});
	};

	private getOneSuccessResponseMapper = (
		getAppServiceResAppData: Services.Responses.GetAppDTOAppData,
	): Controllers.Responses.GetAppDTOAppData => {
		const param = getAppServiceResAppData;

		return {
			id: param.id,
			name: param.name,
			apiKeyExists: param.apiKey !== null,
		};
	};

	getOne = async (req: Request, res: Response<Controllers.Responses.GetAppDTO>) => {
		const body = req.body as Controllers.Params.GetAppBodyDTO;
		const params = req.params as unknown as Controllers.Params.GetAppQueryParamsDTO;

		const { userData } = body;

		const result = await appsService.getOne({
			appId: new Decimal(params.appId).toNumber(),
			address: userData.address,
		});

		if (!result.success) {
			const errorCode = result.data;

			switch (errorCode) {
				case Services.Responses.GetAppErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						error: { code: Controllers.Responses.GetAppErrorCode.APP_NOT_FOUND },
					});
					return;

				case Services.Responses.GetAppErrorCode.USER_NOT_FOUND:
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
			result: this.getOneSuccessResponseMapper(result.data),
		});
	};

	private updateNameSuccessResponseMapper = (
		updateAppNameServiceResAppData: Services.Responses.UpdateAppNameDTOAppData,
	): Controllers.Responses.UpdateAppNameDTOAppData => {
		const param = updateAppNameServiceResAppData;

		return {
			id: param.id,
			name: param.name,
		};
	};

	updateName = async (req: Request, res: Response<Controllers.Responses.UpdateAppNameDTO>) => {
		const body = req.body as Controllers.Params.UpdateAppNameBodyDTO;
		const params = req.params as unknown as Controllers.Params.UpdateAppNameQueryParamsDTO;

		const { name, userData } = body;

		const result = await appsService.updateName({
			appId: new Decimal(params.appId).toNumber(),
			address: userData.address,
			name,
		});

		if (!result.success) {
			const errorCode = result.data;

			switch (errorCode) {
				case Services.Responses.UpdateAppNameErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						error: { code: Controllers.Responses.UpdateAppNameErrorCode.APP_NOT_FOUND },
					});
					return;

				case Services.Responses.UpdateAppNameErrorCode.NAME_TAKEN:
					res.status(400).send({
						success: false,
						error: { code: Controllers.Responses.UpdateAppNameErrorCode.NAME_TAKEN },
					});
					return;

				case Services.Responses.UpdateAppNameErrorCode.USER_NOT_FOUND:
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
			result: this.updateNameSuccessResponseMapper(result.data),
		});
	};

	private deleteSuccessResponseMapper = (
		deleteAppServiceResAppData: Services.Responses.DeleteAppDTOAppData,
	): Controllers.Responses.DeleteAppDTOAppData => {
		const param = deleteAppServiceResAppData;

		return {
			id: param.id,
		};
	};

	delete = async (req: Request, res: Response<Controllers.Responses.DeleteAppDTO>) => {
		const body = req.body as Controllers.Params.DeleteAppBodyDTO;
		const params = req.params as unknown as Controllers.Params.DeleteAppQueryParamsDTO;

		const { userData } = body;

		const result = await appsService.delete({
			appId: new Decimal(params.appId).toNumber(),
			address: userData.address,
		});

		if (!result.success) {
			const errorCode = result.data;

			switch (errorCode) {
				case Services.Responses.DeleteAppErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						error: { code: Controllers.Responses.DeleteAppErrorCode.APP_NOT_FOUND },
					});
					return;

				case Services.Responses.DeleteAppErrorCode.USER_NOT_FOUND:
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
			result: this.deleteSuccessResponseMapper(result.data),
		});
	};

	private createApiKeySuccessResponseMapper = (
		createAppTokenServiceResApiKeyData: Services.Responses.CreateAppTokenDTOApiKeyData,
	): Controllers.Responses.CreateAppTokenDTOApiKeyData => {
		const param = createAppTokenServiceResApiKeyData;

		return {
			valueEncryptedHex: param.valueEncryptedHex,
			issuedAtEncryptedHex: param.issuedAtEncryptedHex,
			intermediateEncryptionPublicKeyHex: param.intermediateEncryptionPublicKeyHex,
		};
	};

	createApiKey = async (req: Request, res: Response<Controllers.Responses.CreateAppTokenDTO>) => {
		const body = req.body as Controllers.Params.CreateAppTokenBodyDTO;
		const params = req.params as unknown as Controllers.Params.CreateAppTokenQueryParamsDTO;

		const { userData, publicKeyHex } = body;

		const result = await appTokensService.create({
			appId: new Decimal(params.appId).toNumber(),
			address: userData.address,
			publicKeyHex,
		});

		if (!result.success) {
			const errorCode = result.data;

			switch (errorCode) {
				case Services.Responses.CreateAppTokenErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						error: {
							code: Controllers.Responses.CreateAppTokenErrorCode.APP_NOT_FOUND,
						},
					});
					return;

				case Services.Responses.CreateAppTokenErrorCode.API_KEY_ALREADY_EXISTS:
					res.status(400).send({
						success: false,
						error: {
							code: Controllers.Responses.CreateAppTokenErrorCode
								.API_KEY_ALREADY_EXISTS,
						},
					});
					return;

				case Services.Responses.CreateAppTokenErrorCode.USER_NOT_FOUND:
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
			result: this.createApiKeySuccessResponseMapper(result.data),
		});
	};

	private regenerateApiKeySuccessResponseMapper = (
		regenerateAppTokenServiceResApiKeyData: Services.Responses.RegenerateAppTokenDTOApiKeyData,
	): Controllers.Responses.RegenerateAppTokenDTOApiKeyData => {
		const param = regenerateAppTokenServiceResApiKeyData;

		return {
			valueEncryptedHex: param.valueEncryptedHex,
			issuedAtEncryptedHex: param.issuedAtEncryptedHex,
			intermediateEncryptionPublicKeyHex: param.intermediateEncryptionPublicKeyHex,
		};
	};

	regenerateApiKey = async (
		req: Request,
		res: Response<Controllers.Responses.RegenerateAppTokenDTO>,
	) => {
		const body = req.body as Controllers.Params.RegenerateAppTokenBodyDTO;
		const params = req.params as unknown as Controllers.Params.RegenerateAppTokenQueryParamsDTO;

		const { userData, publicKeyHex } = body;

		const result = await appTokensService.regenerate({
			appId: new Decimal(params.appId).toNumber(),
			address: userData.address,
			publicKeyHex,
		});

		if (!result.success) {
			const errorCode = result.data;

			switch (errorCode) {
				case Services.Responses.RegenerateAppTokenErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						error: {
							code: Controllers.Responses.RegenerateAppTokenErrorCode.APP_NOT_FOUND,
						},
					});
					return;

				case Services.Responses.RegenerateAppTokenErrorCode.API_KEY_NOT_FOUND:
					res.status(400).send({
						success: false,
						error: {
							code: Controllers.Responses.RegenerateAppTokenErrorCode
								.API_KEY_NOT_FOUND,
						},
					});
					return;

				case Services.Responses.RegenerateAppTokenErrorCode.USER_NOT_FOUND:
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
			result: this.regenerateApiKeySuccessResponseMapper(result.data),
		});
	};

	private getApiKeySuccessResponseMapper = (
		getAppTokenServiceResApiKeyData: Services.Responses.GetAppTokenDTOApiKeyData,
	): Controllers.Responses.GetAppTokenDTOApiKeyData => {
		const param = getAppTokenServiceResApiKeyData;

		return {
			valueEncryptedHex: param.valueEncryptedHex,
			issuedAtEncryptedHex: param.issuedAtEncryptedHex,
			intermediateEncryptionPublicKeyHex: param.intermediateEncryptionPublicKeyHex,
		};
	};

	getApiKey = async (req: Request, res: Response<Controllers.Responses.GetAppTokenDTO>) => {
		const body = req.body as Controllers.Params.GetAppTokenBodyDTO;
		const { appId } = req.params as unknown as Controllers.Params.GetAppTokenQueryParamsDTO;

		const { userData, publicKeyHex } = body;

		const result = await appTokensService.getOne({
			appId: new Decimal(appId).toNumber(),
			address: userData.address,
			publicKeyHex,
		});

		if (!result.success) {
			const errorCode = result.data;

			switch (errorCode) {
				case Services.Responses.GetAppTokenErrorCode.APP_NOT_FOUND:
					res.status(400).send({
						success: false,
						error: { code: Controllers.Responses.GetAppTokenErrorCode.APP_NOT_FOUND },
					});
					return;

				case Services.Responses.GetAppTokenErrorCode.API_KEY_NOT_FOUND:
					res.status(400).send({
						success: false,
						error: {
							code: Controllers.Responses.GetAppTokenErrorCode.API_KEY_NOT_FOUND,
						},
					});
					return;

				case Services.Responses.GetAppTokenErrorCode.USER_NOT_FOUND:
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
			result: this.getApiKeySuccessResponseMapper(result.data),
		});
	};
}

export const appsController = new AppsController();
