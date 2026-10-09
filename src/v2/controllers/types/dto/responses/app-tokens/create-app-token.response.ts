import { ServerResponse } from '@/v2/controllers/types/dto/responses/shared/responses-typing/response';
import { GetServerError } from '@/v2/controllers/types/dto/responses/shared/shared.response';
import { ValidateErrorSubType } from '@/v2/controllers/types/dto/responses/shared/responses-typing/error-response';

export type CreateAppTokenDTOApiKeyData = {
	valueEncryptedHex: string;
	issuedAtEncryptedHex: string;
	intermediateEncryptionPublicKeyHex: string;
};

export enum CreateAppTokenErrorCode {
	APP_NOT_FOUND = 'App not found',
	API_KEY_ALREADY_EXISTS = 'Api key already exists',
}

export type CreateAppTokenErrorType = ValidateErrorSubType<{
	code: CreateAppTokenErrorCode;
}>;

export type CreateAppTokenDTO = ServerResponse<
	CreateAppTokenDTOApiKeyData,
	GetServerError<CreateAppTokenErrorType>
>;
