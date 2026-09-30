export type GetAppResAppData = {
	id: number;
	name: string;
	apiKeyExists: boolean;
};

export type GetAppSuccessRes = {
	success: true;
	data: GetAppResAppData;
};

export enum GetAppErrorCode {
	APP_NOT_FOUND = 'App not found',
}

export type GetAppErrorRes = {
	success: false;
	data: GetAppErrorCode;
};

type GetAppRes = GetAppSuccessRes | GetAppErrorRes;

export default GetAppRes;
