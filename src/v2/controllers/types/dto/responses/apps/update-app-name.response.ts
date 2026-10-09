export type UpdateAppNameDTOAppData = {
	id: number;
	name: string;
};

export type UpdateAppNameSuccessDTO = {
	success: true;
	data: UpdateAppNameDTOAppData;
};

export enum UpdateAppNameErrorCode {
	APP_NOT_FOUND = 'App not found',
	NAME_TAKEN = 'Name taken',
}

export type UpdateAppNameErrorDTO = {
	success: false;
	data: UpdateAppNameErrorCode;
};

export type UpdateAppNameDTO = UpdateAppNameSuccessDTO | UpdateAppNameErrorDTO;
