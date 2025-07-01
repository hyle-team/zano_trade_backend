import UserData from '../../common/UserData';

interface DeleteBody {
	userData: UserData;
	offerData: {
		number: string;
	};
}

export default DeleteBody;
