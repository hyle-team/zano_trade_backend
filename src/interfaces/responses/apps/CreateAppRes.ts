export type CreateAppResAppData = {
	id: number;
	name: string;
};

export type CreateAppSuccessRes = {
	success: true;
	data: CreateAppResAppData;
};

export enum CreateAppErrorCode {}

export type CreateAppErrorRes = {
	success: false;
	data: CreateAppErrorCode;
};

type CreateAppRes = CreateAppSuccessRes | CreateAppErrorRes;

export default CreateAppRes;
