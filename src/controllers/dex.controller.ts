import { Request, Response } from 'express';
import UserData from '@/interfaces/common/UserData.js';
import Currency from '@/schemes/Currency.js';
import Pair from '@/schemes/Pair.js';
import { Op } from 'sequelize';
import GetAssetsPriceRatesBody from '@/interfaces/bodies/dex/GetAssetsPriceRatesBody.js';
import GetAssetsPriceRatesRes, {
	GetAssetsPriceRatesResPriceRate,
} from '@/interfaces/responses/dex/GetAssetsPriceRatesRes.js';
import User from '../schemes/User.js';
import ordersModel from '../models/Orders.js';
import dexModel from '../models/Dex.js';

class DexController {
	async getPairsPage(req: Request, res: Response) {
		try {
			const { body } = req;
			const { page, searchText, whitelistedOnly, sortOption } = body;

			if (!page || typeof page !== 'number')
				return res.status(400).send({ success: false, data: 'Invalid pair page data' });

			const sort = sortOption;
			const result = await dexModel.getPairsPage(
				page,
				(searchText || '').toString(),
				!!whitelistedOnly,
				sort,
			);

			if (!result.success) return res.status(500).send(result);

			res.status(200).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}

	async getPairsPagesAmount(req: Request, res: Response) {
		try {
			const { body } = req;
			const { searchText, whitelistedOnly } = body;
			const result = await dexModel.getPairsPagesAmount(
				(searchText || '').toString(),
				!!whitelistedOnly,
			);
			res.status(200).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}

	async getPair(req: Request, res: Response) {
		try {
			if (!req.body.id)
				return res.status(400).send({ success: false, data: 'Invalid pair data' });

			const result = await dexModel.getPair(req.body.id);

			if (result.data === 'Invalid pair data') return res.status(400).send(result);

			if (result.data === 'Internal error') return res.status(500).send(result);

			res.status(200).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}

	async registerBot(req: Request, res: Response) {
		const userData = req.body.userData as UserData;
		if (!userData) return res.status(400).send({ success: false, data: 'Invalid user data' });

		const { orderId } = req.body;

		const targetOrder = await ordersModel.getOrderRow(orderId).catch(() => null);

		if (!targetOrder)
			return res.status(400).send({ success: false, data: 'Invalid order data' });

		const targetUser = await User.findOne({
			where: {
				address: userData.address,
			},
		});

		if (!targetUser || targetOrder.user_id !== targetUser.id)
			return res.status(400).send({ success: false, data: 'Invalid user data' });

		const result = await dexModel.renewBotExpiration(orderId, targetUser.id);

		return res.status(200).send(result);
	}

	async volumeStats(req: Request, res: Response) {
		const { address, pairID, from, to } = req.body;

		if (!address || !pairID)
			return res.status(400).send({ success: false, data: 'Invalid data' });

		const fromTimestamp = typeof from === 'number' ? from : 0;
		const toTimestamp = typeof to === 'number' ? to : +Date.now();

		const result = await dexModel.volumeStats(address, pairID, fromTimestamp, toTimestamp);
		return res.status(200).send(result);
	}

	getAssetsPriceRates = async (req: Request, res: Response<GetAssetsPriceRatesRes>) => {
		const { assetsIds } = req.body as GetAssetsPriceRatesBody;

		const currenciesRows = await Currency.findAll({
			where: {
				asset_id: {
					[Op.in]: assetsIds,
				},
			},
		});

		const currencyIds = currenciesRows.map((currency) => currency.id);

		const pairsRows = (await Pair.findAll({
			where: {
				first_currency_id: {
					[Op.in]: currencyIds,
				},
			},
			include: [
				{
					model: Currency,
					as: 'first_currency',
					required: true,
					attributes: ['asset_id'],
				},
			],
		})) as (Pair & { first_currency: Currency })[];

		const priceRates: GetAssetsPriceRatesResPriceRate[] = pairsRows.map((pairRow) => {
			const assetId = pairRow.first_currency.asset_id;

			return {
				asset_id: assetId,
				rate: pairRow?.rate ?? null,
				day_change: pairRow?.coefficient ?? null,
				day_volume: pairRow?.volume ?? null,
				day_high: pairRow?.high ?? null,
				day_low: pairRow?.low ?? null,
			};
		});

		return res.status(200).send({
			success: true,
			priceRates,
		});
	};

	async findPairID(req: Request, res: Response) {
		const { first, second } = req.body;

		if (!first || !second)
			return res.status(400).send({ success: false, data: 'Invalid data' });

		const firstCurrency = await Currency.findOne({ where: { asset_id: first } });

		const secondCurrency = await Currency.findOne({ where: { asset_id: second } });

		if (!firstCurrency || !secondCurrency)
			return res.status(400).send({ success: false, data: 'Invalid data' });

		const pair = await Pair.findOne({
			where: {
				first_currency_id: firstCurrency.id,
				second_currency_id: secondCurrency.id,
			},
		});

		if (!pair) return res.status(404).send({ success: false, data: 'Pair not found' });

		return res.status(200).send({
			success: true,
			data: pair.id,
		});
	}
}

const dexController = new DexController();

export default dexController;
