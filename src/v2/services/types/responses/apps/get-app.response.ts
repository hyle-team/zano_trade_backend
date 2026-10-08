export enum GetAppServiceErrorCode {
	USER_NOT_FOUND = 'User not found',
	APP_NOT_FOUND = 'App not found',
}

export type GetAppServiceResApiKeyData = {
	issuedAt: Date;
};

export type GetAppServiceResAppData = {
	id: number;
	name: string;
	apiKey: GetAppServiceResApiKeyData | null;
};

export type GetAppServiceSuccessRes = {
	success: true;
	data: GetAppServiceResAppData;
};

export type GetAppServiceErrorRes = {
	success: false;
	data: GetAppServiceErrorCode;
};

export type GetAppServiceRes = GetAppServiceSuccessRes | GetAppServiceErrorRes;
