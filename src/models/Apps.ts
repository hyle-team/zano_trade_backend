import App from '@/schemes/App.js';
import userModel from '@/models/User.js';
import CreateAppModelParams from '@/interfaces/models/Apps/params/CreateAppModelParams.js';
import CreateAppModelRes, {
	CreateAppModelErrorCode,
} from '@/interfaces/models/Apps/responses/CreateAppModelRes.js';

class Apps {
	create = async ({ name, address }: CreateAppModelParams): Promise<CreateAppModelRes> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return { success: false, data: CreateAppModelErrorCode.USER_NOT_FOUND };
		}

		const appRow = await App.create({ name, user_id: userRow.id });

		return {
			success: true,
			data: {
				id: appRow.id,
				name: appRow.name,
			},
		};
	};
}

const appsModel = new Apps();

export default appsModel;
