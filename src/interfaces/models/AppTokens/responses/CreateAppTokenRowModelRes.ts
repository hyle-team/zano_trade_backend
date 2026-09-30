export enum CreateAppTokenRowModelErrorCode {}

export type CreateAppTokenRowModelResApiKeyData = null;

export type CreateAppTokenRowModelSuccessRes = {
	success: true;
	data: CreateAppTokenRowModelResApiKeyData;
};

export type CreateAppTokenRowModelErrorRes = {
	success: false;
	data: CreateAppTokenRowModelErrorCode;
};

type CreateAppTokenRowModelRes = CreateAppTokenRowModelSuccessRes | CreateAppTokenRowModelErrorRes;

export default CreateAppTokenRowModelRes;
