export enum RegenerateAppTokenModelErrorCode {
	USER_NOT_FOUND = 'User not found',
	APP_NOT_FOUND = 'App not found',
	API_KEY_NOT_FOUND = 'Api key not found',
}

export type RegenerateAppTokenModelResApiKeyData = {
	value: string;
	issuedAt: Date;
};

export type RegenerateAppTokenModelSuccessRes = {
	success: true;
	data: RegenerateAppTokenModelResApiKeyData;
};

export type RegenerateAppTokenModelErrorRes = {
	success: false;
	data: RegenerateAppTokenModelErrorCode;
};

type RegenerateAppTokenModelRes =
	| RegenerateAppTokenModelSuccessRes
	| RegenerateAppTokenModelErrorRes;

export default RegenerateAppTokenModelRes;
