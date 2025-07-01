import { Op } from 'sequelize';
import Period from '../interfaces/common/Period.js';
import dexModel from './Dex.js';
import Transaction from '../schemes/Transaction.js';
import Order from '../schemes/Order.js';

class CandlesModel {
	async getCandles(pairId: string, period: Period) {
		try {
			const pairRow = await dexModel.getPairRow(parseInt(pairId, 10));

			if (!pairRow) return { success: false, data: 'Invalid pair data' };

			const buyOrders = await Order.findAll({
				where: {
					pair_id: pairRow.id,
					type: 'buy',
				},
			});

			const buyOrdersIds = buyOrders.map((order) => order.id);

			interface TransactionData {
				timestamp: string;
				amount: string;
				id: number;
				price: string;
				buy_order_id: number;
			}

			const transactions = (await Transaction.findAll({
				where: {
					buy_order_id: {
						[Op.in]: buyOrdersIds,
					},
					status: 'confirmed',
				},
				order: [['timestamp', 'ASC']],
				attributes: ['timestamp', 'amount', 'id', 'amount', 'buy_order_id'],
			}).then((transactions) =>
				transactions
					.map((transaction) => transaction.toJSON())
					.map((transaction) => ({
						...transaction,
						price: buyOrders.find((order) => order.id === transaction.buy_order_id)
							?.price,
					})),
			)) as TransactionData[];

			const aggregationPeriod = (() => {
				switch (period) {
					case '1h':
						return 3600000;
					case '1d':
						return 86400000;
					case '1w':
						return 604800000;
					case '1m':
						return 2592000000;
					default:
						return 3600000;
				}
			})();

			interface ResultCandle {
				pair_id: number;
				timestamp: number;
				shadow_top: number;
				shadow_bottom: number;
				body_first: number;
				body_second: number;
			}

			const foundCandles = transactions.reduce((acc: ResultCandle[], transaction) => {
				const currentTimestamp = parseInt(transaction.timestamp, 10);

				const lastCadle = acc[acc.length - 1];

				if (!lastCadle) {
					return [
						{
							pair_id: pairRow.id,
							timestamp: currentTimestamp,
							shadow_top: parseFloat(transaction.price),
							shadow_bottom: parseFloat(transaction.price),
							body_first: parseFloat(transaction.price),
							body_second: parseFloat(transaction.price),
						},
					];
				}

				if (lastCadle.timestamp + aggregationPeriod < currentTimestamp) {
					// creata new candle
					const prevCandleEnding = lastCadle.body_second;
					return [
						...acc,
						{
							pair_id: pairRow.id,
							timestamp: currentTimestamp,
							shadow_top: parseFloat(transaction.price),
							shadow_bottom: parseFloat(transaction.price),
							body_first: prevCandleEnding,
							body_second: parseFloat(transaction.price),
						},
					];
				}
				// add to existing candle
				const newCandle = {
					...lastCadle,
					shadow_top: Math.max(lastCadle.shadow_top, parseFloat(transaction.price)),
					shadow_bottom: Math.min(lastCadle.shadow_bottom, parseFloat(transaction.price)),
					body_second: parseFloat(transaction.price),
				};

				acc[acc.length - 1] = newCandle;

				return acc;
			}, [] as ResultCandle[]);

			const endTimestamp = Date.now();

			const completeCandles = [];
			let currentTimestamp =
				foundCandles[0]?.timestamp || endTimestamp - aggregationPeriod * 10;
			let lastRealCandle = {
				pair_id: pairRow.id,
				timestamp: currentTimestamp,
				shadow_top: foundCandles[0]?.body_second || 0,
				shadow_bottom: foundCandles[0]?.body_second || 0,
				body_first: foundCandles[0]?.body_second || 0,
				body_second: foundCandles[0]?.body_second || 0,
			};

			for (let i = 0; i < foundCandles.length; i++) {
				const candle = foundCandles[i];

				// Fill gaps with "empty" candles that replicate the last real candle's values
				while (currentTimestamp < candle.timestamp) {
					completeCandles.push({
						pair_id: pairRow.id,
						timestamp: currentTimestamp,
						shadow_top: lastRealCandle.body_second,
						shadow_bottom: lastRealCandle.body_second,
						body_first: lastRealCandle.body_second,
						body_second: lastRealCandle.body_second,
					});
					currentTimestamp += aggregationPeriod;
				}

				// Add the actual candle
				completeCandles.push(candle);
				lastRealCandle = candle; // Update last real candle to the current one
				currentTimestamp = candle.timestamp + aggregationPeriod;
			}

			// Fill any remaining gaps up to the current time (endTimestamp) with the last known real candle's values
			while (currentTimestamp <= endTimestamp) {
				completeCandles.push({
					pair_id: pairRow.id,
					timestamp: currentTimestamp,
					shadow_top: lastRealCandle.body_second,
					shadow_bottom: lastRealCandle.body_second,
					body_first: lastRealCandle.body_second,
					body_second: lastRealCandle.body_second,
				});
				currentTimestamp += aggregationPeriod;
			}

			return { success: true, data: completeCandles || [] };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}
}

const candlesModel = new CandlesModel();

export default candlesModel;
