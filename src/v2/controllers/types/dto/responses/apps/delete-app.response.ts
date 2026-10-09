export type DeleteAppResAppData = {
	id: number;
};

export type DeleteAppSuccessRes = {
	success: true;
	data: DeleteAppResAppData;
};

export enum DeleteAppErrorCode {
	APP_NOT_FOUND = 'App not found',
}

export type DeleteAppErrorRes = {
	success: false;
	data: DeleteAppErrorCode;
};

export type DeleteAppRes = DeleteAppSuccessRes | DeleteAppErrorRes;
