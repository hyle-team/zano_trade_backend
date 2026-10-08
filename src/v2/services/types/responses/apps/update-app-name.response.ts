export enum UpdateAppNameServiceErrorCode {
	USER_NOT_FOUND = 'User not found',
	APP_NOT_FOUND = 'App not found',
	NAME_TAKEN = 'Name taken',
}

export type UpdateAppNameServiceResAppData = {
	id: number;
	name: string;
};

export type UpdateAppNameServiceSuccessRes = {
	success: true;
	data: UpdateAppNameServiceResAppData;
};

export type UpdateAppNameServiceErrorRes = {
	success: false;
	data: UpdateAppNameServiceErrorCode;
};

export type UpdateAppNameServiceRes = UpdateAppNameServiceSuccessRes | UpdateAppNameServiceErrorRes;
