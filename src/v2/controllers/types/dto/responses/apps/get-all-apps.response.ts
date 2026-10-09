export type GetAllAppsResAppData = {
	id: number;
	name: string;
	apiKeyExists: boolean;
};

export type GetAllAppsSuccessRes = {
	success: true;
	data: GetAllAppsResAppData[];
};

export enum GetAllAppsErrorCode {}

export type GetAllAppsErrorRes = {
	success: false;
	data: GetAllAppsErrorCode;
};

export type GetAllAppsRes = GetAllAppsSuccessRes | GetAllAppsErrorRes;
