export type CancelAllSuccessRes = {
	success: true;
};

export enum CancelAllErrorCode {
	// eslint-disable-next-line no-unused-vars
	UNHANDLED_ERROR = 'Unhandled error',
}

export type CancelAllErrorRes = {
	success: false;
	data: CancelAllErrorCode;
};

type CancelAllRes = CancelAllSuccessRes | CancelAllErrorRes;

export default CancelAllRes;
