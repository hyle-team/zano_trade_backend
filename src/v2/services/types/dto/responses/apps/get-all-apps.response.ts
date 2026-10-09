export enum GetAllAppsErrorCode {
	USER_NOT_FOUND = 'User not found',
}

export type GetAllAppsDTOAppData = {
	id: number;
	name: string;
	apiKeyExists: boolean;
};

export type GetAllAppsSuccessDTO = {
	success: true;
	data: GetAllAppsDTOAppData[];
};

export type GetAllAppsErrorDTO = {
	success: false;
	data: GetAllAppsErrorCode;
};

export type GetAllAppsDTO = GetAllAppsSuccessDTO | GetAllAppsErrorDTO;
