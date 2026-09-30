export enum CreateAppModelErrorCode {
	USER_NOT_FOUND = 'User not found',
	NAME_TAKEN = 'Name taken',
	APP_LIMIT_REACHED = 'App limit reached',
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
