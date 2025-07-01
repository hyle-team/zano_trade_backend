import OfferType from '../common/OfferType';

interface OfferRow {
	id: string;
	user_id: string;
	price: number;
	min: number;
	max: number;
	deposit_seller: number;
	deposit_buyer: number;
	type: OfferType;
	input_currency_id: string;
	target_currency_id: string;
	comment: string | null;
	number: string;
	offer_status: 'default' | 'process' | 'hidden' | 'finished';
	deposit_currency_id: string;
	timestamp: string;
}

export default OfferRow;
