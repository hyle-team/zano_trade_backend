import { Request, Response } from 'express';
import chatsModel from '../models/Chats.js';
import CreateBody from '../interfaces/bodies/chats/CreateBody.js';
import GetChatBody from '../interfaces/bodies/chats/GetChatBody.js';
import GetAllChatsBody from '../interfaces/bodies/chats/GetAllChatsBody.js';
import DeleteChatBody from '../interfaces/bodies/chats/DeleteChatBody.js';

class ChatsController {
	async create(req: Request, res: Response) {
		try {
			const { number } = req.body as CreateBody;
			const { chatData } = req.body as CreateBody;

			const rangeAcceptable =
				parseFloat(chatData.receive) >= 0 &&
				parseFloat(chatData.receive) <= 100000000000000000;

			if (!(number && chatData && chatData.pay && chatData.receive && rangeAcceptable))
				return res.status(400).send({ success: false, data: 'Invalid offer data' });

			const result = await chatsModel.create(req.body as CreateBody);

			if (result.success) {
				return res.status(200).send(result);
			}

			if (
				result.data === 'Same user' ||
				result.data === 'Invalid offer data' ||
				result.data === 'User not registered'
			) {
				return res.status(400).send(result);
			}

			return res.status(500).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}

	async getChat(req: Request, res: Response) {
		try {
			if (!(req.body as GetChatBody).id)
				return res.status(400).send({ success: false, data: 'Invalid chat data' });

			const result = await chatsModel.getChat(req.body as GetChatBody);

			if (result.success) {
				return res.status(200).send(result);
			}

			if (result.data === 'Unauthorized') {
				return res.status(401).send(result);
			}

			if (result.data === 'Invalid chat data' || result.data === 'User not registered') {
				return res.status(400).send(result);
			}

			return res.status(500).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}

	async getChatChunk(req: Request, res: Response) {
		try {
			const body = req.body as GetChatBody & { chunkNumber: number };

			if (!(body.id && body.chunkNumber))
				return res.status(400).send({ success: false, data: 'Invalid chat data' });

			const result = await chatsModel.getChatChunk(body);

			if (result.success) {
				return res.status(200).send(result);
			}

			if (result.data === 'Unauthorized') {
				return res.status(401).send(result);
			}

			if (result.data === 'Invalid chat data' || result.data === 'User not registered') {
				return res.status(400).send(result);
			}

			return res.status(500).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}

	async getAllChats(req: Request, res: Response) {
		try {
			const result = await chatsModel.getAllChats(req.body as GetAllChatsBody);

			if (result.success) {
				return res.status(200).send(result);
			}

			if (result.data === 'User not registered') {
				return res.status(400).send(result);
			}

			res.status(500).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}

	async deleteChat(req: Request, res: Response) {
		try {
			if (!(req.body as DeleteChatBody).id)
				return res.status(400).send({ success: false, data: 'Invalid chat data' });

			const result = await chatsModel.deleteChat(req.body as DeleteChatBody);

			if (result.success) {
				return res.status(200).send(result);
			}

			if (result.data === 'Unauthorized') {
				return res.status(401).send(result);
			}

			if (result.data === 'Invalid chat data' || result.data === 'User not registered') {
				return res.status(400).send(result);
			}

			return res.status(500).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}
}

const chatsController = new ChatsController();

export default chatsController;
