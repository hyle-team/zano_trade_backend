import UserData from '../../common/UserData';

interface ConfirmTransactionBody {
	transactionId: string;
	userData: UserData;
}

export default ConfirmTransactionBody;
