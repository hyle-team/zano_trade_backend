export type GetUserOrdersAllPairsResPair = {
	id: number;
	firstCurrency: {
		id: number;
		ticker: string;
	};
	secondCurrency: {
		id: number;
		ticker: string;
	};
};

export type GetUserOrdersAllPairsSuccessRes = {
	success: true;
	data: GetUserOrdersAllPairsResPair[];
};

export enum GetUserOrdersAllPairsErrorCode {
	// eslint-disable-next-line no-unused-vars
	UNHANDLED_ERROR = 'Unhandled error',
}

export type GetUserOrdersAllPairsErrorRes = {
	success: false;
	data: GetUserOrdersAllPairsErrorCode;
};

type GetUserOrdersAllPairsRes = GetUserOrdersAllPairsSuccessRes | GetUserOrdersAllPairsErrorRes;

export default GetUserOrdersAllPairsRes;
