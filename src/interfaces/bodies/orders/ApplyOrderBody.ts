import UserData from '../../common/UserData';

interface OrderData {
	id: string;
	connected_order_id: string;
	hex_raw_proposal: string;
}

interface ApplyOrderBody {
	userData: UserData;
	orderData: OrderData;
}

export default ApplyOrderBody;
