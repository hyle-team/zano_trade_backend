export type GetAppTokenResApiKeyData = {
	value: string;
	issuedAt: Date;
};

export type GetAppTokenSuccessRes = {
	success: true;
	data: GetAppTokenResApiKeyData;
};

export enum GetAppTokenErrorCode {
	APP_NOT_FOUND = 'App not found',
	API_KEY_NOT_FOUND = 'Api key not found',
}

export type GetAppTokenErrorRes = {
	success: false;
	data: GetAppTokenErrorCode;
};

type GetAppTokenRes = GetAppTokenSuccessRes | GetAppTokenErrorRes;

export default GetAppTokenRes;
