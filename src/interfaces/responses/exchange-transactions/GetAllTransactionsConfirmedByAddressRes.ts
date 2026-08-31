export type GetAllTransactionsConfirmedByAddressResTransactionData = {
	id: number;
	buy_order_id: number;
	sell_order_id: number;
	amount: string;
	timestamp: number;
	finalize_timestamp: number | null;
	status: 'confirmed';
	creator: 'buy' | 'sell';
	hex_raw_proposal: string;
};

export type GetAllTransactionsConfirmedByAddressSuccessRes = {
	success: true;
	totalItemsCount: number;
	data: GetAllTransactionsConfirmedByAddressResTransactionData[];
};

export enum GetAllTransactionsConfirmedByAddressErrorCode {
	// eslint-disable-next-line no-unused-vars
	UNHANDLED_ERROR = 'Unhandled error',
}

export type GetAllTransactionsConfirmedByAddressErrorRes = {
	success: false;
	data: GetAllTransactionsConfirmedByAddressErrorCode;
};

type GetAllTransactionsConfirmedByAddressRes =
	| GetAllTransactionsConfirmedByAddressSuccessRes
	| GetAllTransactionsConfirmedByAddressErrorRes;

export default GetAllTransactionsConfirmedByAddressRes;
