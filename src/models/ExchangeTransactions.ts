import Decimal from 'decimal.js';
import { Op, WhereOptions } from 'sequelize';
import type { Transaction as SequelizeTransaction } from 'sequelize';

import CancelTransactionBody from '@/interfaces/bodies/exchange-transactions/CancelTransactionBody.js';
import sequelize from '@/sequelize.js';
import zanoExplorerHelper from '@/helpers/ZanoExplorer.helper.js';
import Order, { OrderStatus } from '@/schemes/Order';
import TransactionWithOrders from '@/interfaces/common/Transaction.js';
import { sendDeleteOrderMessage, sendUpdatePairStatsMessage } from '../socket/main.js';
import userModel from './User.js';
import io from '../server.js';
import ConfirmTransactionBody from '../interfaces/bodies/exchange-transactions/ConfirmTransactionBody.js';
import Transaction from '../schemes/Transaction';
import Pair from '../schemes/Pair.js';

interface OrderWithTransactions extends Order {
	buy_orders: Transaction[];
	sell_orders: Transaction[];
}

class ExchangeModel {
	private zano_price_data: {
		now: string | null;
		back24hr: string | null;
	} = {
			now: null,
			back24hr: null,
		};

	constructor() {
		this.runZanoPriceDaemon();
	}

	getZanoPriceData() {
		return this.zano_price_data;
	}

	async getZanoPriceForTimestamp(timestamp: number) {
		try {
			const priceResult = await zanoExplorerHelper.getHistoricalZanoPrice({ timestamp });

			if (!priceResult.success) {
				console.log(priceResult.data);

				throw new Error('Failed to fetch Zano price data for timestamp');
			}

			return { success: true, data: priceResult.price };
		} catch (error) {
			console.log(error);
			return { success: false, data: 'Internal error' };
		}
	}

	async updateZanoPrice() {
		try {
			const priceResultNow = await zanoExplorerHelper.getHistoricalZanoPrice({
				timestamp: Date.now(),
			});

			const priceResultBack24hr = await zanoExplorerHelper.getHistoricalZanoPrice({
				timestamp: Date.now() - 24 * 60 * 60 * 1000,
			});

			if (!priceResultNow.success || !priceResultBack24hr.success) {
				console.log(priceResultNow, priceResultBack24hr);

				throw new Error('Failed to fetch Zano price data');
			}

			this.zano_price_data = {
				now: priceResultNow.price,
				back24hr: priceResultBack24hr.price,
			};
		} catch (error) {
			console.log(error);
		}
	}

	async runZanoPriceDaemon() {
		while (true) {
			await this.updateZanoPrice();
			await new Promise((resolve) => setTimeout(resolve, 30 * 1000));
		}
	}

