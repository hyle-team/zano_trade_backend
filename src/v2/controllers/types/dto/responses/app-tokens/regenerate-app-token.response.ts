export type RegenerateAppTokenDTOApiKeyData = {
	valueEncryptedHex: string;
	issuedAtEncryptedHex: string;
	intermediateEncryptionPublicKeyHex: string;
};

export type RegenerateAppTokenSuccessDTO = {
	success: true;
	data: RegenerateAppTokenDTOApiKeyData;
};

export enum RegenerateAppTokenErrorCode {
	APP_NOT_FOUND = 'App not found',
	API_KEY_NOT_FOUND = 'Api key not found',
}

export type RegenerateAppTokenErrorDTO = {
	success: false;
	data: RegenerateAppTokenErrorCode;
};

export type RegenerateAppTokenDTO = RegenerateAppTokenSuccessDTO | RegenerateAppTokenErrorDTO;
