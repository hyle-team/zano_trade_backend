import { ServerResponse } from '@/v2/controllers/types/dto/responses/shared/responses-typing/response';
import { GetServerError } from '@/v2/controllers/types/dto/responses/shared/shared.response';
import { ValidateErrorSubType } from '@/v2/controllers/types/dto/responses/shared/responses-typing/error-response';

export type GetAppTokenDTOApiKeyData = {
	valueEncryptedHex: string;
	issuedAtEncryptedHex: string;
	intermediateEncryptionPublicKeyHex: string;
};

export enum GetAppTokenErrorCode {
	APP_NOT_FOUND = 'App not found',
	API_KEY_NOT_FOUND = 'Api key not found',
}

export type GetAppTokenErrorType = ValidateErrorSubType<{
	code: GetAppTokenErrorCode;
}>;

export type GetAppTokenDTO = ServerResponse<
	GetAppTokenDTOApiKeyData,
	GetServerError<GetAppTokenErrorType>
>;
