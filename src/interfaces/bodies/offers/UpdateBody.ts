import OfferType from '../../common/OfferType';
import UserData from '../../common/UserData';

interface OfferData {
	price: number;
	min: number;
	max: number;
	deposit_seller: number;
	deposit_buyer: number;
	type: OfferType;
	comment?: string;
	input_currency_id: string;
	target_currency_id: string;
	deposit_currency_id: string;
	number?: string;
}

interface UpdateBody {
	userData: UserData;
	offerData: OfferData;
}

export default UpdateBody;
