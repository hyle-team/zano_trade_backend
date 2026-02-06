import { Op } from 'sequelize';
import Offer from '../schemes/Offer';
import GetUserBody from '../interfaces/bodies/user/GetUserBody';
import SetFavouriteCurrsBody from '../interfaces/bodies/user/SetFavouriteCurrsBody';
import UserData from '../interfaces/common/UserData';
import chatsModel from './Chats';
import configModel from './Config';
import User from '../schemes/User';
import Order from '../schemes/Order';
import Pair from '../schemes/Pair';

class UserModel {
	async getUserRow(address: string) {
		const selected = User.findOne({ where: { address } });
		return selected;
	}

	async add(userData: UserData) {
		try {
			const userRow = await this.getUserRow(userData.address);

			// const oldAddressOfCurrentAlias = await User.findOne({
			// 	where: { alias: userData.alias },
			// });

			// if (oldAddressOfCurrentAlias) {
			// 	await User.update(
			// 		{ address: userData.address },
			// 		{ where: { alias: userData.alias } },
			// 	);
			// 	return true;
			// }

			if (userRow) {
				if (userData.alias !== userRow.alias) {
					await User.update(
						{ alias: userData.alias },
						{ where: { address: userData.address } },
					);
				}

				return true;
			}

			await User.create({ alias: userData.alias, address: userData.address });

			return true;
		} catch (err) {
			console.log(err);
			return false;
		}
	}

	async getUser(userData: GetUserBody) {
		try {
			const userRow = await this.getUserRow(userData.address);
			if (!userRow) return { success: false, data: 'User not registered' };

			const offers = await Offer.findAll({
				where: { user_id: userRow.id, offer_status: { [Op.not]: ['finished', 'hidden'] } },
			});

			const offersWithCurrs = [];

			for (const offer of offers) {
				const inputCurrency = await configModel.getCurrencyRow(offer.input_currency_id);
				const targetCurrency = await configModel.getCurrencyRow(offer.target_currency_id);
				const depositCurrency = await configModel.getCurrencyRow(offer.deposit_currency_id);

				const creatorRow = await User.findByPk(offer.user_id);

				if (creatorRow) {
					offersWithCurrs.push({
						...(offer?.toJSON() || {}),
						input_currency: inputCurrency?.toJSON(),
						target_currency: targetCurrency?.toJSON(),
						deposit_currency: depositCurrency?.toJSON(),
						alias: creatorRow.alias,
						address: creatorRow.address,
					});
				}
			}

			const chats = await chatsModel.getAllChats({ userData });

			return {
				success: true,
				data: {
					...userRow?.toJSON(),
					offers: offersWithCurrs,
					chats: chats.data,
					exchange_notifications: (await this.getNotificationsAmount(userData)).data,
				},
			};
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async setFavouriteCurrencies(body: SetFavouriteCurrsBody) {
		try {
			const userRow = await this.getUserRow(body.userData.address);
			if (!userRow) return { success: false, data: 'User not registered' };

			await User.update(
				{ favourite_currencies: body.data },
				{ where: { address: body.userData.address } },
			);
			return { success: true };
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async resetExchangeNotificationsAmount(address: string) {
		const user = await User.findOne({
			where: {
				address,
			},
		});

		await Order.update(
			{
				hasNotification: false,
			},
			{
				where: {
					user_id: user?.id,
					hasNotification: true,
				},
			},
		);
	}

	async getNotificationsAmount(userData: GetUserBody) {
		const user = await User.findOne({
			where: {
				address: userData.address,
			},
		});

		if (!user) {
			return { success: false, data: 'User not found' };
		}

		const amount = await Order.count({
			where: {
				user_id: user.id,
				hasNotification: true,
			},
		});

		return { success: true, data: amount };
	}

	async resetNotificationsForPair(address: string, pair_id: number) {
		const user = await User.findOne({
			where: {
				address,
			},
		});

		const pair = await Pair.findOne({
			where: {
				id: pair_id,
			},
		});

		if (!user || !pair) {
			return { success: false, data: 'User or Pair not found' };
		}

		const orderToUpdate = await Order.findOne({
			where: {
				user_id: user.id,
				pair_id: pair.id,
			},
		});

		if (orderToUpdate) {
			orderToUpdate.hasNotification = false;
			await orderToUpdate.save();
		}

		// await Order.update({
		//     hasNotification: false
		// }, {
		//     where: {
		//         user_id: user.id,
		//         pair_id: pair_id,
		//     }
		// });
	}
}

const userModel = new UserModel();

export default userModel;
