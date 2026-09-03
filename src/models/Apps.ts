import { UniqueConstraintError } from 'sequelize';

import sequelize from '@/sequelize.js';
import App from '@/schemes/App.js';
import AppToken from '@/schemes/AppToken.js';
import userModel from '@/models/User.js';
import { AppWithApiKeyCount } from '@/interfaces/database/modifiedRequests.js';
import CreateAppModelParams from '@/interfaces/models/Apps/params/CreateAppModelParams.js';
import CreateAppModelRes, {
	CreateAppModelErrorCode,
} from '@/interfaces/models/Apps/responses/CreateAppModelRes.js';
import GetAllAppsModelParams from '@/interfaces/models/Apps/params/GetAllAppsModelParams.js';
import GetAllAppsModelRes, {
	GetAllAppsModelErrorCode,
} from '@/interfaces/models/Apps/responses/GetAllAppsModelRes.js';
import GetAppModelParams from '@/interfaces/models/Apps/params/GetAppModelParams.js';
import GetAppModelRes, {
	GetAppModelErrorCode,
} from '@/interfaces/models/Apps/responses/GetAppModelRes.js';
import UpdateAppNameModelParams from '@/interfaces/models/Apps/params/UpdateAppNameModelParams.js';
import UpdateAppNameModelRes, {
	UpdateAppNameModelErrorCode,
} from '@/interfaces/models/Apps/responses/UpdateAppNameModelRes.js';
import DeleteAppModelParams from '@/interfaces/models/Apps/params/DeleteAppModelParams.js';
import DeleteAppModelRes, {
	DeleteAppModelErrorCode,
} from '@/interfaces/models/Apps/responses/DeleteAppModelRes.js';
import { Decimal } from 'decimal.js';

class Apps {
	private readonly APPS_PER_USER_LIMIT = 1;

	create = async ({ name, address }: CreateAppModelParams): Promise<CreateAppModelRes> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return { success: false, data: CreateAppModelErrorCode.USER_NOT_FOUND };
		}

		const appsCount = await App.count({ where: { user_id: userRow.id } });

		if (appsCount >= this.APPS_PER_USER_LIMIT) {
			return { success: false, data: CreateAppModelErrorCode.APP_LIMIT_REACHED };
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
				return { success: false, data: CreateAppModelErrorCode.NAME_TAKEN };
			}

			throw error;
		}
	};

	getAll = async ({ address }: GetAllAppsModelParams): Promise<GetAllAppsModelRes> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return { success: false, data: GetAllAppsModelErrorCode.USER_NOT_FOUND };
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

	getOne = async ({ appId, address }: GetAppModelParams): Promise<GetAppModelRes> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return { success: false, data: GetAppModelErrorCode.USER_NOT_FOUND };
		}

		const appRow = await App.findOne({ where: { id: appId, user_id: userRow.id } });

		if (!appRow) {
			return { success: false, data: GetAppModelErrorCode.APP_NOT_FOUND };
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
	}: UpdateAppNameModelParams): Promise<UpdateAppNameModelRes> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return { success: false, data: UpdateAppNameModelErrorCode.USER_NOT_FOUND };
		}

		try {
			const [affectedRowsCount] = await App.update(
				{ name },
				{ where: { id: appId, user_id: userRow.id } },
			);

			if (affectedRowsCount === 0) {
				return { success: false, data: UpdateAppNameModelErrorCode.APP_NOT_FOUND };
			}

			return { success: true, data: { id: appId, name } };
		} catch (error) {
			if (error instanceof UniqueConstraintError) {
				return { success: false, data: UpdateAppNameModelErrorCode.NAME_TAKEN };
			}

			throw error;
		}
	};

	delete = async ({ appId, address }: DeleteAppModelParams): Promise<DeleteAppModelRes> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return { success: false, data: DeleteAppModelErrorCode.USER_NOT_FOUND };
		}

		return sequelize.transaction(async (transaction) => {
			const appRow = await App.findOne({
				where: { id: appId, user_id: userRow.id },
				transaction,
			});

			if (!appRow) {
				return { success: false, data: DeleteAppModelErrorCode.APP_NOT_FOUND };
			}

			await AppToken.destroy({ where: { app_id: appRow.id }, transaction });
			await appRow.destroy({ transaction });

			return { success: true, data: { id: appId } };
		});
	};
}

const appsModel = new Apps();

export default appsModel;
