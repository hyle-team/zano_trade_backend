import Currency from '../../../schemes/Currency';

interface UserDataWithId {
	id: number;
	alias: string;
	address: string;
	favourite_currencies: string[] | undefined;
}

interface ChatData {
	id: number;
	user_id: number;
	price: number;
	min: number;
	max: number;
	deposit_seller: number;
	deposit_buyer: number;
	type: string;
	input_currency: Currency | null;
	target_currency: Currency | null;
	comment: string | null;
	number: string;
	offer_status: string;
	deposit_currency: Currency | null;
	timestamp: bigint;
	creator_data: UserDataWithId;
	buyer_data: UserDataWithId;

	offer_number: string;
	buyer_id: number;
	chunk_count: number;
	status: string;
	pay: number;
	receive: number;
	owner_deposit: string | null;
	opponent_deposit: string | null;
	view_list: number[];

	favourite_currencies?: undefined;
}

interface GetChatResponse {
	success: true;
	data: ChatData;
}

export default GetChatResponse;
