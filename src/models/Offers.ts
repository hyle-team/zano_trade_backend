import { Op } from 'sequelize';
import DeleteBody from '../interfaces/bodies/offers/DeleteBody.js';
import { PageData } from '../interfaces/bodies/offers/GetPageBody.js';
import UpdateBody from '../interfaces/bodies/offers/UpdateBody.js';
import configModel from './Config.js';
import userModel from './User.js';

import Offer from '../schemes/Offer.js';
import Currency from '../schemes/Currency.js';
import User from '../schemes/User.js';
import { ZANO_ASSET_ID } from '../workers/assetsUpdateChecker.js';

function generateOrderNumber(length: number) {
	let result = '';
	const characters = '0123456789';
	const charactersLength = characters.length;
	let counter = 0;
	while (counter < length) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
		counter += 1;
	}
	return result;
}

class OffersModel {
	private async checkOfferAccess(offerId: string | undefined, userId: number) {
		const offerRow = await Offer.findOne({
			where: {
				number: offerId,
				offer_status: ['default', 'process'],
			},
		});

		if (!offerRow) return 'No offer';

		if (offerRow.user_id !== userId) return 'Forbidden';

		return 'Update offer';
	}

	async getOfferRow(number: string) {
		const selected = await Offer.findOne({
			where: {
				number,
			},
		});

		return selected;
	}

	async update(body: UpdateBody) {
		try {
			const userRow = await userModel.getUserRow(body.userData.address);
			if (!userRow) return { success: false, data: 'User not registered' };

			let isFull = true;

			const ZanoCurrencyID = await Currency.findOne({
				where: {
					asset_id: ZANO_ASSET_ID,
				},
			});

			const inputCurrency = await Currency.findOne({
				where: {
					id: body.offerData.input_currency_id,
					type: 'crypto',
				},
			});

			const targetCurrency = await Currency.findOne({
				where: {
					id: body.offerData.target_currency_id,
					type: 'fiat',
				},
			});

			const depositCurrency = await Currency.findOne({
				where: {
					id: body.offerData.deposit_currency_id,
					type: 'deposit',
				},
			});

			if (!inputCurrency || !targetCurrency) {
				isFull = false;
			}

			if (
				!depositCurrency &&
				parseInt(body.offerData.deposit_currency_id, 10) !== ZanoCurrencyID?.id
			) {
				isFull = false;
			}

			if (!isFull) return { success: false, data: 'Invalid offer data' };

			const offerStatus = await this.checkOfferAccess(body.offerData.number, userRow.id);

			if (offerStatus === 'No offer') {
				let offerNumber: string;

				// eslint-disable-next-line no-constant-condition
				while (true) {
					offerNumber = generateOrderNumber(20);
					if (!(await this.getOfferRow(offerNumber))) break;
				}

				await Offer.create({
					number: offerNumber,
					price: body.offerData.price,
					min: body.offerData.min,
					max: body.offerData.max,
					deposit_seller: body.offerData.deposit_seller,
					deposit_buyer: body.offerData.deposit_buyer,
					user_id: userRow.id,
					timestamp: Date.now(),
					type: body.offerData.type === 'buy' ? 'buy' : 'sell',
					comment: body.offerData.comment || '',
					input_currency_id: body.offerData.input_currency_id,
					target_currency_id: body.offerData.target_currency_id,
					offer_status: 'default',
					deposit_currency_id: body.offerData.deposit_currency_id,
				});

				return { success: true };
			}

			return { success: false, data: 'Forbidden' };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async delete(body: DeleteBody) {
		try {
			const userRow = await userModel.getUserRow(body.userData.address);
			if (!userRow) return { success: false, data: 'User not registered' };

			const offerRow = await this.getOfferRow(body.offerData.number);

			if (
				!offerRow ||
				offerRow.offer_status === 'hidden' ||
				offerRow.offer_status === 'finished' ||
				offerRow.user_id !== userRow.id
			) {
				return { success: false, data: 'Offer can not be deleted' };
			}

			if (offerRow.offer_status === 'default') {
				await Offer.destroy({
					where: {
						number: body.offerData.number,
					},
				});
			}

			if (offerRow.offer_status === 'process') {
				await Offer.update(
					{
						offer_status: 'hidden',
					},
					{
						where: {
							number: body.offerData.number,
						},
					},
				);
			}

			return { success: true };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async getPage(pageData: PageData) {
		try {
			const whereConditions = {
				[Op.or]: [{ offer_status: 'default' }, { offer_status: 'process' }],
				type: pageData.type,
				input_currency_id: pageData.input_currency_id
					? pageData.input_currency_id
					: { [Op.gt]: 0 },
				target_currency_id: pageData.target_currency_id
					? pageData.target_currency_id
					: { [Op.gt]: 0 },
				price:
					// eslint-disable-next-line no-self-compare
					pageData.price || 0 > 0
						? { [Op.lte]: pageData.price }
						: { [Op.gt]: pageData.price },
			};

			const count = await Offer.count({
				where: whereConditions,
			});

			const pagesCount = Math.ceil(count / 15);

			const OffersWhereConditions = {
				[Op.or]: [{ offer_status: 'default' }, { offer_status: 'process' }],
				type: pageData.type,
				input_currency_id: pageData.input_currency_id
					? pageData.input_currency_id
					: { [Op.gt]: 0 },
				target_currency_id: pageData.target_currency_id
					? pageData.target_currency_id
					: { [Op.gt]: 0 },
				price:
					// eslint-disable-next-line no-self-compare
					pageData.price || 0 > 0
						? { [Op.lte]: pageData.price }
						: { [Op.gt]: pageData.price },
			};

			const orderCondition = ['price', pageData.priceDescending ? 'DESC' : 'ASC'];

			const offers = await Offer.findAll({
				where: OffersWhereConditions,

				order: [
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					orderCondition,
				],
				limit: 15,
				offset: (pageData.page - 1) * 15,
			});

			const offersWithUsers = [];

			for (const offer of offers) {
				const user = await User.findOne({
					where: {
						id: offer.user_id,
					},
				});

				const inputCurrency = await configModel.getCurrencyRow(offer.input_currency_id);
				const targetCurrency = await configModel.getCurrencyRow(offer.target_currency_id);
				const depositCurrency = await configModel.getCurrencyRow(offer.deposit_currency_id);
				offersWithUsers.push({
					...offer?.toJSON(),
					...user?.toJSON(),
					input_currency: inputCurrency?.toJSON(),
					target_currency: targetCurrency?.toJSON(),
					deposit_currency: depositCurrency?.toJSON(),
				});
			}

			return { success: true, data: { pages: pagesCount, offers: offersWithUsers } };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async getStats() {
		async function getVolume(timestamp: number) {
			const timestampThreshold = Date.now() - timestamp;

			const result = await Offer.sum('price', {
				where: {
					timestamp: {
						[Op.gt]: timestampThreshold,
					},
				},
			});

			const totalSum = result || 0;

			return totalSum;
		}

		const count = await Offer.count({
			where: {
				offer_status: 'default',
			},
		});

		return {
			success: true,
			data: {
				opened: count,
				volume_24: await getVolume(86400000),
				volume_7: await getVolume(604800000),
				volume_30: await getVolume(2592000000),
			},
		};
	}
}

const offersModel = new OffersModel();

export default offersModel;
