import { UniqueConstraintError } from 'sequelize';

import sequelize from '@/sequelize.js';
import App from '@/schemes/App.js';
import AppToken from '@/schemes/AppToken.js';
import userModel from '@/models/User.js';
import { AppWithApiKeyCount } from '@/interfaces/database/modifiedRequests.js';
import CreateAppServiceParams from '@/v2/interfaces/services/Apps/params/CreateAppServiceParams.js';
import CreateAppServiceRes, {
	CreateAppServiceErrorCode,
} from '@/v2/interfaces/services/Apps/responses/CreateAppServiceRes.js';
import GetAllAppsServiceParams from '@/v2/interfaces/services/Apps/params/GetAllAppsServiceParams.js';
import GetAllAppsServiceRes, {
	GetAllAppsServiceErrorCode,
} from '@/v2/interfaces/services/Apps/responses/GetAllAppsServiceRes.js';
import GetAppServiceParams from '@/v2/interfaces/services/Apps/params/GetAppServiceParams.js';
import GetAppServiceRes, {
	GetAppServiceErrorCode,
} from '@/v2/interfaces/services/Apps/responses/GetAppServiceRes.js';
import UpdateAppNameServiceParams from '@/v2/interfaces/services/Apps/params/UpdateAppNameServiceParams.js';
import UpdateAppNameServiceRes, {
	UpdateAppNameServiceErrorCode,
} from '@/v2/interfaces/services/Apps/responses/UpdateAppNameServiceRes.js';
import DeleteAppServiceParams from '@/v2/interfaces/services/Apps/params/DeleteAppServiceParams.js';
import DeleteAppServiceRes, {
	DeleteAppServiceErrorCode,
} from '@/v2/interfaces/services/Apps/responses/DeleteAppServiceRes.js';
import { Decimal } from 'decimal.js';

class AppsService {
	private readonly APPS_PER_USER_LIMIT = 1;

	create = async ({ name, address }: CreateAppServiceParams): Promise<CreateAppServiceRes> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return { success: false, data: CreateAppServiceErrorCode.USER_NOT_FOUND };
		}

		const appsCount = await App.count({ where: { user_id: userRow.id } });

		if (appsCount >= this.APPS_PER_USER_LIMIT) {
			return { success: false, data: CreateAppServiceErrorCode.APP_LIMIT_REACHED };
		}

		try {
			const appRow = await App.create({ name, user_id: userRow.id });

			return {
				success: true,
				data: {
					id: appRow.id,
					name: appRow.name,
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

		const appRows = (await App.findAll({
			where: { user_id: userRow.id },
			attributes: [
				'id',
				'name',
				[sequelize.fn('COUNT', sequelize.col('AppToken.id')), 'api_key_count'],
			],
			include: [{ model: AppToken, attributes: [] }],
			group: ['App.id'],
			order: [['id', 'ASC']],
			raw: true,
		})) as unknown as AppWithApiKeyCount[];

		return {
			success: true,
			data: appRows.map((appRow) => ({
				id: appRow.id,
				name: appRow.name,
				apiKeyExists: new Decimal(appRow.api_key_count).greaterThan(0),
			})),
		};
	};

	getOne = async ({ appId, address }: GetAppServiceParams): Promise<GetAppServiceRes> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return { success: false, data: GetAppServiceErrorCode.USER_NOT_FOUND };
		}

		const appRow = await App.findOne({ where: { id: appId, user_id: userRow.id } });

		if (!appRow) {
			return { success: false, data: GetAppServiceErrorCode.APP_NOT_FOUND };
		}

		const tokenRow = await AppToken.findOne({ where: { app_id: appRow.id } });

		return {
			success: true,
			data: {
				id: appRow.id,
				name: appRow.name,
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

const appsService = new AppsService();

export default appsService;
