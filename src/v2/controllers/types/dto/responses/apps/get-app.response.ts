import { ServerResponse } from '@/v2/controllers/types/dto/responses/shared/responses-typing/response';
import { GetServerError } from '@/v2/controllers/types/dto/responses/shared/shared.response';
import { ValidateErrorSubType } from '@/v2/controllers/types/dto/responses/shared/responses-typing/error-response';

export type GetAppDTOAppData = {
	id: number;
	name: string;
	apiKeyExists: boolean;
};

export enum GetAppErrorCode {
	APP_NOT_FOUND = 'App not found',
}

export type GetAppErrorType = ValidateErrorSubType<{
	code: GetAppErrorCode;
}>;

export type GetAppDTO = ServerResponse<GetAppDTOAppData, GetServerError<GetAppErrorType>>;
