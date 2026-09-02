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
				api_key_exists: new Decimal(appRow.api_key_count).greaterThan(0),
			})),
		};
	};
}

const appsModel = new Apps();

export default appsModel;
