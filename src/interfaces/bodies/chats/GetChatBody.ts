import UserData from '../../common/UserData';

interface GetChatBody {
	userData: UserData;
	id: string;
	chat_id?: undefined;
}

export default GetChatBody;
