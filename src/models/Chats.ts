import { Op } from 'sequelize';
import userModel from './User.js';
import offersModel from './Offers.js';
import configModel from './Config.js';
import { runNotificationMethods } from '../socket/main.js';
import io from '../server.js';
import GetChatResponse from '../interfaces/responses/chats/chats.js';
import ErrorResponse from '../interfaces/responses/ErrorResponse.js';
import CreateBody from '../interfaces/bodies/chats/CreateBody.js';
import GetChatBody from '../interfaces/bodies/chats/GetChatBody.js';
import GetAllChatsBody from '../interfaces/bodies/chats/GetAllChatsBody.js';
import DeleteChatBody from '../interfaces/bodies/chats/DeleteChatBody.js';
import CreateMessageBody from '../interfaces/bodies/chats/CreateMessageBody.js';
import DepositSocketData from '../interfaces/special/socket-data/DepositSocketData.js';
import ChatSocketData from '../interfaces/special/socket-data/ChatSocketData.js';

import Chat from '../schemes/Chat.js';
import User from '../schemes/User.js';
import Message from '../schemes/Message.js';
import Offer from '../schemes/Offer.js';

class Chats {
	private async checkChatAccess(body: GetChatBody) {
		const userRow = await userModel.getUserRow(body.userData.address);

		if (!userRow) return { success: false, data: 'User not registered' };

		const existingChat = await Chat.findOne({ where: { id: body.id } });

		if (!existingChat) return { success: false, data: 'Invalid chat data' };

		const offerRow = await offersModel.getOfferRow(existingChat.offer_number);

		if (!offerRow) return { success: false, data: 'Invalid chat data' };

		if (existingChat.buyer_id !== userRow.id && offerRow.user_id !== userRow.id)
			return { success: false, data: 'Unauthorized' };

		const inputCurrency = await configModel.getCurrencyRow(offerRow.input_currency_id);
		const targetCurrency = await configModel.getCurrencyRow(offerRow.target_currency_id);
		const depositCurrency = await configModel.getCurrencyRow(offerRow.deposit_currency_id);

		return {
			success: true,
			offerRow: {
				...offerRow?.toJSON(),
				input_currency: inputCurrency,
				target_currency: targetCurrency,
				deposit_currency: depositCurrency,
			},
			existingChat: existingChat?.toJSON() || {},
			userRow: userRow?.toJSON() || {},
		};
	}

