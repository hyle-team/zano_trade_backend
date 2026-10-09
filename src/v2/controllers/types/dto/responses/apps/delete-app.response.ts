export type DeleteAppDTOAppData = {
	id: number;
};

export type DeleteAppSuccessDTO = {
	success: true;
	data: DeleteAppDTOAppData;
};

export enum DeleteAppErrorCode {
	APP_NOT_FOUND = 'App not found',
}

export type DeleteAppErrorDTO = {
	success: false;
	data: DeleteAppErrorCode;
};

export type DeleteAppDTO = DeleteAppSuccessDTO | DeleteAppErrorDTO;
