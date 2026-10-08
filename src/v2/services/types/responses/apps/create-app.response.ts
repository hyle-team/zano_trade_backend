export enum CreateAppServiceErrorCode {
	USER_NOT_FOUND = 'User not found',
	NAME_TAKEN = 'Name taken',
	APP_LIMIT_REACHED = 'App limit reached',
}

export type CreateAppServiceResAppData = {
	id: number;
	name: string;
};

export type CreateAppServiceSuccessRes = {
	success: true;
	data: CreateAppServiceResAppData;
};

export type CreateAppServiceErrorRes = {
	success: false;
	data: CreateAppServiceErrorCode;
};

export type CreateAppServiceRes = CreateAppServiceSuccessRes | CreateAppServiceErrorRes;
