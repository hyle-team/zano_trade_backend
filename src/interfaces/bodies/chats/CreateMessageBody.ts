import Message from '../../common/Message';
import UserData from '../../common/UserData';

interface CreateMessageBody {
	chat_id: string;
	userData: UserData;
	message: Message;
}

export default CreateMessageBody;
