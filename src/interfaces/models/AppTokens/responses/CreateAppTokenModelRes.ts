export enum CreateAppTokenModelErrorCode {
	USER_NOT_FOUND = 'User not found',
	APP_NOT_FOUND = 'App not found',
	API_KEY_ALREADY_EXISTS = 'Api key already exists',
}

export type CreateAppTokenModelResApiKeyData = {
	value: string;
	issuedAt: Date;
};

export type CreateAppTokenModelSuccessRes = {
	success: true;
	data: CreateAppTokenModelResApiKeyData;
};

export type CreateAppTokenModelErrorRes = {
	success: false;
	data: CreateAppTokenModelErrorCode;
};

type CreateAppTokenModelRes = CreateAppTokenModelSuccessRes | CreateAppTokenModelErrorRes;

export default CreateAppTokenModelRes;
