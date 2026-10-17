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
					// case '1sec':
					// 	return 1000;
					case '1min':
						return 60 * 1000;
					case '5min':
						return 5 * 60 * 1000;
					case '15min':
						return 15 * 60 * 1000;
					case '30min':
						return 30 * 60 * 1000;
					case '1h':
						return 60 * 60 * 1000;
					case '4h':
						return 4 * 60 * 60 * 1000;
					case '1d':
						return 24 * 60 * 60 * 1000;
					case '1w':
						return 7 * 24 * 60 * 60 * 1000;
					case '1m':
						return 30 * 24 * 60 * 60 * 1000;
					default:
						return 60 * 60 * 1000;
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

			const weekOffset = 4 * 24 * 60 * 60 * 1000;

			const getBucketStart = (timestamp: number) => {
				if (period === '1m') {
					const date = new Date(timestamp);
					return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
				}

				if (period === '1w') {
					return (
						Math.floor((timestamp - weekOffset) / aggregationPeriod) *
							aggregationPeriod +
						weekOffset
					);
				}

				return Math.floor(timestamp / aggregationPeriod) * aggregationPeriod;
			};

			const getNextBucketStart = (timestamp: number) => {
				if (period === '1m') {
					const date = new Date(timestamp);
					return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
				}

				return timestamp + aggregationPeriod;
			};

			const foundCandles = transactions.reduce((acc: ResultCandle[], transaction) => {
				const currentTimestamp = getBucketStart(parseInt(transaction.timestamp, 10));
				const price = parseFloat(transaction.price);

				const lastCadle = acc[acc.length - 1];

				if (!lastCadle) {
					return [
						{
							pair_id: pairRow.id,
							timestamp: currentTimestamp,
							shadow_top: price,
							shadow_bottom: price,
							body_first: price,
							body_second: price,
						},
					];
				}

				if (lastCadle.timestamp !== currentTimestamp) {
					// creata new candle
					const prevCandleEnding = lastCadle.body_second;
					return [
						...acc,
						{
							pair_id: pairRow.id,
							timestamp: currentTimestamp,
							shadow_top: Math.max(prevCandleEnding, price),
							shadow_bottom: Math.min(prevCandleEnding, price),
							body_first: prevCandleEnding,
							body_second: price,
						},
					];
				}
				// add to existing candle
				const newCandle = {
					...lastCadle,
					shadow_top: Math.max(lastCadle.shadow_top, price),
					shadow_bottom: Math.min(lastCadle.shadow_bottom, price),
					body_second: price,
				};

				acc[acc.length - 1] = newCandle;

				return acc;
			}, [] as ResultCandle[]);

			const endTimestamp = getBucketStart(Date.now());

			const completeCandles = [];
			let currentTimestamp =
				foundCandles[0]?.timestamp || getBucketStart(Date.now() - aggregationPeriod * 10);
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
					currentTimestamp = getNextBucketStart(currentTimestamp);
				}

				// Add the actual candle
				completeCandles.push(candle);
				lastRealCandle = candle; // Update last real candle to the current one
				currentTimestamp = getNextBucketStart(candle.timestamp);
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
