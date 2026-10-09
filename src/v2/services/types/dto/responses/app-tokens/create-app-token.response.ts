export enum CreateAppTokenServiceErrorCode {
	USER_NOT_FOUND = 'User not found',
	APP_NOT_FOUND = 'App not found',
	API_KEY_ALREADY_EXISTS = 'Api key already exists',
}

export type CreateAppTokenServiceResApiKeyData = {
	valueEncryptedHex: string;
	issuedAtEncryptedHex: string;
	intermediateEncryptionPublicKeyHex: string;
};

export type CreateAppTokenServiceSuccessRes = {
	success: true;
	data: CreateAppTokenServiceResApiKeyData;
};

export type CreateAppTokenServiceErrorRes = {
	success: false;
	data: CreateAppTokenServiceErrorCode;
};

export type CreateAppTokenServiceRes =
	| CreateAppTokenServiceSuccessRes
	| CreateAppTokenServiceErrorRes;
