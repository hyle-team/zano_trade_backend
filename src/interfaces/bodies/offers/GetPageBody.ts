import OfferType from '../../common/OfferType';

interface PageData {
	type: OfferType;
	page: number;
	input_currency_id?: string;
	target_currency_id?: string;
	price?: number;
	priceDescending?: boolean;
}

interface GetPageBody {
	data: PageData;
}

export default GetPageBody;

export { type PageData };
