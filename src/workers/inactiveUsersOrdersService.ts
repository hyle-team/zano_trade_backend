import { Op } from 'sequelize';
import { Server } from 'socket.io';
import { env } from '@/config/env.js';
import dexModel from '@/models/Dex';
import ordersModel from '@/models/Orders';
import userActivityModel from '@/models/UserActivity';
import Order, { OrderStatus } from '@/schemes/Order';
import User from '@/schemes/User';

const CHECKING_INTERVAL = 10 * 60 * 1000;
const ONLINE_ROOM_PREFIX = 'dex-notifications';

class InactiveUsersOrdersService {
	private get expirationMs() {
		return env.INACTIVE_USER_ORDERS_EXPIRATION_HOURS * 60 * 60 * 1000;
	}

	public async run(io: Server) {
		console.log(
			`Inactive users orders service is running. Orders expire after ${env.INACTIVE_USER_ORDERS_EXPIRATION_HOURS} h of user inactivity.`,
		);

		/* eslint-disable no-constant-condition */
		while (true) {
			try {
				await this.touchOnlineUsers(io);
				await this.expireInactiveUsersOrders();
			} catch (error) {
				console.log(
					`[${new Date()}] Error while expiring inactive users orders. Continuing on next iteration. Error:`,
				);
				console.error(error);
			}

			await new Promise((resolve) => setTimeout(resolve, CHECKING_INTERVAL));
		}
		/* eslint-enable no-constant-condition */
	}

	private async touchOnlineUsers(io: Server) {
		const onlineAddresses = [...io.sockets.adapter.rooms.keys()]
			.filter((room) => room.startsWith(ONLINE_ROOM_PREFIX))
			.map((room) => room.slice(ONLINE_ROOM_PREFIX.length));

		await userActivityModel.touchMany(onlineAddresses, { force: true });
	}

	private async expireInactiveUsersOrders() {
		const cutoff = new Date(Date.now() - this.expirationMs);

		const ordersToExpire = await Order.findAll({
			attributes: ['id', 'user_id'],
			where: { status: OrderStatus.ACTIVE },
			include: [
				{
					model: User,
					as: 'user',
					required: true,
					attributes: ['address'],
					where: {
						[Op.or]: [
							{ last_seen_at: { [Op.lt]: cutoff } },
							{ last_seen_at: null, updatedAt: { [Op.lt]: cutoff } },
						],
					},
				},
			],
		});

		const expiredIds: number[] = [];

		const candidates = (ordersToExpire as (Order & { user?: User })[]).filter(
			(order) => !dexModel.isBotActive(order.id) && !!order.user?.address,
		);

		for (const order of candidates) {
			const result = await ordersModel.cancelOrder({
				orderId: String(order.id),
				userData: { address: order.user!.address },
			});

			if (result.success) expiredIds.push(order.id);
		}

		if (expiredIds.length > 0) {
			console.log(
				`[${new Date()}] Inactive users orders expired. Orders IDs: ${expiredIds.join(', ')}`,
			);
		}
	}
}

const inactiveUsersOrdersService = new InactiveUsersOrdersService();

export default inactiveUsersOrdersService;
