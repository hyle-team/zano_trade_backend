export enum CreateAppTokenRowServiceErrorCode {}

export type CreateAppTokenRowServiceResApiKeyData = null;

export type CreateAppTokenRowServiceSuccessRes = {
	success: true;
	data: CreateAppTokenRowServiceResApiKeyData;
};

export type CreateAppTokenRowServiceErrorRes = {
	success: false;
	data: CreateAppTokenRowServiceErrorCode;
};

export type CreateAppTokenRowServiceRes =
	| CreateAppTokenRowServiceSuccessRes
	| CreateAppTokenRowServiceErrorRes;
