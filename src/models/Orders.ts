import { Op } from 'sequelize';
import Decimal from 'decimal.js';
import Currency from '@/schemes/Currency.js';
import configModel from './Config.js';
import dexModel from './Dex.js';
import userModel from './User.js';
import exchangeModel from './ExchangeTransactions.js';
import {
	sendDeleteOrderMessage,
	sendNewOrderMessage,
	sendOrderNotificationCancelation,
	sendOrderNotificationMessage,
	sendUpdateOrderMessage,
} from '../socket/main.js';
import io from '../server.js';
import ApplyTip from '../interfaces/responses/orders/ApplyTip.js';
import CreateOrderBody from '../interfaces/bodies/orders/CreateOrderBody.js';
import GetUserOrdersPageBody from '../interfaces/bodies/orders/GetUserOrdersPageBody.js';
import GetUserOrdersBody from '../interfaces/bodies/orders/GetUserOrdersBody.js';
import CancelOrderBody from '../interfaces/bodies/orders/CancelOrderBody.js';
import ApplyOrderBody from '../interfaces/bodies/orders/ApplyOrderBody.js';
import Order from '../schemes/Order';
import User from '../schemes/User';
import Transaction from '../schemes/Transaction';
import Pair from '../schemes/Pair';
import OrderData from '../interfaces/special/socket-data/OrderData.js';
import sequelize from '../sequelize.js';

class OrdersModel {
	async getOrderRow(id: number) {
		try {
			return await Order.findByPk(id);
		} catch (error) {
			console.log(error);
		}
	}

	async getMatchedOrders(order: Order, pairId: number, requestUserId: number) {
		const matchedOrders = await Order.findAll({
			where: {
				pair_id: pairId,
				type: order.type === 'buy' ? 'sell' : 'buy',
				status: 'active',
				price: {
					[order.type === 'buy' ? Op.lte : Op.gte]: order.price,
				},
				user_id: {
					[Op.ne]: requestUserId,
				},
			},
			order: [['timestamp', 'ASC']],
			include: [
				{
					model: Pair,
					as: 'pair',
					include: ['first_currency', 'second_currency'],
				},
				'user',
			],
		});

		return matchedOrders;
	}

