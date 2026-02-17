import { Op, WhereOptions } from 'sequelize';
import Decimal from 'decimal.js';
import TransactionWithOrders from '@/interfaces/common/Transaction.js';
import Currency from '@/schemes/Currency.js';
import {
	OrderWithPairAndCurrencies,
	PairWithCurrencies,
	PairWithIdAndCurrencies,
} from '@/interfaces/database/modifiedRequests.js';
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
import CancelOrderBody from '../interfaces/bodies/orders/CancelOrderBody.js';
import ApplyOrderBody from '../interfaces/bodies/orders/ApplyOrderBody.js';
import Order, { OrderStatus, OrderType } from '../schemes/Order';
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

	async createOrder(body: CreateOrderBody): Promise<
	| {
		success: false;
		data: string;
		  }
	| {
		success: true;
		data: {
			id: number;
			type: string;
			timestamp: number;
			side: string;
			price: string;
			amount: string;
			total: string;
			pairId: number;
			userId: number;
			status: string;
			left: string;
			hasNotification: boolean;
			immediateMatch?: true;
		};
		  }
	> {
		try {
			const { orderData } = body;
			const { userData } = body;

			const pair = await dexModel.getPairRow(parseInt(orderData.pairId, 10));
			const firstCurrency = await Currency.findByPk(pair?.first_currency_id);

			if (!pair || !firstCurrency) return { success: false, data: 'Invalid order data' };

			const userRow = await userModel.getUserRow(userData.address);

			if (!userRow) throw new Error('Invalid address from token.');

			const timestamp = Date.now();
			const firstCurrencyDecimalPoint =
				firstCurrency?.asset_info?.decimal_point === undefined
					? 12
					: firstCurrency.asset_info.decimal_point;

			console.log(
				'total:',
				new Decimal(orderData.price)
					.mul(new Decimal(orderData.amount))
					.toDecimalPlaces(firstCurrencyDecimalPoint, Decimal.ROUND_DOWN)
					.toString(),
			);

			console.log(firstCurrencyDecimalPoint);

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
						id: newOrder.id,
						type: newOrder.type,
						timestamp: newOrder.timestamp,
						side: newOrder.side,
						price: newOrder.price,
						amount: newOrder.amount,
						total: newOrder.total,
						pairId: newOrder.pair_id,
						userId: newOrder.user_id,
						status: newOrder.status,
						left: newOrder.left,
						hasNotification: newOrder.hasNotification,

						immediateMatch: true,
					},
				};
			}

			return {
				success: true,
				data: {
					id: newOrder.id,
					type: newOrder.type,
					timestamp: newOrder.timestamp,
					side: newOrder.side,
					price: newOrder.price,
					amount: newOrder.amount,
					total: newOrder.total,
					pairId: newOrder.pair_id,
					userId: newOrder.user_id,
					status: newOrder.status,
					left: newOrder.left,
					hasNotification: newOrder.hasNotification,
				},
			};
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

	async getUserOrders({
		address,
		offset,
		limit,
		filterInfo: { pairId, status, type, date },
	}: {
		address: string;
		offset: number;
		limit: number;
		filterInfo: {
			pairId?: number;
			status?: 'active' | 'finished';
			type?: 'buy' | 'sell';
			date?: {
				from: number;
				to: number;
			};
		};
	}): Promise<
		| {
			success: false;
			data: 'Internal error';
		  }
		| {
			success: true;
			totalItemsCount: number;
			data: {
				id: number;
				type: string;
				timestamp: number;
				side: string;
				price: string;
				amount: string;
				total: string;
				pair_id: number;
				user_id: number;
				status: string;
				left: string;
				hasNotification: boolean;

				pair: PairWithCurrencies;

				first_currency: Currency;
				second_currency: Currency;
				isInstant: boolean;
			}[];
		  }
		> {
		try {
			const userRow = await userModel.getUserRow(address);

			if (!userRow) throw new Error('Invalid address from token.');

			const ordersSelectWhereClause: WhereOptions = {
				user_id: userRow.id,
				...(pairId !== undefined ? { pair_id: pairId } : {}),
				...(status !== undefined
					? {
						status:
								status === 'finished' ? OrderStatus.FINISHED : OrderStatus.ACTIVE,
					}
					: {}),
				...(type !== undefined
					? { type: type === 'buy' ? OrderType.BUY : OrderType.SELL }
					: {}),
				...(date !== undefined
					? { timestamp: { [Op.between]: [date.from, date.to] } }
					: {}),
			};

			const totalItemsCount = await Order.count({
				where: ordersSelectWhereClause,
			});

			const ordersRows = (await Order.findAll({
				where: ordersSelectWhereClause,
				order: [['timestamp', 'DESC']],
				limit,
				offset,
				include: [
					{
						model: Pair,
						as: 'pair',
						include: ['first_currency', 'second_currency'],
					},
				],
			})) as OrderWithPairAndCurrencies[];

			const result = ordersRows.map((e) => ({
				id: e.id,
				type: e.type,
				timestamp: e.timestamp,
				side: e.side,
				price: e.price,
				amount: e.amount,
				total: e.total,
				pair_id: e.pair_id,
				user_id: e.user_id,
				status: e.status,
				left: e.left,
				hasNotification: e.hasNotification,

				pair: e.pair,

				first_currency: e.pair.first_currency,
				second_currency: e.pair.second_currency,
				isInstant: dexModel.isBotActive(e.id),
			}));

			return {
				success: true,
				totalItemsCount,
				data: result,
			};
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async cancelOrder(body: CancelOrderBody) {
		try {
			await sequelize.transaction(async (t) => {
				const userRow = await userModel.getUserRow(body.userData.address);

				if (!userRow) throw new Error('Invalid address from token.');

				const orderRow = await Order.findOne({
					transaction: t,
					lock: t.LOCK.UPDATE,
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
							[Op.or]: [
								{ buy_order_id: orderRow.id },
								{ sell_order_id: orderRow.id },
							],
							status: 'pending',
						},
						transaction: t,
						lock: t.LOCK.UPDATE,
					});

					for (const transaction of connectedTransactions) {
						await exchangeModel.returnTransactionAmount(transaction.id, t);
					}

					await Order.update(
						{ status: 'finished' },
						{
							where: { id: body.orderId, user_id: userRow.id },
							transaction: t,
						},
					);
				} else {
					await Order.destroy({
						where: {
							id: body.orderId,
							user_id: userRow.id,
						},
						transaction: t,
					});
				}

				t.afterCommit(() => {
					sendDeleteOrderMessage(io, orderRow.pair_id.toString(), orderRow.id.toString());
				});
			});

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

			console.log(
				`Transaction Amount: ${transactionAmount.toString()} 
				for orderRow: ${orderRow.id} 
				and applyingOrderRow: ${applyingOrderRow.id}`,
			);

			console.log(
				`Order Row Left: ${orderRow.left.toString()} 
				Applying Order Row Left: ${applyingOrderRow.left.toString()}`,
			);

			console.log(
				`Order Row Left After: ${new Decimal(orderRow.left).minus(transactionAmount).toNumber()} 
				Applying Order Row Left After: ${new Decimal(applyingOrderRow.left).minus(transactionAmount).toNumber()}`,
			);

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

	async getTrades(pairId: number) {
		try {
			const pair = await dexModel.getPairRow(pairId);

			if (!pair) {
				return { success: false, data: 'Invalid pair data' };
			}

			const transactions = (await Transaction.findAll({
				where: { status: 'confirmed' },
				include: [
					{
						model: Order,
						as: 'buy_order',
						where: { pair_id: pairId },
						include: [
							{
								model: User,
								as: 'user',
								attributes: ['address'],
							},
						],
					},
					{
						model: Order,
						as: 'sell_order',
						where: { pair_id: pairId },
						include: [
							{
								model: User,
								as: 'user',
								attributes: ['address'],
							},
						],
					},
				],
				order: [['timestamp', 'DESC']],
			})) as TransactionWithOrders[];

			const trades = transactions.map((tx) => ({
				id: tx.id,
				timestamp: tx.timestamp,
				amount: tx.amount,
				price: tx.buy_order.price,
				type: tx.creator,
				buyer: {
					address: tx.buy_order.user.address,
					id: tx.buy_order.user_id,
				},
				seller: {
					address: tx.sell_order.user.address,
					id: tx.sell_order.user_id,
				},
			}));

			return { success: true, data: trades };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	static GET_USER_ORDERS_ALL_PAIRS_USER_NOT_FOUND = 'No user found';
	getUserOrdersAllPairs = async (
		address: string,
	): Promise<{
		success: true;
		data: {
			id: number;
			firstCurrency: {
				id: number;
				ticker: string;
			};
			secondCurrency: {
				id: number;
				ticker: string;
			};
		}[];
	}> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			throw new Error(OrdersModel.GET_USER_ORDERS_ALL_PAIRS_USER_NOT_FOUND);
		}

		// Select distinct pair IDs for the user's orders, then fetch pairs
		const distinctPairIdRows = (await Order.findAll({
			attributes: [[sequelize.fn('DISTINCT', sequelize.col('pair_id')), 'pair_id']],
			where: { user_id: userRow.id },
			raw: true,
		})) as { pair_id: number }[];

		const pairIds = distinctPairIdRows.map((row) => row.pair_id);

		const pairsSelection = (await Pair.findAll({
			where: { id: pairIds },
			include: [
				{ model: Currency, as: 'first_currency' },
				{ model: Currency, as: 'second_currency' },
			],
			attributes: ['id'],
		})) as PairWithIdAndCurrencies[];

		const pairs = pairsSelection.map((e) => {
			const firstCurrencyTicker = e.first_currency.name;
			const secondCurrencyTicker = e.second_currency.name;

			return {
				id: e.id,
				firstCurrency: {
					id: e.first_currency.id,
					ticker: firstCurrencyTicker,
				},
				secondCurrency: {
					id: e.second_currency.id,
					ticker: secondCurrencyTicker,
				},
			};
		});

		return {
			success: true,
			data: pairs,
		};
	};
}

const ordersModel = new OrdersModel();

export default ordersModel;
