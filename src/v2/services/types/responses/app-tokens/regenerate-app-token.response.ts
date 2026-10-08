export enum RegenerateAppTokenServiceErrorCode {
	USER_NOT_FOUND = 'User not found',
	APP_NOT_FOUND = 'App not found',
	API_KEY_NOT_FOUND = 'Api key not found',
}

export type RegenerateAppTokenServiceResApiKeyData = {
	valueEncryptedHex: string;
	issuedAtEncryptedHex: string;
	intermediateEncryptionPublicKeyHex: string;
};

export type RegenerateAppTokenServiceSuccessRes = {
	success: true;
	data: RegenerateAppTokenServiceResApiKeyData;
};

export type RegenerateAppTokenServiceErrorRes = {
	success: false;
	data: RegenerateAppTokenServiceErrorCode;
};

export type RegenerateAppTokenServiceRes =
	| RegenerateAppTokenServiceSuccessRes
	| RegenerateAppTokenServiceErrorRes;
