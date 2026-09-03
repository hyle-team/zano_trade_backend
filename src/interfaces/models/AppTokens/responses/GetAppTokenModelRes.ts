export enum GetAppTokenModelErrorCode {
	USER_NOT_FOUND = 'User not found',
	APP_NOT_FOUND = 'App not found',
	API_KEY_NOT_FOUND = 'Api key not found',
}

export type GetAppTokenModelResApiKeyData = {
	value: string;
	issuedAt: Date;
};

export type GetAppTokenModelSuccessRes = {
	success: true;
	data: GetAppTokenModelResApiKeyData;
};

export type GetAppTokenModelErrorRes = {
	success: false;
	data: GetAppTokenModelErrorCode;
};

type GetAppTokenModelRes = GetAppTokenModelSuccessRes | GetAppTokenModelErrorRes;

export default GetAppTokenModelRes;
