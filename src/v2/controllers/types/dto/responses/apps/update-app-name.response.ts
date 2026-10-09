import { ServerResponse } from '@/v2/controllers/types/dto/responses/shared/responses-typing/response';
import { GetServerError } from '@/v2/controllers/types/dto/responses/shared/shared.response';
import { ValidateErrorSubType } from '@/v2/controllers/types/dto/responses/shared/responses-typing/error-response';

export type UpdateAppNameDTOAppData = {
	id: number;
	name: string;
};

export enum UpdateAppNameErrorCode {
	APP_NOT_FOUND = 'App not found',
	NAME_TAKEN = 'Name taken',
}

export type UpdateAppNameErrorType = ValidateErrorSubType<{
	code: UpdateAppNameErrorCode;
}>;

export type UpdateAppNameDTO = ServerResponse<
	UpdateAppNameDTOAppData,
	GetServerError<UpdateAppNameErrorType>
>;
