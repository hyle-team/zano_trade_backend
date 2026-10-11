import { RequestHandler, Response } from 'express';
import { Decimal } from 'decimal.js';

import { appTokensService } from '@/v2/services/app-tokens.service.js';
import { appsService } from '@/v2/services/apps.service.js';
import { Controllers } from '@/v2/controllers/types';
import { Services } from '@/v2/services/types';
import { assertNever } from '@/v2/utils/assert-never';

class AppsController {
	private createSuccessResponseMapper = (
		createAppDTOAppData: Services.Responses.CreateAppDTOAppData,
	): Controllers.Responses.CreateAppDTOAppData => {
		const param = createAppDTOAppData;

		return {
			id: param.id,
			name: param.name,
		};
	};

	private createErrorResponseMapper = ({
		res,
		serviceErrorDTO,
	}: {
		res: Response<Controllers.Responses.CreateAppDTO>;
		serviceErrorDTO: Services.Responses.CreateAppErrorDTO;
	}): void => {
		const errorCode = serviceErrorDTO.data;

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
				assertNever(errorCode);
			}
		}
	};

	create: RequestHandler<
		unknown,
		Controllers.Responses.CreateAppDTO,
		Controllers.Params.CreateAppBodyDTO
	> = async (req, res) => {
		const { name, userData } = req.body;

		const result = await appsService.create({ name, address: userData.address });

		if (!result.success) {
			this.createErrorResponseMapper({
				res,
				serviceErrorDTO: result,
			});
			return;
		}

		res.status(200).send({
			success: true,
			result: this.createSuccessResponseMapper(result.data),
		});
	};

	private getAllSuccessResponseMapper = (
		getAllAppsDTOAppData: Services.Responses.GetAllAppsDTOAppData[],
	): Controllers.Responses.GetAllAppsDTOAppData[] => {
		const param = getAllAppsDTOAppData;

		return param.map((appData) => ({
			id: appData.id,
			name: appData.name,
			apiKeyExists: appData.apiKeyExists,
		}));
	};

	private getAllErrorResponseMapper = ({
		serviceErrorDTO,
	}: {
		res: Response<Controllers.Responses.GetAllAppsDTO>;
		serviceErrorDTO: Services.Responses.GetAllAppsErrorDTO;
	}): void => {
		const errorCode = serviceErrorDTO.data;

		if (errorCode === Services.Responses.GetAllAppsErrorCode.USER_NOT_FOUND) {
			throw new Error('JWT token of non-existent user');
		} else {
			assertNever(errorCode);
		}
	};

	getAll: RequestHandler<
		unknown,
		Controllers.Responses.GetAllAppsDTO,
		Controllers.Params.GetAllAppsBodyDTO
	> = async (req, res) => {
		const { userData } = req.body;

		const result = await appsService.getAll({ address: userData.address });

		if (!result.success) {
			this.getAllErrorResponseMapper({
				res,
				serviceErrorDTO: result,
			});
			return;
		}

		res.status(200).send({
			success: true,
			result: this.getAllSuccessResponseMapper(result.data),
		});
	};

	private getOneSuccessResponseMapper = (
		getAppDTOAppData: Services.Responses.GetAppDTOAppData,
	): Controllers.Responses.GetAppDTOAppData => {
		const param = getAppDTOAppData;

		return {
			id: param.id,
			name: param.name,
			apiKeyExists: param.apiKey !== null,
		};
	};

	private getOneErrorResponseMapper = ({
		res,
		serviceErrorDTO,
	}: {
		res: Response<Controllers.Responses.GetAppDTO>;
		serviceErrorDTO: Services.Responses.GetAppErrorDTO;
	}): void => {
		const errorCode = serviceErrorDTO.data;

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
				assertNever(errorCode);
			}
		}
	};

	getOne: RequestHandler<
		Controllers.Params.GetAppQueryParamsDTO,
		Controllers.Responses.GetAppDTO,
		Controllers.Params.GetAppBodyDTO
	> = async (req, res) => {
		const { userData } = req.body;

		const result = await appsService.getOne({
			appId: new Decimal(req.params.appId).toNumber(),
			address: userData.address,
		});

		if (!result.success) {
			this.getOneErrorResponseMapper({
				res,
				serviceErrorDTO: result,
			});
			return;
		}

		res.status(200).send({
			success: true,
			result: this.getOneSuccessResponseMapper(result.data),
		});
	};

	private updateNameSuccessResponseMapper = (
		updateAppNameDTOAppData: Services.Responses.UpdateAppNameDTOAppData,
	): Controllers.Responses.UpdateAppNameDTOAppData => {
		const param = updateAppNameDTOAppData;

		return {
			id: param.id,
			name: param.name,
		};
	};

	private updateNameErrorResponseMapper = ({
		res,
		serviceErrorDTO,
	}: {
		res: Response<Controllers.Responses.UpdateAppNameDTO>;
		serviceErrorDTO: Services.Responses.UpdateAppNameErrorDTO;
	}): void => {
		const errorCode = serviceErrorDTO.data;

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
				assertNever(errorCode);
			}
		}
	};

	updateName: RequestHandler<
		Controllers.Params.UpdateAppNameQueryParamsDTO,
		Controllers.Responses.UpdateAppNameDTO,
		Controllers.Params.UpdateAppNameBodyDTO
	> = async (req, res) => {
		const { name, userData } = req.body;

		const result = await appsService.updateName({
			appId: new Decimal(req.params.appId).toNumber(),
			address: userData.address,
			name,
		});

		if (!result.success) {
			this.updateNameErrorResponseMapper({
				res,
				serviceErrorDTO: result,
			});
			return;
		}

		res.status(200).send({
			success: true,
			result: this.updateNameSuccessResponseMapper(result.data),
		});
	};

	private deleteSuccessResponseMapper = (
		deleteAppDTOAppData: Services.Responses.DeleteAppDTOAppData,
	): Controllers.Responses.DeleteAppDTOAppData => {
		const param = deleteAppDTOAppData;

		return {
			id: param.id,
		};
	};

	private deleteErrorResponseMapper = ({
		res,
		serviceErrorDTO,
	}: {
		res: Response<Controllers.Responses.DeleteAppDTO>;
		serviceErrorDTO: Services.Responses.DeleteAppErrorDTO;
	}): void => {
		const errorCode = serviceErrorDTO.data;

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
				assertNever(errorCode);
			}
		}
	};

	delete: RequestHandler<
		Controllers.Params.DeleteAppQueryParamsDTO,
		Controllers.Responses.DeleteAppDTO,
		Controllers.Params.DeleteAppBodyDTO
	> = async (req, res) => {
		const { userData } = req.body;

		const result = await appsService.delete({
			appId: new Decimal(req.params.appId).toNumber(),
			address: userData.address,
		});

		if (!result.success) {
			this.deleteErrorResponseMapper({
				res,
				serviceErrorDTO: result,
			});
			return;
		}

		res.status(200).send({
			success: true,
			result: this.deleteSuccessResponseMapper(result.data),
		});
	};

	private createApiKeySuccessResponseMapper = (
		createAppTokenDTOApiKeyData: Services.Responses.CreateAppTokenDTOApiKeyData,
	): Controllers.Responses.CreateAppTokenDTOApiKeyData => {
		const param = createAppTokenDTOApiKeyData;

		return {
			valueEncryptedHex: param.valueEncryptedHex,
			issuedAtEncryptedHex: param.issuedAtEncryptedHex,
			intermediateEncryptionPublicKeyHex: param.intermediateEncryptionPublicKeyHex,
		};
	};

	private createApiKeyErrorResponseMapper = ({
		res,
		serviceErrorDTO,
	}: {
		res: Response<Controllers.Responses.CreateAppTokenDTO>;
		serviceErrorDTO: Services.Responses.CreateAppTokenErrorDTO;
	}): void => {
		const errorCode = serviceErrorDTO.data;

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
						code: Controllers.Responses.CreateAppTokenErrorCode.API_KEY_ALREADY_EXISTS,
					},
				});
				return;

			case Services.Responses.CreateAppTokenErrorCode.USER_NOT_FOUND:
				throw new Error('JWT token of non-existent user');

			default: {
				assertNever(errorCode);
			}
		}
	};

	createApiKey: RequestHandler<
		Controllers.Params.CreateAppTokenQueryParamsDTO,
		Controllers.Responses.CreateAppTokenDTO,
		Controllers.Params.CreateAppTokenBodyDTO
	> = async (req, res) => {
		const { userData, publicKeyHex } = req.body;

		const result = await appTokensService.create({
			appId: new Decimal(req.params.appId).toNumber(),
			address: userData.address,
			publicKeyHex,
		});

		if (!result.success) {
			this.createApiKeyErrorResponseMapper({
				res,
				serviceErrorDTO: result,
			});
			return;
		}

		res.status(200).send({
			success: true,
			result: this.createApiKeySuccessResponseMapper(result.data),
		});
	};

	private regenerateApiKeySuccessResponseMapper = (
		regenerateAppTokenDTOApiKeyData: Services.Responses.RegenerateAppTokenDTOApiKeyData,
	): Controllers.Responses.RegenerateAppTokenDTOApiKeyData => {
		const param = regenerateAppTokenDTOApiKeyData;

		return {
			valueEncryptedHex: param.valueEncryptedHex,
			issuedAtEncryptedHex: param.issuedAtEncryptedHex,
			intermediateEncryptionPublicKeyHex: param.intermediateEncryptionPublicKeyHex,
		};
	};

	private regenerateApiKeyErrorResponseMapper = ({
		res,
		serviceErrorDTO,
	}: {
		res: Response<Controllers.Responses.RegenerateAppTokenDTO>;
		serviceErrorDTO: Services.Responses.RegenerateAppTokenErrorDTO;
	}): void => {
		const errorCode = serviceErrorDTO.data;

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
						code: Controllers.Responses.RegenerateAppTokenErrorCode.API_KEY_NOT_FOUND,
					},
				});
				return;

			case Services.Responses.RegenerateAppTokenErrorCode.USER_NOT_FOUND:
				throw new Error('JWT token of non-existent user');

			default: {
				assertNever(errorCode);
			}
		}
	};

	regenerateApiKey: RequestHandler<
		Controllers.Params.RegenerateAppTokenQueryParamsDTO,
		Controllers.Responses.RegenerateAppTokenDTO,
		Controllers.Params.RegenerateAppTokenBodyDTO
	> = async (req, res) => {
		const { userData, publicKeyHex } = req.body;

		const result = await appTokensService.regenerate({
			appId: new Decimal(req.params.appId).toNumber(),
			address: userData.address,
			publicKeyHex,
		});

		if (!result.success) {
			this.regenerateApiKeyErrorResponseMapper({
				res,
				serviceErrorDTO: result,
			});
			return;
		}

		res.status(200).send({
			success: true,
			result: this.regenerateApiKeySuccessResponseMapper(result.data),
		});
	};

	private getApiKeySuccessResponseMapper = (
		getAppTokenDTOApiKeyData: Services.Responses.GetAppTokenDTOApiKeyData,
	): Controllers.Responses.GetAppTokenDTOApiKeyData => {
		const param = getAppTokenDTOApiKeyData;

		return {
			valueEncryptedHex: param.valueEncryptedHex,
			issuedAtEncryptedHex: param.issuedAtEncryptedHex,
			intermediateEncryptionPublicKeyHex: param.intermediateEncryptionPublicKeyHex,
		};
	};

	private getApiKeyErrorResponseMapper = ({
		res,
		serviceErrorDTO,
	}: {
		res: Response<Controllers.Responses.GetAppTokenDTO>;
		serviceErrorDTO: Services.Responses.GetAppTokenErrorDTO;
	}): void => {
		const errorCode = serviceErrorDTO.data;

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
				assertNever(errorCode);
			}
		}
	};

	getApiKey: RequestHandler<
		Controllers.Params.GetAppTokenQueryParamsDTO,
		Controllers.Responses.GetAppTokenDTO,
		Controllers.Params.GetAppTokenBodyDTO
	> = async (req, res) => {
		const { appId } = req.params;

		const { userData, publicKeyHex } = req.body;

		const result = await appTokensService.getOne({
			appId: new Decimal(appId).toNumber(),
			address: userData.address,
			publicKeyHex,
		});

		if (!result.success) {
			this.getApiKeyErrorResponseMapper({
				res,
				serviceErrorDTO: result,
			});
			return;
		}

		res.status(200).send({
			success: true,
			result: this.getApiKeySuccessResponseMapper(result.data),
		});
	};
}

export const appsController = new AppsController();
