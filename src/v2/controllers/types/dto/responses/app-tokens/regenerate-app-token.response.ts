import { ServerResponse } from '@/v2/controllers/types/dto/responses/shared/responses-typing/response';
import { GetServerError } from '@/v2/controllers/types/dto/responses/shared/shared.response';
import { ValidateErrorSubType } from '@/v2/controllers/types/dto/responses/shared/responses-typing/error-response';

export type RegenerateAppTokenDTOApiKeyData = {
	valueEncryptedHex: string;
	issuedAtEncryptedHex: string;
	intermediateEncryptionPublicKeyHex: string;
};

export enum RegenerateAppTokenErrorCode {
	APP_NOT_FOUND = 'App not found',
	API_KEY_NOT_FOUND = 'Api key not found',
}

export type RegenerateAppTokenErrorType = ValidateErrorSubType<{
	code: RegenerateAppTokenErrorCode;
}>;

export type RegenerateAppTokenDTO = ServerResponse<
	RegenerateAppTokenDTOApiKeyData,
	GetServerError<RegenerateAppTokenErrorType>
>;
