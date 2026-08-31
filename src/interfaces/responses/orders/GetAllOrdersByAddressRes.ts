export type GetAllOrdersByAddressResOrderData = {
	id: number;
	type: string;
	timestamp: number;
	side: string;
	price: string;
	amount: string;
	total: string;
	pair_id: number;
	user_id: number;
	status: string;
	left: string;
	min_per_apply_amount: string | null;
	max_per_apply_amount: string | null;
};

export type GetAllOrdersByAddressSuccessRes = {
	success: true;
	totalItemsCount: number;
	data: GetAllOrdersByAddressResOrderData[];
};

export enum GetAllOrdersByAddressErrorCode {
	// eslint-disable-next-line no-unused-vars
	UNHANDLED_ERROR = 'Unhandled error',
}

export type GetAllOrdersByAddressErrorRes = {
	success: false;
	data: GetAllOrdersByAddressErrorCode;
};

type GetAllOrdersByAddressRes = GetAllOrdersByAddressSuccessRes | GetAllOrdersByAddressErrorRes;

export default GetAllOrdersByAddressRes;
