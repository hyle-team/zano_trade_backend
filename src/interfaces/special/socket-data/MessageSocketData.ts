import Message from '../../common/Message';
import AuthorizedData from './AuthorizedData';

interface MessageSocketData extends AuthorizedData {
	message: Message;
}

export default MessageSocketData;
