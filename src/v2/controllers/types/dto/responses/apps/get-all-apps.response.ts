export type GetAllAppsDTOAppData = {
	id: number;
	name: string;
	apiKeyExists: boolean;
};

export type GetAllAppsSuccessDTO = {
	success: true;
	data: GetAllAppsDTOAppData[];
};

export enum GetAllAppsErrorCode {}

export type GetAllAppsErrorDTO = {
	success: false;
	data: GetAllAppsErrorCode;
};

export type GetAllAppsDTO = GetAllAppsSuccessDTO | GetAllAppsErrorDTO;
