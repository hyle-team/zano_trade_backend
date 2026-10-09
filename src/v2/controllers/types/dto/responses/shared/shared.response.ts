import { ValidationError } from 'express-validator';
import { ServerResponse } from '@/v2/controllers/types/dto/responses/shared/responses-typing/response';
import { ValidateErrorSubType } from '@/v2/controllers/types/dto/responses/shared/responses-typing/error-response';
import { ErrorType } from '@/v2/controllers/types/dto/responses/shared/responses-typing/error-response';

export const enum SharedErrorCode {
	INTERNAL_ERROR = 'INTERNAL_ERROR',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	UNAUTHORIZED = 'UNAUTHORIZED',
	INVALID_BODY_JSON_ERROR = 'INVALID_BODY_JSON_ERROR',
	TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
}

export type InternalErrorType = ValidateErrorSubType<{
	code: SharedErrorCode.INTERNAL_ERROR;
}>;

export type ValidationErrorType = ValidateErrorSubType<{
	code: SharedErrorCode.VALIDATION_ERROR;
	details: ValidationError[];
}>;

export type UnauthorizedErrorType = ValidateErrorSubType<{
	code: SharedErrorCode.UNAUTHORIZED;
}>;

export type InvalidBodyJsonErrorType = ValidateErrorSubType<{
	code: SharedErrorCode.INVALID_BODY_JSON_ERROR;
}>;

export type TooManyRequestsErrorType = ValidateErrorSubType<{
	code: SharedErrorCode.TOO_MANY_REQUESTS;
}>;

export type InternalErrorResponse = ServerResponse<never, InternalErrorType>;

// Add new shared error types below as new global error types are required
export type SharedErrorType = ValidateErrorSubType<
| InternalErrorType
| ValidationErrorType
| UnauthorizedErrorType
| InvalidBodyJsonErrorType
| TooManyRequestsErrorType
>;

export type SharedErrorResponse = ServerResponse<never, SharedErrorType>;

export type GetServerError<T extends ErrorType | undefined = undefined> = T extends undefined
	? SharedErrorType
	: T | SharedErrorType;
