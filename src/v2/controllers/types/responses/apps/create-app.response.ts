export type CreateAppResAppData = {
	id: number;
	name: string;
};

export type CreateAppSuccessRes = {
	success: true;
	data: CreateAppResAppData;
};

export enum CreateAppErrorCode {
	NAME_TAKEN = 'Name taken',
	APP_LIMIT_REACHED = 'App limit reached',
}

export type CreateAppErrorRes = {
	success: false;
	data: CreateAppErrorCode;
};

type CreateAppRes = CreateAppSuccessRes | CreateAppErrorRes;

export default CreateAppRes;
