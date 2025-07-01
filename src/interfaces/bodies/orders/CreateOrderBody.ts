import OfferType from '../../common/OfferType';
import Side from '../../common/Side';
import UserData from '../../common/UserData';

interface OrderData {
	type: OfferType;
	side: Side;
	price: string;
	amount: string;
	pairId: string;
}

interface CreateOrderBody {
	userData: UserData;
	orderData: OrderData;
}

export default CreateOrderBody;
