export type GetAllAppsResAppData = {
	id: number;
	name: string;
	api_key_exists: boolean;
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

type GetAllAppsRes = GetAllAppsSuccessRes | GetAllAppsErrorRes;

export default GetAllAppsRes;
