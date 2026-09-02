import App from '../schemes/App.js';
import userModel from './User.js';

export enum CreateAppModelErrorCode {
	// eslint-disable-next-line no-unused-vars
	USER_NOT_FOUND = 'User not found',
}

type CreateAppSuccessRes = {
	success: true;
	data: {
		id: number;
		name: string;
	};
};

type CreateAppErrorRes = {
	success: false;
	data: CreateAppModelErrorCode;
};

type CreateAppRes = CreateAppSuccessRes | CreateAppErrorRes;

class Apps {
	create = async ({
		name,
		address,
	}: {
		name: string;
		address: string;
	}): Promise<CreateAppRes> => {
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
