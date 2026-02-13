export type CreateOrderSuccessRes = {
	success: true;
	data: {
		hasNotification: boolean;
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
		immediateMatch?: true;
	};
};

export enum CreateOrderErrorCode {
	// eslint-disable-next-line no-unused-vars
	INVALID_ORDER_DATA = 'Invalid order data',
	// eslint-disable-next-line no-unused-vars
	SAME_ORDER = 'Same order',
	// eslint-disable-next-line no-unused-vars
	UNHANDLED_ERROR = 'Unhandled error',
}

export type CreateOrderErrorRes = {
	success: false;
	data: CreateOrderErrorCode;
};

type CreateOrderRes = CreateOrderSuccessRes | CreateOrderErrorRes;

export default CreateOrderRes;
