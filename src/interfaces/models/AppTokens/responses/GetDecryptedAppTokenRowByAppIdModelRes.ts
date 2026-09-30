export enum GetDecryptedAppTokenRowByAppIdModelErrorCode {}

export type GetDecryptedAppTokenRowByAppIdResApiKeyData = {
	id: number;
	appId: number;
	value: string;
	issuedAt: Date;
};

export type GetDecryptedAppTokenRowByAppIdModelSuccessRes = {
	success: true;
	data: GetDecryptedAppTokenRowByAppIdResApiKeyData | null;
};

export type GetDecryptedAppTokenRowByAppIdModelErrorRes = {
	success: false;
	data: GetDecryptedAppTokenRowByAppIdModelErrorCode;
};

type GetDecryptedAppTokenRowByAppIdRes =
	| GetDecryptedAppTokenRowByAppIdModelSuccessRes
	| GetDecryptedAppTokenRowByAppIdModelErrorRes;

export default GetDecryptedAppTokenRowByAppIdRes;
