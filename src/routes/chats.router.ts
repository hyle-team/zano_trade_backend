import express from 'express';
import chatsController from '../controllers/chats.controller.js';
import middleware from '../middleware/middleware.js';

const chatsRouter = express.Router();

chatsRouter.use(
	[
		'/chats/create',
		'/chats/get-chat',
		'/chats/get-all-chats',
		'/chats/delete-chat',
		'/chats/get-chat-chunk',
	],
	middleware.verifyToken,
);
chatsRouter.post('/chats/create', chatsController.create);
chatsRouter.post('/chats/get-chat', chatsController.getChat);
chatsRouter.post('/chats/get-chat-chunk', chatsController.getChatChunk);
chatsRouter.post('/chats/get-all-chats', chatsController.getAllChats);
chatsRouter.post('/chats/delete-chat', chatsController.deleteChat);

export default chatsRouter;
