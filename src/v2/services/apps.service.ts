import { UniqueConstraintError } from 'sequelize';

import { IAppRepository } from '@/v2/services/types/interfaces/repositories/app.repository';
import { appRepository } from '@/v2/database/repositories/app.repository';
import sequelize from '@/sequelize.js';
import App from '@/schemes/App.js';
import AppToken from '@/schemes/AppToken.js';
import userModel from '@/models/User.js';
import { CreateAppServiceParams } from '@/v2/services/types/params/apps/create-app.params.js';
import {
	CreateAppServiceRes,
	CreateAppServiceErrorCode,
} from '@/v2/services/types/responses/apps/create-app.response.js';
import { GetAllAppsServiceParams } from '@/v2/services/types/params/apps/get-all-apps.params.js';
import {
	GetAllAppsServiceRes,
	GetAllAppsServiceErrorCode,
} from '@/v2/services/types/responses/apps/get-all-apps.response.js';
import { GetAppServiceParams } from '@/v2/services/types/params/apps/get-app.params.js';
import {
	GetAppServiceRes,
	GetAppServiceErrorCode,
} from '@/v2/services/types/responses/apps/get-app.response.js';
import { UpdateAppNameServiceParams } from '@/v2/services/types/params/apps/update-app-name.params.js';
import {
	UpdateAppNameServiceRes,
	UpdateAppNameServiceErrorCode,
} from '@/v2/services/types/responses/apps/update-app-name.response.js';
import { DeleteAppServiceParams } from '@/v2/services/types/params/apps/delete-app.params.js';
import {
	DeleteAppServiceRes,
	DeleteAppServiceErrorCode,
} from '@/v2/services/types/responses/apps/delete-app.response.js';

class AppsService {
	private readonly appRepository: IAppRepository = appRepository;

	private readonly APPS_PER_USER_LIMIT = 1;

	create = async ({ name, address }: CreateAppServiceParams): Promise<CreateAppServiceRes> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return { success: false, data: CreateAppServiceErrorCode.USER_NOT_FOUND };
		}

		const appsCount = await this.appRepository.count({ where: { user_id: userRow.id } });

		if (appsCount >= this.APPS_PER_USER_LIMIT) {
			return { success: false, data: CreateAppServiceErrorCode.APP_LIMIT_REACHED };
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
				return { success: false, data: CreateAppServiceErrorCode.NAME_TAKEN };
			}

			throw error;
		}
	};

	getAll = async ({ address }: GetAllAppsServiceParams): Promise<GetAllAppsServiceRes> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return { success: false, data: GetAllAppsServiceErrorCode.USER_NOT_FOUND };
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

	getOne = async ({ appId, address }: GetAppServiceParams): Promise<GetAppServiceRes> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return { success: false, data: GetAppServiceErrorCode.USER_NOT_FOUND };
		}

		const app = await this.appRepository.findOne({
			where: { id: appId, user_id: userRow.id },
		});

		if (!app) {
			return { success: false, data: GetAppServiceErrorCode.APP_NOT_FOUND };
		}

		const tokenRow = await AppToken.findOne({ where: { app_id: app.id } });

		return {
			success: true,
			data: {
				id: app.id,
				name: app.name,
				apiKey: tokenRow ? { issuedAt: tokenRow.issued_at } : null,
			},
		};
	};

	updateName = async ({
		appId,
		address,
		name,
	}: UpdateAppNameServiceParams): Promise<UpdateAppNameServiceRes> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return { success: false, data: UpdateAppNameServiceErrorCode.USER_NOT_FOUND };
		}

		try {
			const [affectedRowsCount] = await App.update(
				{ name },
				{ where: { id: appId, user_id: userRow.id } },
			);

			if (affectedRowsCount === 0) {
				return { success: false, data: UpdateAppNameServiceErrorCode.APP_NOT_FOUND };
			}

			return { success: true, data: { id: appId, name } };
		} catch (error) {
			if (error instanceof UniqueConstraintError) {
				return { success: false, data: UpdateAppNameServiceErrorCode.NAME_TAKEN };
			}

			throw error;
		}
	};

	delete = async ({ appId, address }: DeleteAppServiceParams): Promise<DeleteAppServiceRes> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return { success: false, data: DeleteAppServiceErrorCode.USER_NOT_FOUND };
		}

		return sequelize.transaction(async (transaction) => {
			const appRow = await App.findOne({
				where: { id: appId, user_id: userRow.id },
				transaction,
			});

			if (!appRow) {
				return { success: false, data: DeleteAppServiceErrorCode.APP_NOT_FOUND };
			}

			await AppToken.destroy({ where: { app_id: appRow.id }, transaction });
			await appRow.destroy({ transaction });

			return { success: true, data: { id: appId } };
		});
	};
}

export const appsService = new AppsService();
