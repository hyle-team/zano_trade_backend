export type GetAppDTOAppData = {
	id: number;
	name: string;
	apiKeyExists: boolean;
};

export type GetAppSuccessDTO = {
	success: true;
	data: GetAppDTOAppData;
};

export enum GetAppErrorCode {
	APP_NOT_FOUND = 'App not found',
}

export type GetAppErrorDTO = {
	success: false;
	data: GetAppErrorCode;
};

export type GetAppDTO = GetAppSuccessDTO | GetAppErrorDTO;
