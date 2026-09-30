export type UpdateAppNameResAppData = {
	id: number;
	name: string;
};

export type UpdateAppNameSuccessRes = {
	success: true;
	data: UpdateAppNameResAppData;
};

export enum UpdateAppNameErrorCode {
	APP_NOT_FOUND = 'App not found',
	NAME_TAKEN = 'Name taken',
}

export type UpdateAppNameErrorRes = {
	success: false;
	data: UpdateAppNameErrorCode;
};

type UpdateAppNameRes = UpdateAppNameSuccessRes | UpdateAppNameErrorRes;

export default UpdateAppNameRes;