	async runPairStatsDaemon() {
		(async () => {
			while (true) {
				console.log('Running pair stats update...');
				const date = +new Date();

				try {
					const pairs = await Pair.findAll({
						attributes: ['id'],
					});

					for (const pair of pairs) {
						const statsResult = await this.calculatePairStats(pair.id.toString());

						if (!statsResult.success || typeof statsResult.data === 'string') {
							throw new Error('Error while getting pair stats');
						}

						const stats = statsResult.data;

						await Pair.update(
							{
								rate: stats.rate,
								coefficient: stats.coefficient,
								high: stats.high,
								low: stats.low,
								volume: stats.volume,
							},
							{
								where: {
									id: pair.id,
								},
							},
						);

						sendUpdatePairStatsMessage(io, pair.id.toString(), stats);
					}
				} catch (error) {
					console.log(error);
				}

				console.log(
					`Pair stats update completed in ${Math.floor((+new Date() - date) / 1000)}s`,
				);

				await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 5));
			}
		})();
	}

	private async calculatePairStats(pairId: string) {
		try {
			if (!this.zano_price_data.now || !this.zano_price_data.back24hr) {
				await this.updateZanoPrice();

				if (!this.zano_price_data.now || !this.zano_price_data.back24hr) {
					throw new Error('Failed to fetch Zano price data');
				}
			}

			const date = new Date();

			const lastTimestamp = date.getTime();

			date.setHours(date.getHours() - 24);

			const firstTimestamp = date.getTime();

			const orders = (await Order.findAll({
				where: {
					pair_id: pairId,
					timestamp: {
						[Op.gte]: firstTimestamp,
						[Op.lte]: lastTimestamp,
					},
				},

				include: [
					{
						model: Transaction,
						as: 'buy_orders',
						attributes: ['buy_order_id', 'sell_order_id', 'amount', 'timestamp'],
						required: true,
						where: {
							status: 'confirmed',
						},
						order: [['timestamp', 'ASC']],
					},
				],

				order: [['timestamp', 'ASC']],
			})) as OrderWithTransactions[];

			const allTransactionsWithPrices = orders
				.flatMap((order) =>
					order.buy_orders.map((transaction) => {
						const buyOrderPrice = order.price;
						return {
							...transaction.toJSON(),
							buy_order_price: buyOrderPrice,
						};
					}),
				)
				.sort((a, b) => a.timestamp - b.timestamp);

			const firstOrderPrice = allTransactionsWithPrices[0]?.buy_order_price || NaN;
			const lastOrderPrice = allTransactionsWithPrices.at(-1)?.buy_order_price || NaN;

			const firstPriceInUSD = new Decimal(firstOrderPrice || '0').mul(
				new Decimal(this.zano_price_data.back24hr || '1'),
			);

			const lastPriceInUSD = new Decimal(lastOrderPrice || '0').mul(
				new Decimal(this.zano_price_data.now || '1'),
			);

			const change_coefficient = lastPriceInUSD
				.minus(firstPriceInUSD || '0')
				.div(firstPriceInUSD || '1')
				.mul(100)
				.toNumber();

			const prices = allTransactionsWithPrices.map((e) => e.buy_order_price);

			const lastTradedOrder = await Order.findOne({
				where: {
					pair_id: pairId,
				},
				include: [
					{
						model: Transaction,
						as: 'buy_orders',
						attributes: [],
						required: true,
						where: {
							status: 'confirmed',
						},
					},
				],
				order: [['timestamp', 'DESC']],
			});

			const lastKnownPrice = new Decimal(lastTradedOrder?.price || '0').toNumber();

			const data = {
				rate: new Decimal(lastKnownPrice || '0').toNumber(),
				coefficient: change_coefficient,
				high: 0,
				low: 0,
				volume: 0,
			};

			if (prices.length > 0) {
				data.high = Decimal.max(...prices).toNumber();
				data.low = Decimal.min(...prices).toNumber();
			} else {
				data.high = lastKnownPrice;
				data.low = lastKnownPrice;
			}

			for (const transaction of allTransactionsWithPrices) {
				data.volume += new Decimal(transaction.amount)
					.mul(transaction.buy_order_price)
					.toNumber();
			}

			return { success: true, data };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async rejectTransaction(transactionId: number, sequelizeTransaction?: SequelizeTransaction) {
		const transactionRow = await Transaction.findByPk(transactionId, {
			transaction: sequelizeTransaction,
			lock: sequelizeTransaction?.LOCK?.UPDATE,
		});

		if (!transactionRow) return console.error('Transaction row not found.');

		await Transaction.update(
			{ status: 'rejected', finalize_timestamp: Date.now() },
			{
				where: { id: transactionRow.id, status: 'pending' },
				transaction: sequelizeTransaction,
			},
		);
	}

	async createTransaction(
		buy_order_id: number,
		sell_order_id: number,
		amount: string,
		creator: string,
		hex_raw_proposal: string,
		{
			transaction,
		}: {
			transaction: SequelizeTransaction;
		},
	): Promise<Transaction> {
		const timestamp = Date.now();

		const transactionRow = await Transaction.create(
			{
				buy_order_id,
				sell_order_id,
				amount,
				timestamp,
				status: 'pending',
				creator: creator === 'buy' ? 'buy' : 'sell',
				hex_raw_proposal,
			},
			{
				transaction,
			},
		);

		return transactionRow;
	}

	// async rejectTransaction(body: ConfirmTransactionBody) {
	//     try {
	//         const userData = body.userData;
	//         const transactionId = body.transactionId;

	//         const transaction = await Transaction.findByPk(transactionId);

	//         if (!transaction) {
	//             return { success: false, data: "Transaction doesn't exist." };
	//         }

	//         if (transaction.status !== "pending") {
	//             return { success: false, data: "Transaction is not pending" };
	//         }

	//         const timestamp = Date.now();

	//         const buyOrder = await ordersModel.getOrderRow(transaction.buy_order_id);
	//         const sellOrder = await ordersModel.getOrderRow(transaction.sell_order_id);

	//         if (!(buyOrder && sellOrder)) {
	//             throw new Error("Buy or sell order not found.");
	//         }

	//         if (!
	//             (
	//                 (buyOrder.user_id !== userData.id ||
	//                 sellOrder.user_id !== userData.id)
	//             )
	//         ) {
	//             return { success: false, data: "You are not a participant of this transaction" };
	//         }

	//         await Transaction.update({ status: "rejected" }, { where: { id: transactionId } });

	//         await Order.update({ left: new Decimal(buyOrder.left).plus(transaction.amount).toFixed(), status: "active" }, { where: { id: buyOrder.id } });

	//         await Order.update({ left: new Decimal(sellOrder.left).plus(transaction.amount).toFixed(), status: "active" }, { where: { id: sellOrder.id } });

	//     } catch(err) {
	//         console.log(err);
	//         return { success: false, data: "Internal error" };
	//     }
	// }

	static readonly CONFIRM_TRANSACTION_ORDERS_LEFT_ALREADY_EXCEEDED =
		'CONFIRM_TRANSACTION_ORDERS_LEFT_ALREADY_EXCEEDED';
	async confirmTransaction(body: ConfirmTransactionBody) {
		try {
			const { userData } = body;
			const { transactionId } = body;

			const userRow = await userModel.getUserRow(userData.address);

			if (!userRow) {
				throw new Error('User not found.');
			}

			const result = await sequelize.transaction(async (transaction) => {
				const unlockedTransactionRow = await Transaction.findByPk(transactionId, {
					transaction,
				});

				if (!unlockedTransactionRow) {
					return { success: false as const, data: "Transaction doesn't exist." };
				}

				const orderRows = await Order.findAll({
					where: {
						id: [
							unlockedTransactionRow.buy_order_id,
							unlockedTransactionRow.sell_order_id,
						],
					},
					order: [['id', 'ASC']],
					transaction,
					lock: transaction.LOCK.UPDATE,
				});

				const buyOrder = orderRows.find(
					(e) => e.id === unlockedTransactionRow.buy_order_id,
				);
				const sellOrder = orderRows.find(
					(e) => e.id === unlockedTransactionRow.sell_order_id,
				);

				if (!(buyOrder && sellOrder)) {
					throw new Error('Buy or sell order not found.');
				}

				const transactionRow = await Transaction.findByPk(transactionId, {
					transaction,
					lock: transaction.LOCK.UPDATE,
				});

				if (!transactionRow) {
					return { success: false as const, data: "Transaction doesn't exist." };
				}

				if (transactionRow.status !== 'pending') {
					return { success: false as const, data: 'Transaction is not pending' };
				}

				if (
					!(transactionRow.creator === 'sell'
						? buyOrder.user_id === userRow.id
						: sellOrder.user_id === userRow.id)
				) {
					return {
						success: false as const,
						data: 'You are not a participant of this transaction',
					};
				}

				const transactionAmount = new Decimal(transactionRow.amount);

				const buyOrderLeft = new Decimal(buyOrder.left);
				const sellOrderLeft = new Decimal(sellOrder.left);

				const newBuyOrderLeft = buyOrderLeft.minus(transactionAmount);
				const newSellOrderLeft = sellOrderLeft.minus(transactionAmount);

				if (newBuyOrderLeft.isNegative() || newSellOrderLeft.isNegative()) {
					return {
						success: false as const,
						data: ExchangeModel.CONFIRM_TRANSACTION_ORDERS_LEFT_ALREADY_EXCEEDED,
					};
				}

				const isBuyOrderFinished = newBuyOrderLeft.equals('0');
				const isSellOrderFinished = newSellOrderLeft.equals('0');

				await Transaction.update(
					{ status: 'confirmed', finalize_timestamp: Date.now() },
					{ where: { id: transactionId }, transaction },
				);

				await Order.update(
					{
						...(isBuyOrderFinished ? { status: OrderStatus.FINISHED } : {}),
						left: newBuyOrderLeft.toFixed(),
					},
					{
						where: { id: buyOrder.id },
						transaction,
					},
				);

				await Order.update(
					{
						...(isSellOrderFinished ? { status: OrderStatus.FINISHED } : {}),
						left: newSellOrderLeft.toFixed(),
					},
					{
						where: { id: sellOrder.id },
						transaction,
					},
				);

				return {
					success: true as const,
					buyOrder,
					sellOrder,
					isBuyOrderFinished,
					isSellOrderFinished,
				};
			});

			if (!result.success) {
				return { success: false, data: result.data };
			}

			const { buyOrder, sellOrder, isBuyOrderFinished, isSellOrderFinished } = result;

			if (isBuyOrderFinished) {
				sendDeleteOrderMessage(io, buyOrder.pair_id.toString(), buyOrder.id.toString());
			}

			if (isSellOrderFinished) {
				sendDeleteOrderMessage(io, sellOrder.pair_id.toString(), sellOrder.id.toString());
			}

			const pairId = buyOrder.pair_id.toString();

			const statsResult = await this.calculatePairStats(pairId);

			if (!statsResult.success || typeof statsResult.data === 'string') {
				throw new Error('Error while getting pair stats');
			}

			const stats = statsResult.data;

			await Pair.update(
				{
					rate: stats.rate,
					coefficient: stats.coefficient,
					high: stats.high,
					low: stats.low,
					volume: stats.volume,
				},
				{
					where: {
						id: pairId,
					},
				},
			);

			sendUpdatePairStatsMessage(io, pairId, stats);

			return { success: true };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async cancelTransaction(body: CancelTransactionBody) {
		try {
			return await sequelize.transaction(async (t) => {
				const { userData } = body;
				const { transactionId } = body;

				const userRow = await userModel.getUserRow(userData.address);

				if (!userRow) {
					throw new Error('User not found.');
				}

				const transaction = await Transaction.findByPk(transactionId);

				if (!transaction) {
					return { success: false, data: "Transaction doesn't exist." };
				}

				const buyOrder = await Order.findByPk(transaction.buy_order_id, {
					transaction: t,
					lock: t.LOCK.UPDATE,
				});
				const sellOrder = await Order.findByPk(transaction.sell_order_id, {
					transaction: t,
					lock: t.LOCK.UPDATE,
				});

				if (!buyOrder || !sellOrder) {
					throw new Error('Buy or sell orders not found.');
				}

				if (buyOrder.user_id !== userRow.id && sellOrder.user_id !== userRow.id) {
					return {
						success: false,
						data: 'You are not the participant of this transaction',
					};
				}

				if (transaction.status !== 'pending') {
					return { success: false, data: 'Transaction is not pending' };
				}

				await this.rejectTransaction(transaction.id, t);

				return { success: true };
			});
		} catch (error) {
			console.log(error);
			return { success: false, data: 'Internal error' };
		}
	}

	async getActiveTxByOrdersIds(firstOrderId: number, secondOrderId: number) {
		const txRow = await Transaction.findOne({
			where: {
				[Op.or]: [
					{
						buy_order_id: firstOrderId,
						sell_order_id: secondOrderId,
					},
					{
						buy_order_id: secondOrderId,
						sell_order_id: firstOrderId,
					},
				],
				status: 'pending',
			},
		});

		return txRow?.toJSON();
	}

	isTransactionValid = async ({
		transactionId,
	}: {
		transactionId: number;
	}): Promise<
	{ success: true; valid: boolean } | { success: false; reason: 'NO_TRANSACTION' }
	> => {
		const transactionRowWithOrders = (await Transaction.findOne({
			where: { id: transactionId },
			include: [
				{
					model: Order,
					as: 'buy_order',
				},
				{
					model: Order,
					as: 'sell_order',
				},
			],
		})) as TransactionWithOrders;

		if (!transactionRowWithOrders) {
			return { success: false, reason: 'NO_TRANSACTION' };
		}

		const buyOrder = transactionRowWithOrders.buy_order;
		const sellOrder = transactionRowWithOrders.sell_order;

		const isBuyOrderValid =
			buyOrder.status === OrderStatus.ACTIVE &&
			new Decimal(buyOrder.left).greaterThanOrEqualTo(transactionRowWithOrders.amount);
		const isSellOrderValid =
			sellOrder.status === OrderStatus.ACTIVE &&
			new Decimal(sellOrder.left).greaterThanOrEqualTo(transactionRowWithOrders.amount);

		const isTransactionValid =
			transactionRowWithOrders.status === 'pending' && isBuyOrderValid && isSellOrderValid;

		return { success: true, valid: isTransactionValid };
	};

	getAllTransactionsByAddress = async ({
		address,
		offset,
		count,
		order,
	}: {
		address: string;
		offset: number;
		count: number;
		order: 'newest' | 'oldest';
	}): Promise<{
		success: true;
		totalItemsCount: number;
		data: {
			id: number;
			buy_order_id: number;
			sell_order_id: number;
			amount: string;
			timestamp: number;
			status: 'pending' | 'confirmed' | 'rejected';
			creator: 'buy' | 'sell';
			hex_raw_proposal: string;
		}[];
	}> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return {
				success: true,
				totalItemsCount: 0,
				data: [],
			};
		}

		const userOrderIds = await Order.findAll({
			where: { user_id: userRow.id },
			attributes: ['id'],
			raw: true,
		}).then((rows) => rows.map((row) => row.id));

		if (userOrderIds.length === 0) {
			return {
				success: true,
				totalItemsCount: 0,
				data: [],
			};
		}

		const transactionsSelectWhereClause: WhereOptions = {
			[Op.or]: [
				{ creator: 'buy', buy_order_id: { [Op.in]: userOrderIds } },
				{ creator: 'sell', sell_order_id: { [Op.in]: userOrderIds } },
			],
		};

		const totalItemsCount = await Transaction.count({
			where: transactionsSelectWhereClause,
		});

		const sortDirection = order === 'newest' ? 'DESC' : 'ASC';

		const transactionRows = await Transaction.findAll({
			where: transactionsSelectWhereClause,
			order: [
				['timestamp', sortDirection],
				['id', sortDirection],
			],
			limit: count,
			offset,
		});

		const transactions = transactionRows.map((e) => ({
			id: e.id,
			buy_order_id: e.buy_order_id,
			sell_order_id: e.sell_order_id,
			amount: e.amount,
			timestamp: e.timestamp,
			status: e.status,
			creator: e.creator,
			hex_raw_proposal: e.hex_raw_proposal,
		}));

		return {
			success: true,
			totalItemsCount,
			data: transactions,
		};
	};

	static readonly CONFIRMED_TRANSACTION_WITHOUT_FINALIZE_TIMESTAMP =
		'CONFIRMED_TRANSACTION_WITHOUT_FINALIZE_TIMESTAMP';
	getAllTransactionsConfirmedByAddress = async ({
		address,
		offset,
		count,
		order,
	}: {
		address: string;
		offset: number;
		count: number;
		order: 'newest' | 'oldest';
	}): Promise<{
		success: true;
		totalItemsCount: number;
		data: {
			id: number;
			buy_order_id: number;
			sell_order_id: number;
			amount: string;
			timestamp: number;
			finalize_timestamp: number;
			status: 'confirmed';
			creator: 'buy' | 'sell';
			hex_raw_proposal: string;
		}[];
	}> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return {
				success: true,
				totalItemsCount: 0,
				data: [],
			};
		}

		const userOrderIds = await Order.findAll({
			where: { user_id: userRow.id },
			attributes: ['id'],
			raw: true,
		}).then((rows) => rows.map((row) => row.id));

		if (userOrderIds.length === 0) {
			return {
				success: true,
				totalItemsCount: 0,
				data: [],
			};
		}

		const transactionsSelectWhereClause: WhereOptions = {
			status: 'confirmed',
			finalize_timestamp: { [Op.ne]: null },
			[Op.or]: [
				{ creator: 'buy', sell_order_id: { [Op.in]: userOrderIds } },
				{ creator: 'sell', buy_order_id: { [Op.in]: userOrderIds } },
			],
		};

		const totalItemsCount = await Transaction.count({
			where: transactionsSelectWhereClause,
		});

		const sortDirection = order === 'newest' ? 'DESC' : 'ASC';

		const transactionRows = await Transaction.findAll({
			where: transactionsSelectWhereClause,
			order: [
				['finalize_timestamp', sortDirection],
				['id', sortDirection],
			],
			limit: count,
			offset,
		});

		const transactions = transactionRows.map((e) => {
			const finalizeTimestamp = e.finalize_timestamp;

			if (finalizeTimestamp === null) {
				throw new Error(ExchangeModel.CONFIRMED_TRANSACTION_WITHOUT_FINALIZE_TIMESTAMP);
			}

			return {
				id: e.id,
				buy_order_id: e.buy_order_id,
				sell_order_id: e.sell_order_id,
				amount: e.amount,
				timestamp: e.timestamp,
				finalize_timestamp: finalizeTimestamp,
				status: 'confirmed' as const,
				creator: e.creator,
				hex_raw_proposal: e.hex_raw_proposal,
			};
		});

		return {
			success: true,
			totalItemsCount,
			data: transactions,
		};
	};
}

const exchangeModel = new ExchangeModel();

export default exchangeModel;
