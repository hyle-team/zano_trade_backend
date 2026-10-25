import { Op } from 'sequelize';
import User from '../schemes/User';

const TOUCH_THROTTLE_MS = 5 * 60 * 1000;

class UserActivityModel {
	private lastTouchedAt = new Map<string, number>();

	private shouldTouch(address: string, now: number) {
		const last = this.lastTouchedAt.get(address);
		return last === undefined || now - last >= TOUCH_THROTTLE_MS;
	}

	async touch(address: string | undefined, { force = false }: { force?: boolean } = {}) {
		if (!address) return;

		await this.touchMany([address], { force });
	}

	async touchMany(addresses: string[], { force = false }: { force?: boolean } = {}) {
		const now = Date.now();
		const toTouch = [...new Set(addresses)].filter(
			(address) => address && (force || this.shouldTouch(address, now)),
		);

		if (!toTouch.length) return;

		toTouch.forEach((address) => this.lastTouchedAt.set(address, now));

		try {
			await User.update(
				{ last_seen_at: new Date(now) },
				{ where: { address: { [Op.in]: toTouch } } },
			);
		} catch (error) {
			toTouch.forEach((address) => this.lastTouchedAt.delete(address));
			console.error('Failed to update users last activity:', error);
		}
	}

	touchInBackground(address: string | undefined, options: { force?: boolean } = {}) {
		this.touch(address, options).catch((error) => console.error(error));
	}
}

const userActivityModel = new UserActivityModel();

export default userActivityModel;
