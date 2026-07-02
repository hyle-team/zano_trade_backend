import express from 'express';
import { createValidator } from '@/interfaces/bodies/chats/CreateBody.js';
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
	middleware.authGuard,
);
chatsRouter.post(
	'/chats/create',
	middleware.expressValidator(createValidator),
	chatsController.create,
);
chatsRouter.post('/chats/get-chat', chatsController.getChat);
chatsRouter.post('/chats/get-chat-chunk', chatsController.getChatChunk);
chatsRouter.post('/chats/get-all-chats', chatsController.getAllChats);
chatsRouter.post('/chats/delete-chat', chatsController.deleteChat);

export default chatsRouter;
