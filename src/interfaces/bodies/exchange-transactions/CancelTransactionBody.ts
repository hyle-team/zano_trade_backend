import UserData from '../../common/UserData';

interface CancelTransactionBody {
	transactionId: string;
	userData: UserData;
}

export default CancelTransactionBody;
