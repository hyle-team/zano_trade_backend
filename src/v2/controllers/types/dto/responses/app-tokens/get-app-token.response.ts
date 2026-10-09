export type GetAppTokenDTOApiKeyData = {
	valueEncryptedHex: string;
	issuedAtEncryptedHex: string;
	intermediateEncryptionPublicKeyHex: string;
};

export type GetAppTokenSuccessDTO = {
	success: true;
	data: GetAppTokenDTOApiKeyData;
};

export enum GetAppTokenErrorCode {
	APP_NOT_FOUND = 'App not found',
	API_KEY_NOT_FOUND = 'Api key not found',
}

export type GetAppTokenErrorDTO = {
	success: false;
	data: GetAppTokenErrorCode;
};

export type GetAppTokenDTO = GetAppTokenSuccessDTO | GetAppTokenErrorDTO;
