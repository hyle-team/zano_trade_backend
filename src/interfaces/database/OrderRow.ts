import OfferType from '../common/OfferType';

interface OrderRow {
	id: string;
	type: OfferType;
	timestamp: string;
	side: string;
	price: number;
	amount: number;
	total: number;
	pair_id: string;
	user_id: string;
	status: string;
	left: number;
}

export default OrderRow;
