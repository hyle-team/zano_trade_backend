export enum CreateAppModelErrorCode {
	// eslint-disable-next-line no-unused-vars
	USER_NOT_FOUND = 'User not found',
}

export type CreateAppModelResAppData = {
	id: number;
	name: string;
};

export type CreateAppModelSuccessRes = {
	success: true;
	data: CreateAppModelResAppData;
};

export type CreateAppModelErrorRes = {
	success: false;
	data: CreateAppModelErrorCode;
};

type CreateAppModelRes = CreateAppModelSuccessRes | CreateAppModelErrorRes;

export default CreateAppModelRes;
