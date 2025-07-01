import UserData from '../../common/UserData';

interface CreateBody {
	userData: UserData;
	number: string;
	chatData: {
		pay: string;
		receive: string;
	};
}

export default CreateBody;
