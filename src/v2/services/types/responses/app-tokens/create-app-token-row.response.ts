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

type CreateAppTokenRowServiceRes =
	| CreateAppTokenRowServiceSuccessRes
	| CreateAppTokenRowServiceErrorRes;

export default CreateAppTokenRowServiceRes;
