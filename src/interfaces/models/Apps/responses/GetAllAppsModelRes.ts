export enum GetAllAppsModelErrorCode {
	USER_NOT_FOUND = 'User not found',
}

export type GetAllAppsModelResAppData = {
	id: number;
	name: string;
	apiKeyExists: boolean;
};

export type GetAllAppsModelSuccessRes = {
	success: true;
	data: GetAllAppsModelResAppData[];
};

export type GetAllAppsModelErrorRes = {
	success: false;
	data: GetAllAppsModelErrorCode;
};

type GetAllAppsModelRes = GetAllAppsModelSuccessRes | GetAllAppsModelErrorRes;

export default GetAllAppsModelRes;
