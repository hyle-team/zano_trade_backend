export type CreateAppTokenResApiKeyData = {
	value: string;
	issuedAt: Date;
};

export type CreateAppTokenSuccessRes = {
	success: true;
	data: CreateAppTokenResApiKeyData;
};

export enum CreateAppTokenErrorCode {
	APP_NOT_FOUND = 'App not found',
	API_KEY_ALREADY_EXISTS = 'Api key already exists',
}

export type CreateAppTokenErrorRes = {
	success: false;
	data: CreateAppTokenErrorCode;
};

type CreateAppTokenRes = CreateAppTokenSuccessRes | CreateAppTokenErrorRes;

export default CreateAppTokenRes;
