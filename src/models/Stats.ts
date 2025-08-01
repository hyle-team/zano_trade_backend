import Order from '@/schemes/Order';
import { Op } from 'sequelize';
import Transaction from '@/schemes/Transaction';
import { OrderWithBuyOrders } from '@/interfaces/database/modifiedRequests';
import Decimal from 'decimal.js';

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
}

const statsModel = new StatsModel();

export default statsModel;
