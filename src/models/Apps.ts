import { UniqueConstraintError } from 'sequelize';

import App from '@/schemes/App.js';
import userModel from '@/models/User.js';
import CreateAppModelParams from '@/interfaces/models/Apps/params/CreateAppModelParams.js';
import CreateAppModelRes, {
	CreateAppModelErrorCode,
} from '@/interfaces/models/Apps/responses/CreateAppModelRes.js';

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
}

const appsModel = new Apps();

export default appsModel;
