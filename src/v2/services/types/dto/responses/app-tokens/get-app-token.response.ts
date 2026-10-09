export enum GetAppTokenErrorCode {
	USER_NOT_FOUND = 'User not found',
	APP_NOT_FOUND = 'App not found',
	API_KEY_NOT_FOUND = 'Api key not found',
}

export type GetAppTokenDTOApiKeyData = {
	valueEncryptedHex: string;
	issuedAtEncryptedHex: string;
	intermediateEncryptionPublicKeyHex: string;
};

export type GetAppTokenSuccessDTO = {
	success: true;
	data: GetAppTokenDTOApiKeyData;
};

export type GetAppTokenErrorDTO = {
	success: false;
	data: GetAppTokenErrorCode;
};

export type GetAppTokenDTO = GetAppTokenSuccessDTO | GetAppTokenErrorDTO;
