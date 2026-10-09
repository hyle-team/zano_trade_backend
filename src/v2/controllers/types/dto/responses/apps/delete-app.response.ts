import { ServerResponse } from '@/v2/controllers/types/dto/responses/shared/responses-typing/response';
import { GetServerError } from '@/v2/controllers/types/dto/responses/shared/shared.response';
import { ValidateErrorSubType } from '@/v2/controllers/types/dto/responses/shared/responses-typing/error-response';

export type DeleteAppDTOAppData = {
	id: number;
};

export enum DeleteAppErrorCode {
	APP_NOT_FOUND = 'App not found',
}

export type DeleteAppErrorType = ValidateErrorSubType<{
	code: DeleteAppErrorCode;
}>;

export type DeleteAppDTO = ServerResponse<DeleteAppDTOAppData, GetServerError<DeleteAppErrorType>>;
