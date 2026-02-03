import Sequelize, { Op, WhereOptions } from 'sequelize';
import Decimal from 'decimal.js';
import { PairSortOption } from '@/interfaces/enum/pair.js';
import Currency from '../schemes/Currency.js';
import configModel from './Config.js';
import Pair from '../schemes/Pair.js';
import Transaction from '../schemes/Transaction.js';
import Order from '../schemes/Order.js';
import User from '../schemes/User.js';

const PAGE_SIZE = 6;
const BOT_RENEWAL_INTERVAL = 30 * 1000;
const MIN_RENEWAL_INTERVAL = 5 * 1000;

interface ActiveBot {
	orderId: number;
	userId: number;
	expirationTimestamp: number;
}

interface PairWithCurrencies extends Pair {
	first_currency?: Currency | null;
	second_currency?: Currency | null;
	whitelisted?: boolean;
}

class DexModel {
	private activeBots: ActiveBot[];

	constructor() {
		this.activeBots = [];

		setInterval(() => {
			const now = Date.now();

			this.activeBots = this.activeBots.filter((bot) => bot.expirationTimestamp > now);
		}, BOT_RENEWAL_INTERVAL);
	}

	private getPairsSearchCondition(searchText: string, whitelistedOnly: boolean) {
		const searchCondition: WhereOptions = {
			[Op.and]: [
				{
					[Op.or]: [
						Sequelize.where(
							Sequelize.fn('LOWER', Sequelize.col('first_currency.name')),
							{
								[Op.like]: `%${searchText.toLowerCase()}%`,
							},
						),
						Sequelize.where(
							Sequelize.fn('LOWER', Sequelize.col('second_currency.name')),
							{
								[Op.like]: `%${searchText.toLowerCase()}%`,
							},
						),
						Sequelize.where(Sequelize.col('first_currency.asset_id'), searchText),
						Sequelize.where(Sequelize.col('second_currency.asset_id'), searchText),
					],
				},
				whitelistedOnly
					? {
						[Op.or]: [
							Sequelize.where(Sequelize.col('first_currency.whitelisted'), true),
							Sequelize.where(Sequelize.col('second_currency.whitelisted'), true),
							Sequelize.where(Sequelize.col('featured'), true),
						],
					}
					: {},
			],
		};

		return searchCondition;
	}

	async getPairRow(id: number) {
		try {
			return await Pair.findByPk(id);
		} catch (error) {
			console.log(error);
		}
	}

	async getPairsPage(
		page: number,
		searchText: string,
		whitelistedOnly: boolean,
		sortOption: PairSortOption,
	) {
		try {
			const searchCondition = this.getPairsSearchCondition(searchText, whitelistedOnly);

			const volumeSortDirection =
				sortOption === PairSortOption.VOLUME_LOW_TO_HIGH ? 'ASC' : 'DESC';

			const pairs = await Pair.findAll({
				attributes: [
					'id',
					'first_currency_id',
					'second_currency_id',
					'rate',
					'coefficient',
					'high',
					'low',
					'volume',
					'featured',
				],
				include: [
					{
						model: Currency,
						as: 'first_currency',
						attributes: ['asset_id', 'code', 'id', 'name', 'type', 'whitelisted'],
					},
					{
						model: Currency,
						as: 'second_currency',
						attributes: ['asset_id', 'code', 'id', 'name', 'type', 'whitelisted'],
					},
				],
				where: searchCondition,
				order: [
					['volume', volumeSortDirection],
					['id', 'ASC'],
				],
				limit: PAGE_SIZE,
				offset: (page - 1) * PAGE_SIZE,
				subQuery: false,
			});

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const pairsWithCurrencies: PairWithCurrencies[] = pairs;

			for (let i = 0; i < pairs.length; i++) {
				pairsWithCurrencies[i].first_currency = await configModel.getCurrencyRow(
					pairs[i].first_currency_id,
				);
				pairsWithCurrencies[i].second_currency = await configModel.getCurrencyRow(
					pairs[i].second_currency_id,
				);
			}

			for (const pwc of pairsWithCurrencies) {
				pwc.whitelisted = pwc.first_currency?.whitelisted || false;
			}

			return { success: true, data: pairsWithCurrencies };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async getPairsPagesAmount(searchText: string, whitelistedOnly: boolean) {
		try {
			const searchCondition = this.getPairsSearchCondition(searchText, whitelistedOnly);

			const count = await Pair.count({
				include: [
					{
						model: Currency,
						as: 'first_currency',
						attributes: ['asset_id', 'code', 'id', 'name', 'type'],
					},
					{
						model: Currency,
						as: 'second_currency',
						attributes: ['asset_id', 'code', 'id', 'name', 'type'],
					},
				],
				where: searchCondition,
			});

			const result = Math.ceil(count / PAGE_SIZE);

			return { success: true, data: result };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async getPair(id: string) {
		try {
			const pair = await this.getPairRow(parseInt(id, 10));

			if (!pair) return { success: false, data: 'Invalid pair data' };

			const pairWithCurrencies: Pair = pair;

			const first_currency = await configModel.getCurrencyRow(pair.first_currency_id);
			const second_currency = await configModel.getCurrencyRow(pair.second_currency_id);

			const result: PairWithCurrencies = {
				...(pairWithCurrencies?.toJSON() || {}),
				first_currency,
				second_currency,
			} as PairWithCurrencies;

			return { success: true, data: result };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async renewBotExpiration(orderId: number, userId: number) {
		const existingBot = this.activeBots.find(
			(bot) => bot.orderId === orderId && bot.userId === userId,
		);

		const expirationTimestamp = Date.now() + BOT_RENEWAL_INTERVAL;

		if (existingBot) {
			const pastFromLastRenewal =
				BOT_RENEWAL_INTERVAL + Date.now() - existingBot.expirationTimestamp;

			if (pastFromLastRenewal < MIN_RENEWAL_INTERVAL) {
				return {
					success: false,
					data: `
                    Bot renewal interval is too short. 
                    Minimum interval is ${MIN_RENEWAL_INTERVAL / 1000} seconds.
                    Maximum interval is ${BOT_RENEWAL_INTERVAL / 1000} seconds.
                    `,
				};
			}

			existingBot.expirationTimestamp = expirationTimestamp;
		} else {
			this.activeBots.push({
				orderId,
				userId,
				expirationTimestamp,
			});
		}

		return {
			success: true,
			data: {
				expirationTimestamp,
			},
		};
	}

	async volumeStats(address: string, pairID: number, from: number, to: number) {
		const targetUser = await User.findOne({
			where: {
				address,
			},
		});

		if (!targetUser) return { success: false, data: 'User not found' };

		const allOrders = await Order.findAll({
			where: {
				user_id: targetUser.id,
				pair_id: pairID,
			},
		});

		const ordersIds = allOrders.map((order) => order.id);

		const transactions = await Transaction.findAll({
			where: {
				[Op.or]: [
					{
						buy_order_id: {
							[Op.in]: ordersIds,
						},
					},
					{
						sell_order_id: {
							[Op.in]: ordersIds,
						},
					},
				],
				timestamp: {
					[Op.between]: [from, to],
				},
			},
		});

		const volume = transactions.reduce(
			(acc, transaction) => new Decimal(acc).add(new Decimal(transaction.amount)),
			new Decimal(0),
		);

		return {
			success: true,
			data: {
				volume: volume.toString(),
			},
		};
	}

	getActiveBots() {
		return this.activeBots;
	}

	isBotActive(orderId: number) {
		return this.activeBots.some((bot) => bot.orderId === orderId);
	}
}

const dexModel = new DexModel();

export default dexModel;
