export enum GetAppModelErrorCode {
	USER_NOT_FOUND = 'User not found',
	APP_NOT_FOUND = 'App not found',
}

export type GetAppModelResApiKeyData = {
	issuedAt: Date;
};

export type GetAppModelResAppData = {
	id: number;
	name: string;
	apiKey: GetAppModelResApiKeyData | null;
};

export type GetAppModelSuccessRes = {
	success: true;
	data: GetAppModelResAppData;
};

export type GetAppModelErrorRes = {
	success: false;
	data: GetAppModelErrorCode;
};

type GetAppModelRes = GetAppModelSuccessRes | GetAppModelErrorRes;

export default GetAppModelRes;
