import getAssetStatsRes from '@/interfaces/responses/stats/getAssetStatsRes';
import Currency from '@/schemes/Currency';
import Order from '@/schemes/Order';
import Pair from '@/schemes/Pair';
import Transaction from '@/schemes/Transaction';
import Decimal from 'decimal.js';
import { Request, Response } from 'express';
import { Op } from 'sequelize';

class StatsController {
	async getAssetStats(req: Request, res: Response) {
		try {
			const { asset_id, from_timestamp, to_timestamp } = req.query;

			const from_timestamp_parsed = parseInt(from_timestamp as string, 10);
			const to_timestamp_parsed = parseInt(to_timestamp as string, 10);

			const targetAsset = await Currency.findOne({
				where: { asset_id: asset_id || '' },
			});

			if (!targetAsset) {
				return res.status(404).send({
					success: false,
					data: 'Asset not found (invalid asset_id)',
				});
			}

			const pair = await Pair.findOne({
				where: {
					first_currency_id: targetAsset.id,
				},
			});

			if (!pair) {
				return res.status(404).send({
					success: false,
					data: 'Pair not found for the given asset (Unexpected error)',
				});
			}

			const currentSupply = new Decimal(targetAsset.asset_info?.current_supply || '0').div(
				new Decimal(10).pow(targetAsset.asset_info?.decimal_point || 0),
			);

			const response: getAssetStatsRes = {
				current_tvl: currentSupply.mul(pair.rate || 0).toString(),
				current_price: (pair.rate || 0).toString(),
				change_24h_percent: (pair.coefficient || 0).toString(),
				volume_24h: (pair.volume || 0).toString(),
				market_cap: currentSupply.mul(pair.rate || 0).toString(),
			};

			interface OrderWithBuyOrders extends Order {
				buy_orders?: Transaction[];
			}

			if (
				typeof from_timestamp_parsed === 'number' &&
				typeof to_timestamp_parsed === 'number'
			) {
				const ordersWithTransactions = (await Order.findAll({
					where: {
						pair_id: pair.id,
						timestamp: {
							[Op.between]: [from_timestamp_parsed, to_timestamp_parsed],
						},
					},
					attributes: ['id', 'price'],
					include: [
						{
							model: Transaction,
							as: 'buy_orders',
							attributes: ['amount'],
							required: false,
						},
					],
					order: [['timestamp', 'ASC']],
				})) as OrderWithBuyOrders[];

				const filteredOrders = ordersWithTransactions.filter((order) => order.buy_orders && order.buy_orders.length > 0);

				const volumeZano = filteredOrders.reduce((acc, order) => (
					order?.buy_orders?.reduce((innerAcc, tx) => innerAcc.add(
						new Decimal(tx.amount).mul(new Decimal(order.price)),
					), acc) || acc
				), new Decimal(0));

				const firstPrice = new Decimal(filteredOrders[0]?.price || 0);
				const lastPrice = new Decimal(filteredOrders.at(-1)?.price || 0);

				const priceChangePercent = lastPrice.minus(firstPrice).div(firstPrice).mul(100);

				const period_data = {
					price_change_percent: priceChangePercent.toString(),
					volume: volumeZano.toString(),
				};

				response.period_data = period_data;
			}

			return res.status(200).send({
				success: true,
				data: response,
			});
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}

	async getTotalStats(req: Request, res: Response) {
		try {
			// soon
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}
}

const statsController = new StatsController();

export default statsController;