	async createOrder(body: CreateOrderBody) {
		try {
			const { orderData } = body;
			const { userData } = body;

			const pair = await dexModel.getPairRow(parseInt(orderData.pairId, 10));
			const firstCurrency = await Currency.findByPk(pair?.first_currency_id);

			if (!pair || !firstCurrency) return { success: false, data: 'Invalid order data' };

			const userRow = await userModel.getUserRow(userData.address);

			if (!userRow) throw new Error('Invalid address from token.');

			const timestamp = Date.now();
			const firstCurrencyDecimalPoint = firstCurrency?.asset_info?.decimal_point || 12;

			const newOrder = await Order.create({
				type: orderData.type === 'buy' ? 'buy' : 'sell',
				timestamp,
				side: orderData.side === 'limit' ? 'limit' : 'market',
				price: new Decimal(orderData.price).toFixed(),
				amount: orderData.amount,
				total: new Decimal(orderData.price)
					.mul(new Decimal(orderData.amount))
					.toDecimalPlaces(firstCurrencyDecimalPoint, Decimal.ROUND_DOWN)
					.toString(),
				pair_id: orderData.pairId,
				user_id: userRow.id,
				status: 'active',
				left: new Decimal(orderData.amount).toFixed(),
			});

			if (!newOrder) throw new Error('DB error while creating new order.');

			const newOrderUser = await userModel.getUserRow(userData.address);
			const newOrderPair = await Pair.findByPk(orderData.pairId, {
				include: ['first_currency', 'second_currency'],
			});

			if (!newOrderPair) throw new Error('Invalid pair id in order row.');
			if (!newOrderUser) throw new Error('Invalid address from token.');

			const matchedOrders = await this.getMatchedOrders(
				newOrder,
				parseInt(orderData.pairId, 10),
				userRow.id,
			);

			sendNewOrderMessage(io, orderData.pairId, {
				...(newOrder.toJSON() || {}),
				user_id: undefined,
				user: {
					...(newOrderUser.toJSON() || {}),
					id: undefined,
					favourite_currencies: undefined,
				},
				pair: newOrderPair.toJSON(),
			});

			for (const matchedOrder of matchedOrders) {
				const matchedOrderJSON = matchedOrder.toJSON() as OrderData;

				sendOrderNotificationMessage(io, matchedOrderJSON.user.address, {
					...(newOrder.toJSON() || {}),
					user_id: undefined,
					user: {
						...(newOrderUser.toJSON() || {}),
						id: undefined,
						favourite_currencies: undefined,
					},
					pair: newOrderPair.toJSON(),
				});
			}

			await Order.update(
				{
					hasNotification: true,
				},
				{
					where: {
						id: {
							[Op.in]: matchedOrders.map((e) => e.id),
						},
					},
				},
			);

			if (matchedOrders.length > 0) {
				return {
					success: true,
					data: {
						...newOrder.toJSON(),
						immediateMatch: true,
					},
				};
			}

			return { success: true, data: newOrder.toJSON() };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async getOrdersPage(pairId: number) {
		try {
			const pair = await dexModel.getPairRow(pairId);
			if (!pair) return { success: false, data: 'Invalid pair data' };

			const orders = await Order.findAll({
				where: {
					pair_id: pairId,
					status: 'active',
				},
				order: [[sequelize.literal('CAST(price AS DOUBLE PRECISION)'), 'DESC']],
			});

			const ordersWithUsers = [];

			for (const order of orders) {
				const userRow = await User.findByPk(order.user_id);

				ordersWithUsers.push({
					...(order.toJSON() || {}),
					user_id: undefined,
					user: {
						...(userRow?.toJSON() || {}),
						id: undefined,
						favourite_currencies: undefined,
					},
					isInstant: dexModel.isBotActive(order.id),
				});
			}

			return { success: true, data: ordersWithUsers };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}
	async getUserOrdersPage(body: GetUserOrdersPageBody) {
		try {
			const userRow = await userModel.getUserRow(body.userData.address);

			if (!userRow) throw new Error('Invalid address from token.');

			const pair = await dexModel.getPairRow(parseInt(body.pairId, 10));

			if (!pair) return { success: false, data: 'Invalid pair data' };

			const orders = (
				await Order.findAll({
					where: {
						user_id: userRow.id,
						pair_id: body.pairId,
						status: {
							[Op.ne]: 'finished',
						},
					},
					order: [['timestamp', 'DESC']],
				})
			)
				.map((e) => e.toJSON())
				.map((e) => ({
					...e,
					isInstant: dexModel.isBotActive(e.id),
				}));

			const applyTips: ApplyTip[] = [];

			for (const order of orders.reverse()) {
				if (order.status !== 'zero') {
					const matchedOrders = await this.getMatchedOrders(
						order,
						parseInt(body.pairId, 10),
						userRow.id,
					);

					for (const matchedOrder of matchedOrders) {
						if (!applyTips.some((e) => e.id === matchedOrder.id)) {
							const opponentRow = await User.findByPk(matchedOrder.user_id);

							if (!opponentRow) throw new Error('Invalid user id in order row.');

							applyTips.push({
								id: matchedOrder.id,
								left: Decimal.min(
									new Decimal(matchedOrder.left),
									new Decimal(order.left),
								).toFixed(),
								price: matchedOrder.price,
								user: {
									...(opponentRow.toJSON() || {}),
									id: undefined,
									favourite_currencies: undefined,
								},
								timestamp: matchedOrder.timestamp,
								type: matchedOrder.type,
								total: matchedOrder.total,
								connected_order_id: order.id,
								transaction: false,
								isInstant: dexModel.isBotActive(matchedOrder.id),
							});
						}
					}
				}
			}

			for (const order of orders) {
				const selectedTransactions = await Transaction.findAll({
					where: {
						[order.type === 'buy' ? 'buy_order_id' : 'sell_order_id']: order.id,
						status: 'pending',
						creator: {
							[Op.ne]: order.type === 'buy' ? 'buy' : 'sell',
						},
					},
				});

				for (const transaction of selectedTransactions) {
					const matchedOrder = await this.getOrderRow(
						order.type === 'buy' ? transaction.sell_order_id : transaction.buy_order_id,
					);

					const opponentRow = matchedOrder && (await User.findByPk(matchedOrder.user_id));

					if (matchedOrder && opponentRow?.address) {
						applyTips.push({
							id: transaction.id,
							left: transaction.amount,
							price: matchedOrder.price,
							user: {
								...(opponentRow.toJSON() || {}),
								id: undefined,
								favourite_currencies: undefined,
							},
							type: matchedOrder.type,
							total: matchedOrder.total,
							connected_order_id: order.id,
							transaction: true,
							hex_raw_proposal: transaction.hex_raw_proposal,
							isInstant: dexModel.isBotActive(matchedOrder.id),
						});
					}
				}
			}

			return { success: true, data: { orders, applyTips } };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async getUserOrders(body: GetUserOrdersBody) {
		try {
			const userRow = await userModel.getUserRow(body.userData.address);

			if (!userRow) throw new Error('Invalid address from token.');

			const orders = await Order.findAll({
				where: {
					user_id: userRow.id,
				},
				order: [['timestamp', 'DESC']],
			});

			const ordersWithCurrencies: Order[] = orders;

			const result = [];

			for (let i = 0; i < orders.length; i++) {
				const pairData = await dexModel.getPairRow(orders[i].pair_id);

				if (!pairData) throw new Error('Invalid pair id in order row.');

				result.push({
					...(ordersWithCurrencies[i]?.toJSON() || {}),
					first_currency: await configModel.getCurrencyRow(pairData.first_currency_id),
					second_currency: await configModel.getCurrencyRow(pairData.second_currency_id),
					isInstant: dexModel.isBotActive(ordersWithCurrencies[i].id),
				});
			}

			return { success: true, data: result };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async cancelOrder(body: CancelOrderBody) {
		try {
			const userRow = await userModel.getUserRow(body.userData.address);

			if (!userRow) throw new Error('Invalid address from token.');

			const orderRow = await Order.findOne({
				where: {
					id: body.orderId,
					status: {
						[Op.ne]: 'finished',
					},
					user_id: userRow.id,
				},
			});

			if (!orderRow) {
				return { success: false, data: 'Invalid order data' };
			}

			await this.cancelOrderNotifications(orderRow, userRow);

			const eps = new Decimal(1e-8);
			const leftDecimal = new Decimal(orderRow.left);
			const amountDecimal = new Decimal(orderRow.amount);

			// if order was partially filled
			if (leftDecimal.minus(amountDecimal).abs().greaterThan(eps)) {
				const connectedTransactions = await Transaction.findAll({
					where: {
						[Op.or]: [{ buy_order_id: orderRow.id }, { sell_order_id: orderRow.id }],
						status: 'pending',
					},
				});

				for (const transaction of connectedTransactions) {
					await exchangeModel.returnTransactionAmount(transaction.id);
				}

				await Order.update(
					{ status: 'finished' },
					{ where: { id: body.orderId, user_id: userRow.id } },
				);
			} else {
				await Order.destroy({
					where: {
						id: body.orderId,
						user_id: userRow.id,
					},
				});
			}

			await Transaction.update(
				{ status: 'rejected' },
				{
					where: {
						[Op.or]: [{ buy_order_id: orderRow.id }, { sell_order_id: orderRow.id }],
						[Op.not]: {
							status: 'confirmed',
						},
					},
				},
			);

			sendDeleteOrderMessage(io, orderRow.pair_id.toString(), orderRow.id.toString());

			return { success: true };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async cancelOrderNotifications(orderRow: Order, userRow: User) {
		const matchedOrders = await this.getMatchedOrders(orderRow, orderRow.pair_id, -1);

		const affectedUserIDs = matchedOrders.map((e) => e.user_id);

		const affectedUsers = (
			await User.findAll({
				where: {
					id: affectedUserIDs,
				},
			})
		).map((e) => e.toJSON());

		for (const affectedUser of [...affectedUsers, userRow.toJSON()]) {
			for (const element of matchedOrders.map((e) => e.toJSON())) {
				sendOrderNotificationCancelation(io, affectedUser.address, element.id);
			}

			sendOrderNotificationCancelation(io, affectedUser.address, orderRow.id);
		}
	}

	async getChartOrders(pairId: string) {
		try {
			const date = new Date();

			const lastTimestamp = date.getTime();

			date.setHours(date.getHours() - 24);

			const firstTimestamp = date.getTime();

			const orders = await Order.findAll({
				where: {
					pair_id: pairId,
					timestamp: {
						[Op.gte]: firstTimestamp,
						[Op.lte]: lastTimestamp,
					},
				},
				order: [['timestamp', 'DESC']],
			});

			return { success: true, data: orders };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async getPairStats(pairId: string) {
		try {
			const pair = await Pair.findOne({
				where: {
					id: pairId,
				},
			});

			return {
				success: true,
				data: {
					rate: pair?.rate || 0,
					coefficient: pair?.coefficient || 0,
					high: pair?.high || 0,
					low: pair?.low || 0,
					volume: pair?.volume || 0,
				},
			};
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async applyOrder(body: ApplyOrderBody) {
		try {
			const { userData } = body;
			const { orderData } = body;

			const userRow = await userModel.getUserRow(userData.address);

			if (!userRow) throw new Error('Invalid address from token.');

			const orderRow = await Order.findByPk(orderData.connected_order_id);

			const applyingOrderRow = await Order.findOne({
				where: {
					id: orderData.id,
					status: 'active',
					user_id: {
						[Op.ne]: userRow.id,
					},
				},
			});

			if (
				!(
					orderRow &&
					applyingOrderRow &&
					orderRow.pair_id === applyingOrderRow.pair_id &&
					orderRow.type !== applyingOrderRow.type &&
					((orderRow.type === 'buy') === orderRow.price >= applyingOrderRow.price ||
						orderRow.price === applyingOrderRow.price)
				)
			) {
				return { success: false, data: 'Invalid order data' };
			}

			const transactionAmount = Decimal.min(orderRow.left, applyingOrderRow.left);
			const isApplyingBuy = applyingOrderRow.type === 'buy';

			await Order.update(
				{ left: new Decimal(orderRow.left).minus(transactionAmount).toNumber() },
				{ where: { id: orderRow.id } },
			);

			await Order.update(
				{
					left: new Decimal(applyingOrderRow.left).minus(transactionAmount).toNumber(),
				},
				{
					where: {
						id: applyingOrderRow.id,
					},
				},
			);

			const eps = new Decimal(1e-10);

			if (new Decimal(orderRow.left).minus(transactionAmount).abs().lt(eps)) {
				await Order.update({ status: 'zero' }, { where: { id: orderRow.id } });
			}

			if (new Decimal(applyingOrderRow.left).minus(transactionAmount).abs().lt(eps)) {
				await Order.update({ status: 'zero' }, { where: { id: applyingOrderRow.id } });
			}

			await exchangeModel.createTransaction(
				isApplyingBuy ? applyingOrderRow.id : orderRow.id,
				isApplyingBuy ? orderRow.id : applyingOrderRow.id,
				transactionAmount.toFixed(),
				orderRow.type,
				orderData.hex_raw_proposal,
			);

			sendUpdateOrderMessage(io, orderRow.pair_id.toString());

			return { success: true };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}
}

const ordersModel = new OrdersModel();

export default ordersModel;
