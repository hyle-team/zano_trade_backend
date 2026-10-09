export enum GetAppTokenServiceErrorCode {
	USER_NOT_FOUND = 'User not found',
	APP_NOT_FOUND = 'App not found',
	API_KEY_NOT_FOUND = 'Api key not found',
}

export type GetAppTokenServiceResApiKeyData = {
	valueEncryptedHex: string;
	issuedAtEncryptedHex: string;
	intermediateEncryptionPublicKeyHex: string;
};

export type GetAppTokenServiceSuccessRes = {
	success: true;
	data: GetAppTokenServiceResApiKeyData;
};

export type GetAppTokenServiceErrorRes = {
	success: false;
	data: GetAppTokenServiceErrorCode;
};

export type GetAppTokenServiceRes = GetAppTokenServiceSuccessRes | GetAppTokenServiceErrorRes;
