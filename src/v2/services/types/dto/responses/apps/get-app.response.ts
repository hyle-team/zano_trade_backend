export enum GetAppErrorCode {
	USER_NOT_FOUND = 'User not found',
	APP_NOT_FOUND = 'App not found',
}

export type GetAppDTOApiKeyData = {
	issuedAt: Date;
};

export type GetAppDTOAppData = {
	id: number;
	name: string;
	apiKey: GetAppDTOApiKeyData | null;
};

export type GetAppSuccessDTO = {
	success: true;
	data: GetAppDTOAppData;
};

export type GetAppErrorDTO = {
	success: false;
	data: GetAppErrorCode;
};

export type GetAppDTO = GetAppSuccessDTO | GetAppErrorDTO;
