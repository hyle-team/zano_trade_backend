import { Server } from 'socket.io';
import UserSocketData from '@/interfaces/special/socket-data/UserSocketData.js';
import { PairStats } from '@/interfaces/responses/orders/GetPairStatsRes.js';
import chatsModel from '../models/Chats.js';
import processController from '../controllers/process.controller.js';
import socketMiddleware, { verifyUser } from '../middleware/socket.js';
import ChatSocketData from '../interfaces/special/socket-data/ChatSocketData.js';
import SocketData from '../interfaces/special/socket-data/SocketData.js';
import DepositSocketData from '../interfaces/special/socket-data/DepositSocketData.js';
import MessageSocketData from '../interfaces/special/socket-data/MessageSocketData.js';
import AuthorizedData from '../interfaces/special/socket-data/AuthorizedData.js';
import OrderData from '../interfaces/special/socket-data/OrderData.js';

type ProcessResult =
	| {
			success: boolean;
			offerRow: unknown;
			existingChat: unknown;
			userRow: unknown;
			data?: undefined;
	  }
	| {
			success: boolean;
			message?: {
				text: string;
				timestamp: number;
				from_owner: boolean;
				success: boolean;
				fail: boolean;
				type?: string;
				url?: string;
				fromOwner?: boolean;
			};
			deposits_state: Record<string, unknown>;
	  }
	| {
			success: boolean;
			[key: string]: unknown;
	  };

async function runNotificationMethods(
	io: Server,
	data: AuthorizedData,
	result: ProcessResult | undefined = undefined,
) {
	if (result) {
		io.to(`chat${data.chat_id}`).emit('new-message', result);
	}

	io.to(`chat${data.chat_id}`).emit('check-connection');

	const chatAnswer = await chatsModel.getChat({ ...data, chat_id: undefined, id: data.chat_id });

	if (!chatAnswer.success) return;

	const chatData = chatAnswer.data;

	const socketSet =
		io.sockets.adapter.rooms.get(`user${chatData.creator_data.id}`) || new Set<string>();

	const userSockets = [
		...new Set<string>([
			...socketSet,
			...(io.sockets.adapter.rooms.get(`user${chatData.buyer_data.id}`) || []),
		]),
	];

	const chatSockets = [...(io.sockets.adapter.rooms.get(`chat${data.chat_id}`) || [])];

	const sendSockets = userSockets.filter((e) => !chatSockets.includes(e));

	for (const iterator of sendSockets) {
		io.to(iterator).emit('refresh-request');
	}
}

function socketStart(io: Server) {
	io.on('connection', (socket) => {
		socket.use(socketMiddleware);
		socket.use(verifyUser(['in-dex-notifications', 'out-dex-notifications']));

		socket.on('in-account', (data: SocketData) => {
			socket.join(`user${data.id}`);
		});

		socket.on('in-trading', (data: SocketData) => {
			socket.join(`trade${data.id}`);
		});

		socket.on('out-trading', (data: SocketData) => {
			socket.leave(`trade${data.id}`);
		});

		socket.on('in-dex-notifications', (data: UserSocketData) => {
			socket.join(`dex-notifications${data.userData.address}`);
		});

		socket.on('out-dex-notifications', (data: UserSocketData) => {
			socket.leave(`dex-notifications${data.userData.address}`);
		});

		socket.on('join', async (data: ChatSocketData) => {
			socket.join(`chat${data.chat_id}`);
			await processController.setWatched(data);
		});

		socket.on('change-deposit', async (data: DepositSocketData) => {
			const result = await processController.changeDeposit(data);

			if (!result.success) return result;

			await runNotificationMethods(io, data, result);
		});

		socket.on('create-message', async (data: MessageSocketData) => {
			const result = await processController.createMessage(data);
			if (!result.success) return result;

			await runNotificationMethods(io, data, result);
		});

		socket.on('submit-watched', async (data: ChatSocketData) => {
			await processController.setWatched(data);
		});

		socket.on('error', (err) => {
			console.log(err.message);
		});

		socket.on('leave', () => {
			const rooms = [...io.sockets.adapter.rooms.keys()];
			for (const room of rooms) {
				if (room.includes('chat')) {
					socket.leave(room);
				}
			}
		});

		socket.on('disconnect', () => {
			socket.rooms.forEach((e) => {
				socket.leave(e);
			});
		});
	});
}

function sendNewOrderMessage(io: Server, pairId: string, orderData: OrderData) {
	io.to(`trade${pairId}`).emit('new-order', { orderData });
}

function sendOrderNotificationMessage(io: Server, address: string, orderData: OrderData) {
	io.to(`dex-notifications${address}`).emit('order-notification', { orderData });
}

function sendOrderNotificationCancelation(io: Server, address: string, orderId: number) {
	io.to(`dex-notifications${address}`).emit('order-notification-cancelation', { orderId });
}

function sendDeleteOrderMessage(io: Server, pairId: string, orderId: string) {
	io.to(`trade${pairId}`).emit('delete-order', { orderId });
}

function sendUpdateOrderMessage(io: Server, pairId: string) {
	io.to(`trade${pairId}`).emit('update-orders');
}

function sendUpdatePairStatsMessage(io: Server, pairId: string, pairStats: PairStats) {
	io.to(`trade${pairId}`).emit('update-pair-stats', { pairStats });
}

export {
	socketStart,
	sendNewOrderMessage,
	sendDeleteOrderMessage,
	runNotificationMethods,
	sendUpdateOrderMessage,
	sendOrderNotificationMessage,
	sendUpdatePairStatsMessage,
	sendOrderNotificationCancelation,
};
