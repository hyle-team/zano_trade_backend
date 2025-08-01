import getAssetStatsRes from '@/interfaces/responses/stats/getAssetStatsRes';
import getTotalStatsRes from '@/interfaces/responses/stats/getTotalStatsRes';
import Currency from '@/schemes/Currency';
import Order from '@/schemes/Order';
import Pair from '@/schemes/Pair';
import Transaction from '@/schemes/Transaction';
import Decimal from 'decimal.js';
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { OrderWithBuyOrders, PairWithFirstCurrency } from '@/interfaces/database/modifiedRequests';
import statsModel from '@/models/Stats';

const MIN_VOLUME_THRESHOLD = 1000; // volume in zano per month

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

			const monthlyVolume = await statsModel.calcVolumeForPeriod(
				pair.id,
				+new Date() - 30 * 24 * 60 * 60 * 1000,
				+new Date(),
			);

			const marketCap =
				parseFloat(monthlyVolume) > MIN_VOLUME_THRESHOLD
					? currentSupply.mul(pair.rate || 0).toString()
					: '0';
			const currentTVL = marketCap;

			const response: getAssetStatsRes = {
				current_tvl: currentTVL,
				current_price: (pair.rate || 0).toString(),
				change_24h_percent: (pair.coefficient || 0).toString(),
				volume_24h: (pair.volume || 0).toString(),
				market_cap: marketCap,
				name: targetAsset.asset_info?.full_name || '',
				ticker: targetAsset.asset_info?.ticker || '',
				pair_id: pair.id.toString(),
				current_supply: currentSupply.toString(),
			};

			if (
				from_timestamp &&
				from_timestamp &&
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
							required: true,
							where: {
								status: 'confirmed',
							},
						},
					],
					order: [['timestamp', 'ASC']],
				})) as OrderWithBuyOrders[];

				const filteredOrders = ordersWithTransactions.filter(
					(order) => order.buy_orders && order.buy_orders.length > 0,
				);

				const volumeZano = filteredOrders.reduce(
					(acc, order) =>
						order?.buy_orders?.reduce(
							(innerAcc, tx) =>
								innerAcc.add(new Decimal(tx.amount).mul(new Decimal(order.price))),
							acc,
						) || acc,
					new Decimal(0),
				);

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
			const { from_timestamp, to_timestamp } = req.query;

			const from_timestamp_parsed = parseInt(from_timestamp as string, 10);
			const to_timestamp_parsed = parseInt(to_timestamp as string, 10);

			const allRates = (
				(await Pair.findAll({
					attributes: ['id', 'rate', 'volume'],
					include: [
						{
							model: Currency,
							as: 'first_currency',
							attributes: ['asset_id', 'asset_info', 'auto_parsed'],
							required: true,
						},
					],
				})) as PairWithFirstCurrency[]
			)
				.map((pair) => ({
					id: pair.id,
					ticker: pair.first_currency.asset_info?.ticker || '',
					asset_id: pair.first_currency.asset_id,
					current_supply: pair.first_currency.asset_info?.current_supply || '0',
					decimal_point: pair.first_currency.asset_info?.decimal_point || 0,
					rate: pair.rate || 0,
					auto_parsed: pair.first_currency.auto_parsed,
					volume: pair.volume || 0,
				}))
				.filter((pair) => pair.auto_parsed && pair.rate > 0);

			const allTvls = allRates
				.map((pair) => {
					const currentSupply = new Decimal(pair.current_supply).div(
						new Decimal(10).pow(pair.decimal_point),
					);
					return {
						id: pair.id,
						asset_id: pair.asset_id,
						ticker: pair.ticker,
						tvl: currentSupply.mul(pair.rate).toString(),
						volume: pair.volume,
					};
				})
				.filter((pair) => new Decimal(pair.tvl).gt(0))
				.sort((a, b) => new Decimal(b.tvl).minus(new Decimal(a.tvl)).toNumber());

			const monthlyVolumes = await statsModel.calcVolumeForMultiplePairs(
				allTvls.map((pair) => pair.id.toString()),
				+new Date() - 30 * 24 * 60 * 60 * 1000,
				+new Date(),
			);

			const filteredActivePairsTVLs = allTvls.filter((pair) => {
				const monthlyVolume = new Decimal(monthlyVolumes[pair.id] || 0);
				return monthlyVolume.gt(MIN_VOLUME_THRESHOLD);
			});

			const totalTVL = filteredActivePairsTVLs.reduce(
				(acc, pair) => acc.add(new Decimal(pair.tvl)),
				new Decimal(0),
			);

			const response: getTotalStatsRes = {
				largest_tvl: {
					ticker: filteredActivePairsTVLs[0]?.ticker || '',
					asset_id: filteredActivePairsTVLs[0]?.asset_id || '',
					tvl: filteredActivePairsTVLs[0]?.tvl || '0',
				},
				total_tvl: totalTVL.toString(),
			};

			if (
				from_timestamp &&
				from_timestamp &&
				typeof from_timestamp_parsed === 'number' &&
				typeof to_timestamp_parsed === 'number'
			) {
				const ordersWithTransactions = (await Order.findAll({
					where: {
						timestamp: {
							[Op.between]: [from_timestamp_parsed, to_timestamp_parsed],
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
					order: [['timestamp', 'ASC']],
				})) as OrderWithBuyOrders[];

				const pairVolumes = ordersWithTransactions.reduce(
					(acc, order) => {
						const orderVolume = order.buy_orders.reduce(
							(sum, t) => sum + Number(order.price) * Number(t.amount),
							0,
						);

						acc[order.pair_id] = (acc[order.pair_id] || 0) + orderVolume;
						return acc;
					},
					{} as Record<number, number>,
				);

				const daysInPeriod = Math.ceil(
					(to_timestamp_parsed - from_timestamp_parsed) / (24 * 60 * 60 * 1000),
				);

				const requiredVolumePerDay = MIN_VOLUME_THRESHOLD / 30;

				const involvedPairs = Object.keys(pairVolumes).filter(
					(pairId) => pairVolumes[Number(pairId)] >= requiredVolumePerDay * daysInPeriod,
				);

				const entries = Object.entries(pairVolumes);

				let maxPairId = Number(entries[0]?.[0]);
				let maxVolume = entries[0]?.[1];

				for (const [pairId, volume] of entries) {
					if (volume > maxVolume) {
						maxVolume = volume;
						maxPairId = Number(pairId);
					}
				}

				const biggestPair = maxPairId
					? ((await Pair.findByPk(maxPairId, {
						attributes: [],
						include: [
							{
								model: Currency,
								as: 'first_currency',
								attributes: ['asset_id'],
								required: true,
							},
						],
					})) as PairWithFirstCurrency)
					: null;

				const totalVolume = Object.values(pairVolumes).reduce(
					(sum, volume) => sum + volume,
					0,
				);

				const period_data = {
					active_tokens: involvedPairs.length.toString(),
					most_traded: {
						asset_id: biggestPair?.first_currency?.asset_id || '',
						ticker: biggestPair?.first_currency?.asset_info?.ticker || '',
						volume: maxVolume?.toString() || '0',
					},
					total_volume: totalVolume?.toString() || '0',
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
}

const statsController = new StatsController();

export default statsController;
