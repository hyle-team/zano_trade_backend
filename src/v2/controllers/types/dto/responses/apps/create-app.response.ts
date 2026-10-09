export type CreateAppDTOAppData = {
	id: number;
	name: string;
};

export type CreateAppSuccessDTO = {
	success: true;
	data: CreateAppDTOAppData;
};

export enum CreateAppErrorCode {
	NAME_TAKEN = 'Name taken',
	APP_LIMIT_REACHED = 'App limit reached',
}

export type CreateAppErrorDTO = {
	success: false;
	data: CreateAppErrorCode;
};

export type CreateAppDTO = CreateAppSuccessDTO | CreateAppErrorDTO;