	async create(body: CreateBody) {
		try {
			const userRow = await userModel.getUserRow(body.userData.address);
			if (!userRow) return { success: false, data: 'User not registered' };

			const offerRow = await offersModel.getOfferRow(body.number);

			if (!offerRow) return { success: false, data: 'Invalid offer data' };

			if (offerRow.user_id === userRow.id) return { success: false, data: 'Same user' };

			const receiveAmount =
				offerRow.type === 'buy'
					? parseFloat(body.chatData.pay) / offerRow.price
					: parseFloat(body.chatData.pay);

			if (offerRow.min > receiveAmount || offerRow.max < receiveAmount) {
				return { success: false, data: 'Invalid offer data' };
			}

			const existingChat = await Chat.findOne({
				where: {
					offer_number: body.number,
					buyer_id: userRow.id,
					status: {
						[Op.not]: 'finished',
					},
				},
			});

			if (existingChat) return { success: true, data: existingChat.id };

			const chatRow = await Chat.create({
				offer_number: body.number,
				buyer_id: userRow.id,
				status: 'chatting',
				pay: parseFloat(body.chatData.pay),
				receive:
					offerRow.type === 'buy'
						? parseFloat(body.chatData.pay) / offerRow.price
						: parseFloat(body.chatData.pay) * offerRow.price,
			});

			if (!chatRow) throw new Error('Chat not created (database)');

			runNotificationMethods(io, { userData: body.userData, chat_id: chatRow.id.toString() });

			return { success: true, data: chatRow.id };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async getChat(body: GetChatBody): Promise<ErrorResponse | GetChatResponse> {
		try {
			const result = await this.checkChatAccess(body);

			const { offerRow, existingChat } = result;

			if (!(result.success && offerRow && existingChat))
				return { success: false, data: 'Invalid chat data' };

			const creatorData = await User.findOne({ where: { id: offerRow.user_id } });
			const buyerData = await User.findOne({ where: { id: existingChat.buyer_id } });

			if (!(creatorData && buyerData)) {
				throw new Error('Error of getting users');
			}

			const messagesAmount = await Message.count({ where: { chat_id: existingChat.id } });

			return {
				success: true,
				data: {
					creator_data: {
						...(creatorData?.toJSON() || {}),
						favourite_currencies: undefined,
					},
					buyer_data: { ...(buyerData?.toJSON() || {}), favourite_currencies: undefined },
					...(offerRow?.toJSON() || {}),
					...(existingChat?.toJSON() || {}),
					favourite_currencies: undefined,
					chunk_count: Math.ceil(messagesAmount / 20),
				},
			};
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async getChatChunk(body: GetChatBody & { chunkNumber: number }) {
		try {
			const result = await this.checkChatAccess(body);

			const { offerRow, existingChat } = result;

			if (!(result.success && offerRow && existingChat))
				return { success: false, data: 'Invalid chat data' };

			const messages = await Message.findAll({
				where: {
					chat_id: existingChat.id,
				},
				order: [['timestamp', 'DESC']],
				limit: 20,
				offset: (body.chunkNumber - 1) * 20,
			});

			return {
				success: true,
				data: messages.map((e) => ({
					...e,
					fromOwner: !!e.from_owner,
					timestamp: e.timestamp,
				})),
			};
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async getAllChats(body: GetAllChatsBody) {
		try {
			const userRow = await userModel.getUserRow(body.userData.address);

			if (!userRow) return { success: false, data: 'User not registered' };

			const allChats = await Chat.findAll();

			const chats = [];

			for (const chat of allChats) {
				const offerRow = await offersModel.getOfferRow(chat.offer_number);
				if (offerRow && (offerRow.user_id === userRow.id || chat.buyer_id === userRow.id)) {
					const inputCurrency = await configModel.getCurrencyRow(
						offerRow.input_currency_id,
					);
					const targetCurrency = await configModel.getCurrencyRow(
						offerRow.target_currency_id,
					);
					const depositCurrency = await configModel.getCurrencyRow(
						offerRow.deposit_currency_id,
					);

					const creatorData = await User.findOne({ where: { id: offerRow.user_id } });
					const buyerData = await User.findOne({ where: { id: chat.buyer_id } });

					chats.push({
						creator_data: {
							...(creatorData?.toJSON() || {}),
							favourite_currencies: undefined,
							id: undefined,
						},
						buyer_data: {
							...(buyerData?.toJSON() || {}),
							favourite_currencies: undefined,
							id: undefined,
						},
						...(offerRow?.toJSON() || {}),
						...(chat?.toJSON() || {}),
						chat_history: undefined,
						favourite_currencies: undefined,
						input_currency: inputCurrency?.toJSON(),
						target_currency: targetCurrency?.toJSON(),
						deposit_currency: depositCurrency?.toJSON(),
						user_id: undefined,
						buyer_id: undefined,
					});
				}
			}

			return { success: true, data: chats };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async createMessage(body: CreateMessageBody) {
		try {
			const result = await this.checkChatAccess({
				...body,
				chat_id: undefined,
				id: body.chat_id,
			});

			const { offerRow, existingChat, userRow } = result;

			if (!(result.success && offerRow && existingChat && userRow))
				return { success: false, data: 'Invalid chat data' };

			if (existingChat.status === 'finished')
				return { success: false, data: 'Chat is finished' };

			let newMessage;

			if (body.message.type !== 'img') {
				newMessage = {
					text: body.message.text || '',
					timestamp: Date.now(),
					from_owner: offerRow.user_id === userRow.id,
					success: body.message.success,
					fail: body.message.fail,
				};
			} else {
				newMessage = {
					type: 'img',
					url: body.message.url,
					timestamp: Date.now(),
					fromOwner: offerRow.user_id === userRow.id,
					success: body.message.success,
					fail: body.message.fail,
				};
			}

			await Message.create({
				type: newMessage.type === 'img' ? 'img' : 'text',
				url: newMessage.url || null,
				text: newMessage.text || null,
				timestamp: Date.now(),
				from_owner: !!newMessage.fromOwner,
				success: !!newMessage.success,
				fail: !!newMessage.fail,
				system: false,
				chat_id: existingChat.id,
			});

			return { success: true, message: newMessage };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async deleteChat(body: DeleteChatBody) {
		try {
			const result = await this.checkChatAccess(body);

			const { existingChat } = result;

			if (!(result.success && existingChat)) return result;

			if (
				(existingChat.owner_deposit !== 'default' && existingChat.owner_deposit !== null) ||
				(existingChat.opponent_deposit !== 'default' &&
					existingChat.opponent_deposit !== null)
			) {
				return { success: false, data: 'Chat cannot be deleted' };
			}

			await Chat.destroy({ where: { id: body.id } });

			return { success: true, data: undefined };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async changeDeposit(body: DepositSocketData) {
		const result = await this.checkChatAccess({
			...body,
			chat_id: undefined,
			id: body.chat_id,
		});

		const { existingChat, offerRow, userRow } = result;

		if (!(result.success && existingChat && offerRow && userRow)) return result;

		const isOwner = existingChat.buyer_id !== userRow.id;
		const isBuyer = isOwner === (offerRow.type === 'sell');

		if (existingChat.status === 'finished') return { success: false, data: 'Chat is finished' };

		let text: string | null = null;

		const secondState = isOwner ? existingChat.opponent_deposit : existingChat.owner_deposit;

		const previousState = isOwner ? existingChat.owner_deposit : existingChat.opponent_deposit;

		if (
			(previousState === 'default' || previousState === null) &&
			body.deposit_state === 'deposit'
		) {
			text = `${isBuyer ? 'Buyer' : 'Seller'} made a deposit (${isBuyer ? offerRow.deposit_buyer : offerRow.deposit_seller} ${offerRow.deposit_currency?.name || ''})`;
		} else if (
			(previousState === 'deposit' || previousState === 'canceled') &&
			body.deposit_state === 'confirmed'
		) {
			text = `${isBuyer ? 'Buyer' : 'Seller'} confirmed the funds were received`;
		} else if (
			(previousState === 'deposit' || previousState === 'confirmed') &&
			body.deposit_state === 'canceled'
		) {
			text = `${isBuyer ? 'Buyer' : 'Seller'} canceled funds and return deposit`;
		}

		if (!text) return { success: false, data: 'Invalid deposit state' };

		if (isOwner) {
			await Chat.update(
				{ owner_deposit: body.deposit_state },
				{ where: { id: body.chat_id } },
			);
		} else {
			await Chat.update(
				{ opponent_deposit: body.deposit_state },
				{ where: { id: body.chat_id } },
			);
		}

		const messageData = await this.createMessage({
			...body,
			message: {
				text,
				timestamp: Date.now(),
				success: body.deposit_state !== 'canceled',
				fail: body.deposit_state === 'canceled',
			},
		});

		if (!messageData.success) throw new Error('Message was not created successfuly.');

		if (
			(body.deposit_state === 'canceled' &&
				(secondState === 'canceled' ||
					secondState === 'default' ||
					secondState === null)) ||
			(body.deposit_state === 'confirmed' && secondState === 'confirmed')
		) {
			await Chat.update({ status: 'finished' }, { where: { id: body.chat_id } });
		}

		if (body.deposit_state === 'confirmed' && secondState === 'confirmed') {
			await Offer.update(
				{ offer_status: 'finished' },
				{ where: { number: existingChat.offer_number } },
			);
		} else {
			const offerRow = await offersModel.getOfferRow(existingChat.offer_number);
			if (offerRow?.offer_status === 'default') {
				await Offer.update(
					{ offer_status: 'process' },
					{ where: { number: existingChat.offer_number } },
				);
			}
		}

		return {
			success: true,
			message: messageData.message,
			deposits_state: {
				fromOwner: isOwner,
				state: body.deposit_state,
			},
		};
	}

	async setWatched(body: ChatSocketData) {
		try {
			const result = await this.checkChatAccess({
				...body,
				chat_id: undefined,
				id: body.chat_id,
			});

			const { existingChat, userRow } = result;

			if (!(result.success && existingChat && userRow)) return result;

			if (existingChat.view_list?.includes?.(userRow.id)) return { success: true };

			await Chat.update(
				{
					view_list: [...(existingChat.view_list || []), userRow.id],
				},

				{ where: { id: body.chat_id } },
			);

			return { success: true };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}
}

const chatsModel = new Chats();

export default chatsModel;
