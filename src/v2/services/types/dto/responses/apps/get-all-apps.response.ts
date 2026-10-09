export enum GetAllAppsServiceErrorCode {
	USER_NOT_FOUND = 'User not found',
}

export type GetAllAppsServiceResAppData = {
	id: number;
	name: string;
	apiKeyExists: boolean;
};

export type GetAllAppsServiceSuccessRes = {
	success: true;
	data: GetAllAppsServiceResAppData[];
};

export type GetAllAppsServiceErrorRes = {
	success: false;
	data: GetAllAppsServiceErrorCode;
};

export type GetAllAppsServiceRes = GetAllAppsServiceSuccessRes | GetAllAppsServiceErrorRes;
