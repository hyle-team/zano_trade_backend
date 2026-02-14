export type GetUserOrdersResCurrency = {
	id: number;
	name: string;
	code: string;
	type: string;
	asset_id: string;
	auto_parsed: boolean;
	asset_info?: {
		asset_id: string;
		logo: string;
		price_url: string;
		ticker: string;
		full_name: string;
		total_max_supply: string;
		current_supply: string;
		decimal_point: number;
		meta_info: string;
	};
	whitelisted: boolean;
};

export type GetUserOrdersResOrderData = {
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
	hasNotification: boolean;

	pair: {
		id: number;
		first_currency_id: number;
		second_currency_id: number;
		rate?: number;
		coefficient?: number;
		high?: number;
		low?: number;
		volume: number;
		featured: boolean;

		first_currency: GetUserOrdersResCurrency;
		second_currency: GetUserOrdersResCurrency;
	};

	first_currency: GetUserOrdersResCurrency;
	second_currency: GetUserOrdersResCurrency;
	isInstant: boolean;
};

export type GetUserOrdersSuccessRes = {
	success: true;
	data: GetUserOrdersResOrderData[];
};

export enum GetUserOrdersErrorCode {
	// eslint-disable-next-line no-unused-vars
	UNHANDLED_ERROR = 'Unhandled error',
}

export type GetUserOrdersErrorRes = {
	success: false;
	data: GetUserOrdersErrorCode;
};

type GetUserOrdersRes = GetUserOrdersSuccessRes | GetUserOrdersErrorRes;

export default GetUserOrdersRes;
