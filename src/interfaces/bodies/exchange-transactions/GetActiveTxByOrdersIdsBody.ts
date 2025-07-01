import UserData from '@/interfaces/common/UserData';

export default interface GetActiveTxByOrdersIdsBody {
	userData: UserData;
	firstOrderId: number;
	secondOrderId: number;
}
