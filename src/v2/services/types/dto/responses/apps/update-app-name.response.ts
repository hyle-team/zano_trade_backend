export enum UpdateAppNameErrorCode {
	USER_NOT_FOUND = 'User not found',
	APP_NOT_FOUND = 'App not found',
	NAME_TAKEN = 'Name taken',
}

export type UpdateAppNameDTOAppData = {
	id: number;
	name: string;
};

export type UpdateAppNameSuccessDTO = {
	success: true;
	data: UpdateAppNameDTOAppData;
};

export type UpdateAppNameErrorDTO = {
	success: false;
	data: UpdateAppNameErrorCode;
};

export type UpdateAppNameDTO = UpdateAppNameSuccessDTO | UpdateAppNameErrorDTO;
