import UserData from '@/interfaces/common/UserData';

export default interface GetActiveTxByOrdersIdsBody {
	userData: UserData;
	from: string;
	to: string;
}
