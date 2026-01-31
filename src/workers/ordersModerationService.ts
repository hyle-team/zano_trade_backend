import Order from '@/schemes/Order';
import { Op } from 'sequelize';

const CHECKING_INTERVAL = 60 * 60 * 1000; // 1 hr
const ORDER_EXPIRATION_TIME = 30 * 24 * 60 * 60 * 1000; // 30 days

class OrdersModerationService {
	public async run() {
		/* eslint-disable no-constant-condition */
		while (true) {
			await this.handleOrdersExpirations();
			console.log(
				`[${new Date()}] Orders moderation check is done. Next check in ${CHECKING_INTERVAL / 1000} sec.`,
			);

			await new Promise((resolve) => setTimeout(resolve, CHECKING_INTERVAL));
		}
		/* eslint-enable no-constant-condition */
	}

	private async handleOrdersExpirations() {
		const now = +Date.now();

		const ordersToExpire = await Order.findAll({
			where: {
				updatedAt: {
					[Op.lte]: new Date(now - ORDER_EXPIRATION_TIME),
				},
				status: 'active',
			},
		});

		const idsToExpire = ordersToExpire.map((order) => order.id);

		await Order.destroy({
			where: {
				id: idsToExpire,
			},
		});

		if (idsToExpire.length > 0) {
			console.log(
				`[${new Date()}] Expired orders handled. Expired orders IDs: ${idsToExpire.join(', ')}`,
			);
		}
	}
}

const ordersModerationService = new OrdersModerationService();

export default ordersModerationService;
