import Decimal from 'decimal.js';
import { Op } from 'sequelize';
import type { Transaction as SequelizeTransaction } from 'sequelize';
import CancelTransactionBody from '@/interfaces/bodies/exchange-transactions/CancelTransactionBody.js';
import sequelize from '@/sequelize.js';
import { sendDeleteOrderMessage, sendUpdatePairStatsMessage } from '../socket/main.js';
import ordersModel from './Orders.js';
import userModel from './User.js';
import io from '../server.js';
import ConfirmTransactionBody from '../interfaces/bodies/exchange-transactions/ConfirmTransactionBody.js';
import Transaction from '../schemes/Transaction';
import Order from '../schemes/Order';
import Pair from '../schemes/Pair.js';

interface OrderWithTransactions extends Order {
	buy_orders: Transaction[];
	sell_orders: Transaction[];
}

const PRICE_BASE_URL = 'https://explorer.zano.org/api/get_historical_zano_price?timestamp=';

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
			const priceData = await fetch(`${PRICE_BASE_URL}${timestamp}`).then((res) =>
				res.json(),
			);

			const priceParsed = priceData?.data?.price;

			if (!priceParsed) {
				console.log(priceData);

				throw new Error('Failed to fetch Zano price data for timestamp');
			}

			return { success: true, data: priceParsed };
		} catch (error) {
			console.log(error);
			return { success: false, data: 'Internal error' };
		}
	}

	async updateZanoPrice() {
		try {
			const priceDataNow = await fetch(`${PRICE_BASE_URL}${Date.now()}`).then((res) =>
				res.json(),
			);

			const priceDataBack24hr = await fetch(
				`${PRICE_BASE_URL}${Date.now() - 24 * 60 * 60 * 1000}`,
			).then((res) => res.json());

			const priceNowParsed = priceDataNow?.data?.price;
			const priceBack24hrParsed = priceDataBack24hr?.data?.price;

			if (!priceNowParsed || !priceBack24hrParsed) {
				console.log(priceDataNow, priceDataBack24hr);

				throw new Error('Failed to fetch Zano price data');
			}

			this.zano_price_data = {
				now: priceNowParsed,
				back24hr: priceBack24hrParsed,
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

	async returnTransactionAmount(
		transactionId: number,
		sequelizeTransaction?: SequelizeTransaction,
	) {
		const transactionRow = await Transaction.findByPk(transactionId, {
			transaction: sequelizeTransaction,
			lock: sequelizeTransaction?.LOCK?.UPDATE,
		});

		if (!transactionRow) return console.error('Transaction row not found.');

		const [affected] = await Transaction.update(
			{ status: 'rejected', rejected_at: new Date() },
			{
				where: { id: transactionRow.id, status: 'pending' },
				transaction: sequelizeTransaction,
			},
		);

		if ((affected as number) === 0) {
			return;
		}

		const buyOrder = await Order.findByPk(transactionRow.buy_order_id, {
			transaction: sequelizeTransaction,
			lock: sequelizeTransaction?.LOCK?.UPDATE,
		});
		const sellOrder = await Order.findByPk(transactionRow.sell_order_id, {
			transaction: sequelizeTransaction,
			lock: sequelizeTransaction?.LOCK?.UPDATE,
		});

		if (!(buyOrder && sellOrder)) return console.error('Buy or sell order not found.');

		const newBuyOrderLeft = Decimal.min(
			new Decimal(buyOrder.left).add(transactionRow.amount),
			new Decimal(buyOrder.amount),
		).toFixed();

		const newSellOrderLeft = Decimal.min(
			new Decimal(sellOrder.left).add(transactionRow.amount),
			new Decimal(sellOrder.amount),
		).toFixed();

		buyOrder.left = newBuyOrderLeft;
		sellOrder.left = newSellOrderLeft;
		buyOrder.status = 'active';
		sellOrder.status = 'active';

		await buyOrder.save({ transaction: sequelizeTransaction });
		await sellOrder.save({ transaction: sequelizeTransaction });
	}

	async createTransaction(
		buy_order_id: number,
		sell_order_id: number,
		amount: string,
		creator: string,
		hex_raw_proposal: string,
	) {
		const timestamp = Date.now();

		await Transaction.create({
			buy_order_id,
			sell_order_id,
			amount,
			timestamp,
			status: 'pending',
			creator: creator === 'buy' ? 'buy' : 'sell',
			hex_raw_proposal,
		});
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

	async confirmTransaction(body: ConfirmTransactionBody) {
		try {
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

			if (transaction.status !== 'pending') {
				return { success: false, data: 'Transaction is not pending' };
			}

			const buyOrder = await ordersModel.getOrderRow(transaction.buy_order_id);
			const sellOrder = await ordersModel.getOrderRow(transaction.sell_order_id);

			if (!(buyOrder && sellOrder)) {
				throw new Error('Buy or sell order not found.');
			}

			if (
				!(transaction.creator === 'sell'
					? buyOrder.user_id === userRow.id
					: sellOrder.user_id === userRow.id)
			) {
				return { success: false, data: 'You are not a participant of this transaction' };
			}

			await Transaction.update({ status: 'confirmed' }, { where: { id: transactionId } });

			if (buyOrder.status === 'zero') {
				await Order.update({ status: 'finished' }, { where: { id: buyOrder.id } });

				sendDeleteOrderMessage(io, buyOrder.pair_id.toString(), buyOrder.id.toString());
			}

			if (sellOrder.status === 'zero') {
				await Order.update({ status: 'finished' }, { where: { id: sellOrder.id } });

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

				const transactionOwnerOrder =
					transaction.creator === 'buy'
						? transaction.buy_order_id
						: transaction.sell_order_id;

				const ownerOrder = await Order.findByPk(transactionOwnerOrder, {
					transaction: t,
					lock: t.LOCK.UPDATE,
				});

				if (!ownerOrder) {
					throw new Error('Owner order not found.');
				}

				if (ownerOrder.user_id !== userRow.id) {
					return { success: false, data: 'You are not the creator of this transaction' };
				}

				if (transaction.status !== 'pending') {
					return { success: false, data: 'Transaction is not pending' };
				}

				await this.returnTransactionAmount(transaction.id, t);

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
}

const exchangeModel = new ExchangeModel();

export default exchangeModel;
