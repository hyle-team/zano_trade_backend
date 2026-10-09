import { UniqueConstraintError } from 'sequelize';

import { IAppRepository } from '@/v2/services/types/interfaces/repositories/app.repository';
import { appRepository } from '@/v2/database/repositories/app.repository';
import { IAppTokenRepository } from '@/v2/services/types/interfaces/repositories/app-token.repository';
import { appTokenRepository } from '@/v2/database/repositories/app-token.repository';
import sequelize from '@/sequelize.js';
import userModel from '@/models/User.js';
import { Services } from '@/v2/services/types';

class AppsService {
	private readonly appRepository: IAppRepository = appRepository;

	private readonly appTokenRepository: IAppTokenRepository = appTokenRepository;

	private readonly APPS_PER_USER_LIMIT = 1;

	create = async ({
		name,
		address,
	}: Services.Params.CreateAppDTO): Promise<Services.Responses.CreateAppDTO> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return {
				success: false,
				data: Services.Responses.CreateAppErrorCode.USER_NOT_FOUND,
			};
		}

		const appsCount = await this.appRepository.count({ where: { user_id: userRow.id } });

		if (appsCount >= this.APPS_PER_USER_LIMIT) {
			return {
				success: false,
				data: Services.Responses.CreateAppErrorCode.APP_LIMIT_REACHED,
			};
		}

		try {
			const app = await this.appRepository.create({ name, user_id: userRow.id });

			return {
				success: true,
				data: {
					id: app.id,
					name: app.name,
				},
			};
		} catch (error) {
			if (error instanceof UniqueConstraintError) {
				return {
					success: false,
					data: Services.Responses.CreateAppErrorCode.NAME_TAKEN,
				};
			}

			throw error;
		}
	};

	getAll = async ({
		address,
	}: Services.Params.GetAllAppsDTO): Promise<Services.Responses.GetAllAppsDTO> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return {
				success: false,
				data: Services.Responses.GetAllAppsErrorCode.USER_NOT_FOUND,
			};
		}

		const appEntries = await this.appRepository.findAllWithApiKeyCount({ userId: userRow.id });

		return {
			success: true,
			data: appEntries.map(({ app, apiKeyCount }) => ({
				id: app.id,
				name: app.name,
				apiKeyExists: apiKeyCount > 0,
			})),
		};
	};

	getOne = async ({
		appId,
		address,
	}: Services.Params.GetAppDTO): Promise<Services.Responses.GetAppDTO> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return {
				success: false,
				data: Services.Responses.GetAppErrorCode.USER_NOT_FOUND,
			};
		}

		const app = await this.appRepository.findOne({
			where: { id: appId, user_id: userRow.id },
		});

		if (!app) {
			return {
				success: false,
				data: Services.Responses.GetAppErrorCode.APP_NOT_FOUND,
			};
		}

		const appToken = await this.appTokenRepository.findOne({ where: { app_id: app.id } });

		return {
			success: true,
			data: {
				id: app.id,
				name: app.name,
				apiKey: appToken ? { issuedAt: appToken.issuedAt } : null,
			},
		};
	};

	updateName = async ({
		appId,
		address,
		name,
	}: Services.Params.UpdateAppNameDTO): Promise<Services.Responses.UpdateAppNameDTO> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return {
				success: false,
				data: Services.Responses.UpdateAppNameErrorCode.USER_NOT_FOUND,
			};
		}

		try {
			const affectedRowsCount = await this.appRepository.update(
				{ name },
				{ where: { id: appId, user_id: userRow.id } },
			);

			if (affectedRowsCount === 0) {
				return {
					success: false,
					data: Services.Responses.UpdateAppNameErrorCode.APP_NOT_FOUND,
				};
			}

			return { success: true, data: { id: appId, name } };
		} catch (error) {
			if (error instanceof UniqueConstraintError) {
				return {
					success: false,
					data: Services.Responses.UpdateAppNameErrorCode.NAME_TAKEN,
				};
			}

			throw error;
		}
	};

	delete = async ({
		appId,
		address,
	}: Services.Params.DeleteAppDTO): Promise<Services.Responses.DeleteAppDTO> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return {
				success: false,
				data: Services.Responses.DeleteAppErrorCode.USER_NOT_FOUND,
			};
		}

		return sequelize.transaction(async (transaction) => {
			const app = await this.appRepository.findOne({
				where: { id: appId, user_id: userRow.id },
				transaction,
			});

			if (!app) {
				return {
					success: false,
					data: Services.Responses.DeleteAppErrorCode.APP_NOT_FOUND,
				};
			}

			await this.appTokenRepository.delete({ where: { app_id: app.id }, transaction });
			await this.appRepository.delete({ where: { id: app.id }, transaction });

			return { success: true, data: { id: appId } };
		});
	};
}

export const appsService = new AppsService();
