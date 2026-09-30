export enum UpdateAppNameModelErrorCode {
	USER_NOT_FOUND = 'User not found',
	APP_NOT_FOUND = 'App not found',
	NAME_TAKEN = 'Name taken',
}

export type UpdateAppNameModelResAppData = {
	id: number;
	name: string;
};

export type UpdateAppNameModelSuccessRes = {
	success: true;
	data: UpdateAppNameModelResAppData;
};

export type UpdateAppNameModelErrorRes = {
	success: false;
	data: UpdateAppNameModelErrorCode;
};

type UpdateAppNameModelRes = UpdateAppNameModelSuccessRes | UpdateAppNameModelErrorRes;

export default UpdateAppNameModelRes;
