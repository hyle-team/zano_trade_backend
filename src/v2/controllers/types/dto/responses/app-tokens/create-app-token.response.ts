export type CreateAppTokenDTOApiKeyData = {
	valueEncryptedHex: string;
	issuedAtEncryptedHex: string;
	intermediateEncryptionPublicKeyHex: string;
};

export type CreateAppTokenSuccessDTO = {
	success: true;
	data: CreateAppTokenDTOApiKeyData;
};

export enum CreateAppTokenErrorCode {
	APP_NOT_FOUND = 'App not found',
	API_KEY_ALREADY_EXISTS = 'Api key already exists',
}

export type CreateAppTokenErrorDTO = {
	success: false;
	data: CreateAppTokenErrorCode;
};

export type CreateAppTokenDTO = CreateAppTokenSuccessDTO | CreateAppTokenErrorDTO;
