import PairData from '@/interfaces/common/PairData';
import UserData from '../../common/UserData';

interface OrderData {
	id: number;
	type: string;
	timestamp: number;
	side: string;
	price: number;
	amount: number;
	total: number;
	pair_id: number;
	user_id?: undefined;
	status: string;
	left: number;
	user: UserData;
	pair: PairData;
	immediateMatch: boolean;
}

export default OrderData;
