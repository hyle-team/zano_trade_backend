import { ServerResponse } from '@/v2/controllers/types/dto/responses/shared/responses-typing/response';
import { GetServerError } from '@/v2/controllers/types/dto/responses/shared/shared.response';
import { ValidateErrorSubType } from '@/v2/controllers/types/dto/responses/shared/responses-typing/error-response';

export type CreateAppDTOAppData = {
	id: number;
	name: string;
};

export enum CreateAppErrorCode {
	NAME_TAKEN = 'Name taken',
	APP_LIMIT_REACHED = 'App limit reached',
}

export type CreateAppErrorType = ValidateErrorSubType<{
	code: CreateAppErrorCode;
}>;

export type CreateAppDTO = ServerResponse<CreateAppDTOAppData, GetServerError<CreateAppErrorType>>;
