import Order from '@/schemes/Order';
import { Op } from 'sequelize';
import Transaction from '@/schemes/Transaction';
import { OrderWithBuyOrders, PairWithFirstCurrency } from '@/interfaces/database/modifiedRequests';
import Decimal from 'decimal.js';
import Pair from '@/schemes/Pair';
import Currency from '@/schemes/Currency';

export const MIN_VOLUME_THRESHOLD = 1000; // volume in zano per month
class StatsModel {
	async calcVolumeForPeriod(pairId: number, from: number, to: number) {
		const orders = (await Order.findAll({
			where: {
				pair_id: pairId,
				timestamp: {
					[Op.between]: [from, to],
				},
			},
			attributes: ['id', 'price'],
			include: [
				{
					model: Transaction,
					as: 'buy_orders',
					attributes: ['amount'],
					required: true,
					where: {
						status: 'confirmed',
					},
				},
			],
		})) as OrderWithBuyOrders[];

		const volume = orders.reduce((acc, order) => {
			const orderVolume = order.buy_orders.reduce(
				(sum, t) => sum.add(new Decimal(order.price).mul(new Decimal(t.amount))),
				new Decimal(0),
			);
			return acc.add(orderVolume);
		}, new Decimal(0));

		return volume.toString();
	}

	async calcVolumeForMultiplePairs(pairIds: string[], from: number, to: number) {
		const orders = (await Order.findAll({
			where: {
				pair_id: {
					[Op.in]: pairIds,
				},
				timestamp: {
					[Op.between]: [from, to],
				},
			},
			attributes: ['id', 'price', 'pair_id'],
			include: [
				{
					model: Transaction,
					as: 'buy_orders',
					attributes: ['amount'],
					required: true,
					where: {
						status: 'confirmed',
					},
				},
			],
		})) as OrderWithBuyOrders[];

		const pairVolumes: Record<string, string> = {};

		for (const order of orders) {
			const orderVolume = order.buy_orders.reduce(
				(sum, t) => sum.add(new Decimal(order.price).mul(new Decimal(t.amount))),
				new Decimal(0),
			);
			pairVolumes[order.pair_id] = new Decimal(pairVolumes[order.pair_id] || 0)
				.add(orderVolume)
				.toString();
		}

		return pairVolumes;
	}

	async calcTotalStatsInPeriod(from_timestamp: number, to_timestamp: number) {
		const tradedPairs = await Order.findAll({
			where: {
				timestamp: {
					[Op.between]: [from_timestamp, to_timestamp],
				},
			},
			attributes: ['pair_id'],
			raw: true,
			group: ['pair_id'],
		});

		const volumesForPairs = await this.calcVolumeForMultiplePairs(
			tradedPairs.map((p) => p.pair_id.toString()),
			from_timestamp,
			to_timestamp,
		);

		const filteredActivePairs = Object.entries(volumesForPairs)
			.map(([pairId, volume]) => ({
				pair_id: Number(pairId),
				volume: new Decimal(volume),
			}))
			.filter(({ volume }) =>
				this.checkActivePairEligibility(volume.toString(), from_timestamp, to_timestamp),
			);

		const avgPricesInPeriod = (await Order.findAll({
			where: {
				pair_id: {
					[Op.in]: filteredActivePairs.map((p) => p.pair_id),
				},
				timestamp: {
					[Op.between]: [from_timestamp, to_timestamp],
				},
			},
			include: [
				{
					model: Transaction,
					as: 'buy_orders',
					attributes: ['amount'],
					where: {
						status: 'confirmed',
					},
					required: true,
				},
			],

			attributes: ['pair_id', 'price'],
		})) as OrderWithBuyOrders[];

		const groupedPrices = avgPricesInPeriod.reduce(
			(acc, order) => {
				const pairId = order.pair_id;
				const price = new Decimal(order.price);
				const amount = order.buy_orders.reduce(
					(sum, t) => sum.add(new Decimal(t.amount)),
					new Decimal(0),
				);

				if (!acc[pairId]) {
					acc[pairId] = [];
				}

				acc[pairId].push({ price, amount });

				return acc;
			},
			{} as Record<number, { price: Decimal; amount: Decimal }[]>,
		);

		const prices: Record<string, string> = {};

		for (const [pairId, priceData] of Object.entries(groupedPrices)) {
			const totalAmount = priceData.reduce(
				(sum, item) => sum.add(item.amount),
				new Decimal(0),
			);
			const totalValue = priceData.reduce(
				(sum, item) => sum.add(item.price.mul(item.amount)),
				new Decimal(0),
			);

			const weightedAveragePrice = totalValue.div(totalAmount);

			prices[pairId] = weightedAveragePrice.toString();
		}

		const pairsData = (await Pair.findAll({
			where: {
				id: {
					[Op.in]: filteredActivePairs.map((p) => p.pair_id),
				},
			},
			attributes: ['id', 'first_currency_id'],
			include: [
				{
					model: Currency,
					as: 'first_currency',
					required: true,
					attributes: ['asset_id', 'asset_info'],
				},
			],
		})) as PairWithFirstCurrency[];

		const currentSupplies: Record<string, string> = {};

		for (const pair of pairsData) {
			const {asset_info} = pair.first_currency;
			currentSupplies[pair.id] = new Decimal(asset_info?.current_supply || 0)
				.div(new Decimal(10).pow(asset_info?.decimal_point || 0))
				.toString();
		}

		const totalTvl = filteredActivePairs.reduce((acc, pair) => {
			const price = prices[pair.pair_id.toString()];
			const supply = currentSupplies[pair.pair_id.toString()] || '0';
			console.log(`Pair ID: ${pair.pair_id}, Price: ${price}, Supply: ${supply}`);

			const pairTvl = new Decimal(price).mul(new Decimal(supply));
			return acc.add(pairTvl);
		}, new Decimal(0));

		const orders = (await Order.findAll({
			where: {
				timestamp: {
					[Op.between]: [from_timestamp, to_timestamp],
				},
			},
			attributes: ['id', 'price'],
			include: [
				{
					model: Transaction,
					as: 'buy_orders',
					attributes: ['amount'],
					required: true,
					where: {
						status: 'confirmed',
					},
				},
			],
		})) as OrderWithBuyOrders[];

		const volume = orders.reduce((acc, order) => {
			const orderVolume = order.buy_orders.reduce(
				(sum, t) => sum.add(new Decimal(order.price).mul(new Decimal(t.amount))),
				new Decimal(0),
			);
			return acc.add(orderVolume);
		}, new Decimal(0));

		return {
			total_tvl: totalTvl.toString(),
			volume: volume.toString(),
		};
	}

	checkActivePairEligibility(volume: string, from_timestamp: number, to_timestamp: number) {
		const daysInPeriod = Math.ceil((to_timestamp - from_timestamp) / (24 * 60 * 60 * 1000));

		const requiredVolumePerDay = MIN_VOLUME_THRESHOLD / 30;

		return parseFloat(volume) >= requiredVolumePerDay * daysInPeriod;
	}
}

const statsModel = new StatsModel();

export default statsModel;
