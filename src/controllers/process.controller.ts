import CreateMessageBody from '../interfaces/bodies/chats/CreateMessageBody.js';
import ChatSocketData from '../interfaces/special/socket-data/ChatSocketData.js';
import DepositSocketData from '../interfaces/special/socket-data/DepositSocketData.js';
import chatsModel from '../models/Chats.js';

class ProcessController {
	async createMessage(data: CreateMessageBody) {
		try {
			const isFull =
				data.chat_id &&
				data.message &&
				((data.message.type !== 'img' &&
					data.message.text &&
					data.message.text?.length <= 10000) ||
					(data.message.type === 'img' && data.message.url));

			if (!isFull) return { success: false, data: 'Invalid message data' };

			const result = await chatsModel.createMessage({
				chat_id: data.chat_id,
				userData: data.userData,
				message: {
					...data.message,
					success: false,
					fail: false,
				},
			} as CreateMessageBody);

			return result;
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Unhandled error' };
		}
	}

	async changeDeposit(data: DepositSocketData) {
		try {
			const isFull = data.chat_id && data.deposit_state;

			if (!isFull) return { success: false, data: 'Invalid deposit state data' };

			const result = await chatsModel.changeDeposit(data);
			return result;
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Unhandled error' };
		}
	}

	async setWatched(data: ChatSocketData) {
		try {
			const isFull = data.chat_id;

			if (!isFull) return { success: false, data: 'Invalid watched data' };

			const result = await chatsModel.setWatched(data);
			return result;
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Unhandled error' };
		}
	}
}

const processController = new ProcessController();

export default processController;
