export enum DeleteAppServiceErrorCode {
	USER_NOT_FOUND = 'User not found',
	APP_NOT_FOUND = 'App not found',
}

export type DeleteAppServiceResAppData = {
	id: number;
};

export type DeleteAppServiceSuccessRes = {
	success: true;
	data: DeleteAppServiceResAppData;
};

export type DeleteAppServiceErrorRes = {
	success: false;
	data: DeleteAppServiceErrorCode;
};

type DeleteAppServiceRes = DeleteAppServiceSuccessRes | DeleteAppServiceErrorRes;

export default DeleteAppServiceRes;
