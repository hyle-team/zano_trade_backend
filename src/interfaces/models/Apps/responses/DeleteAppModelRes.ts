export enum DeleteAppModelErrorCode {
	USER_NOT_FOUND = 'User not found',
	APP_NOT_FOUND = 'App not found',
}

export type DeleteAppModelResAppData = {
	id: number;
};

export type DeleteAppModelSuccessRes = {
	success: true;
	data: DeleteAppModelResAppData;
};

export type DeleteAppModelErrorRes = {
	success: false;
	data: DeleteAppModelErrorCode;
};

type DeleteAppModelRes = DeleteAppModelSuccessRes | DeleteAppModelErrorRes;

export default DeleteAppModelRes;
