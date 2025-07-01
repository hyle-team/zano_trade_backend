import UserData from '../../common/UserData';

interface ApplyTip {
	id: number;
	left: string;
	price: string;
	user: UserData;
	timestamp?: number;
	type: string;
	total: string;
	connected_order_id: number;
	transaction: boolean;
	hex_raw_proposal?: string;
	isInstant?: boolean;
}

export default ApplyTip;
