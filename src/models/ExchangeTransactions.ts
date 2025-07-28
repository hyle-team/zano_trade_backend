import Decimal from 'decimal.js';
import { Op } from 'sequelize';
import { sendDeleteOrderMessage, sendUpdatePairStatsMessage } from '../socket/main.js';
import ordersModel from './Orders.js';
import userModel from './User.js';
import io from '../server.js';
import ConfirmTransactionBody from '../interfaces/bodies/exchange-transactions/ConfirmTransactionBody.js';
import Transaction from '../schemes/Transaction';
import Order from '../schemes/Order';
import Pair from '../schemes/Pair.js';

class ExchangeModel {
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

			const lastOrderPrice = orders[0]?.price || NaN;
			const firstOrderPrice = orders.at(-1)?.price || NaN;

			const prices = orders.map((e) => e.price);

			const data = {
				rate: new Decimal(lastOrderPrice).toNumber() || 0,
				coefficient:
					new Decimal(lastOrderPrice).div(firstOrderPrice).minus(1).mul(100).toNumber() ||
					0,
				high: prices?.length ? Decimal.max(...prices).toNumber() : 0,
				low: prices?.length ? Decimal.min(...prices).toNumber() : 0,
				volume: 0,
			};

			const transactions = await Transaction.findAll({
				where: {
					timestamp: {
						[Op.gte]: firstTimestamp,
						[Op.lte]: lastTimestamp,
					},
					status: 'confirmed',
				},
			});

			for (const transaction of transactions) {
				const buyOrder = await ordersModel.getOrderRow(transaction.buy_order_id);
				const sellOrder = await ordersModel.getOrderRow(transaction.sell_order_id);

				if (buyOrder && sellOrder && buyOrder.pair_id === parseInt(pairId, 10)) {
					const price = Decimal.min(buyOrder.price, sellOrder.price).toFixed();
					data.volume += new Decimal(transaction.amount).mul(price).toNumber();
				}
			}

			return { success: true, data };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async returnTransactionAmount(transactionId: number) {
		const transactionRow = await Transaction.findByPk(transactionId);

		if (!transactionRow) return console.error('Transaction row not found.');

		const buyOrder = await ordersModel.getOrderRow(transactionRow.buy_order_id);

		const sellOrder = await ordersModel.getOrderRow(transactionRow.sell_order_id);

		if (!(buyOrder && sellOrder)) return console.error('Buy or sell order not found.');

		// For debug
		const leftBeforeBuyOrder = new Decimal(buyOrder.left).toNumber();
		const leftBeforeSellOrder = new Decimal(sellOrder.left).toNumber();
		// For debug

		const newBuyOrderLeft = Decimal.max(
			new Decimal(buyOrder.left).add(transactionRow.amount),
			buyOrder.amount,
		).toFixed();

		const newSellOrderLeft = Decimal.max(
			new Decimal(sellOrder.left).add(transactionRow.amount),
		).toFixed();

		buyOrder.left = newBuyOrderLeft;
		sellOrder.left = newSellOrderLeft;
		buyOrder.status = 'active';
		sellOrder.status = 'active';

		console.log(
			`
            [Remaining debug] 
            Buy order left: ${buyOrder.left}, 
            Sell order left: ${sellOrder.left},
            Transaction amount: ${transactionRow.amount},
            Buy order left before return: ${leftBeforeBuyOrder},
            Sell order left before return: ${leftBeforeSellOrder},
            Buy order ID: ${buyOrder.id},
            Sell order ID: ${sellOrder.id}
            `,
		);

		await buyOrder.save();
		await sellOrder.save();
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
