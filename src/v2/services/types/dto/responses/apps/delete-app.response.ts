export enum DeleteAppErrorCode {
	USER_NOT_FOUND = 'User not found',
	APP_NOT_FOUND = 'App not found',
}

export type DeleteAppDTOAppData = {
	id: number;
};

export type DeleteAppSuccessDTO = {
	success: true;
	data: DeleteAppDTOAppData;
};

export type DeleteAppErrorDTO = {
	success: false;
	data: DeleteAppErrorCode;
};

export type DeleteAppDTO = DeleteAppSuccessDTO | DeleteAppErrorDTO;
