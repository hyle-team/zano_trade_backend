export type RegenerateAppTokenResApiKeyData = {
	value: string;
	issuedAt: Date;
};

export type RegenerateAppTokenSuccessRes = {
	success: true;
	data: RegenerateAppTokenResApiKeyData;
};

export enum RegenerateAppTokenErrorCode {
	APP_NOT_FOUND = 'App not found',
	API_KEY_NOT_FOUND = 'Api key not found',
}

export type RegenerateAppTokenErrorRes = {
	success: false;
	data: RegenerateAppTokenErrorCode;
};

type RegenerateAppTokenRes = RegenerateAppTokenSuccessRes | RegenerateAppTokenErrorRes;

export default RegenerateAppTokenRes;
