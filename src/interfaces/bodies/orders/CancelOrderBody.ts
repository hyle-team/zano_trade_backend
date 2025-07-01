import UserData from '../../common/UserData';

interface CancelOrderBody {
	orderId: string;
	userData: UserData;
}

export default CancelOrderBody;
