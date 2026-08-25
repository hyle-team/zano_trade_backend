export type GetAllTransactionsByAddressResTransactionData = {
	id: number;
	buy_order_id: number;
	sell_order_id: number;
	amount: string;
	timestamp: number;
	status: 'pending' | 'confirmed' | 'rejected';
	creator: 'buy' | 'sell';
	hex_raw_proposal: string;
};

export type GetAllTransactionsByAddressSuccessRes = {
	success: true;
	totalItemsCount: number;
	data: GetAllTransactionsByAddressResTransactionData[];
};

export enum GetAllTransactionsByAddressErrorCode {
	// eslint-disable-next-line no-unused-vars
	UNHANDLED_ERROR = 'Unhandled error',
}

export type GetAllTransactionsByAddressErrorRes = {
	success: false;
	data: GetAllTransactionsByAddressErrorCode;
};

type GetAllTransactionsByAddressRes =
	| GetAllTransactionsByAddressSuccessRes
	| GetAllTransactionsByAddressErrorRes;

export default GetAllTransactionsByAddressRes;
