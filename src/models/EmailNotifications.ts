import { env } from '@/config/env.js';
import mailerHelper from '@/helpers/Mailer.helper.js';
import Order from '../schemes/Order';
import Pair from '../schemes/Pair';
import User from '../schemes/User';
import Currency from '../schemes/Currency';

const MATCH_EMAIL_THROTTLE_MS = 15 * 60 * 1000;

type PairWithCurrencies = Pair & { first_currency?: Currency; second_currency?: Currency };

function escapeHtml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

class EmailNotificationsModel {
	private lastMatchEmailAt = new Map<number, number>();

	private async loadContext(orderId: number) {
		const order = await Order.findOne({
			where: { id: orderId, status: 'active', email_notifications: true },
		});
		if (!order) return null;

		const user = await User.unscoped().findByPk(order.user_id, {
			attributes: ['alias', 'email'],
		});
		if (!user?.email) return null;

		const pair = (await Pair.findByPk(order.pair_id, {
			include: [
				{ model: Currency, as: 'first_currency' },
				{ model: Currency, as: 'second_currency' },
			],
		})) as PairWithCurrencies | null;

		return { order, user, pair };
	}

	private buildOrderUrl(order: Order) {
		const url = new URL('/dex', env.FRONTEND_URL);
		url.searchParams.set('pair', String(order.pair_id));
		url.searchParams.set('order', String(order.id));
		return url.toString();
	}

	private async send(
		orderId: number,
		build: (ctx: { ticker: string; quote: string; side: string }) => {
			subject: string;
			headline: string;
			action: string;
		},
	) {
		const ctx = await this.loadContext(orderId);
		if (!ctx) return;

		const { order, user, pair } = ctx;
		const ticker = pair?.first_currency?.name ?? 'asset';
		const quote = pair?.second_currency?.name ?? 'ZANO';
		const side = order.type === 'buy' ? 'Buy' : 'Sell';
		const { subject, headline, action } = build({ ticker, quote, side });
		const url = this.buildOrderUrl(order);
		const details = `${side} ${order.left} ${ticker} at ${order.price} ${quote}`;

		const text = [
			`Hi @${user.alias},`,
			'',
			headline,
			`Order #${order.id}: ${details}`,
			'',
			`${action}: ${url}`,
			'',
			'You receive this email because you enabled email notifications for this order on Zano Trade.',
		].join('\n');

		const html = `
			<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#0c0c3a">
				<p>Hi @${escapeHtml(user.alias)},</p>
				<p>${escapeHtml(headline)}</p>
				<p style="color:#5b5b7a">Order #${order.id}: ${escapeHtml(details)}</p>
				<p>
					<a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 20px;border-radius:12px;background:#1f8feb;color:#fff;text-decoration:none;font-weight:600">
						${escapeHtml(action)}
					</a>
				</p>
				<p style="font-size:12px;color:#8a8aa8">
					You receive this email because you enabled email notifications for this order on Zano Trade.
				</p>
			</div>
		`;

		await mailerHelper.send({ to: user.email as string, subject, text, html });
	}

	private pruneThrottle(now: number) {
		this.lastMatchEmailAt.forEach((sentAt, orderId) => {
			if (now - sentAt >= MATCH_EMAIL_THROTTLE_MS) this.lastMatchEmailAt.delete(orderId);
		});
	}

	async notifyMatchFound(orderIds: number[]) {
		const now = Date.now();
		this.pruneThrottle(now);

		const dueIds = orderIds.filter((id) => {
			const last = this.lastMatchEmailAt.get(id);
			return last === undefined || now - last >= MATCH_EMAIL_THROTTLE_MS;
		});

		for (const orderId of dueIds) {
			this.lastMatchEmailAt.set(orderId, now);

			await this.send(orderId, ({ ticker }) => ({
				subject: `Zano Trade: a match was found for your ${ticker} order`,
				headline:
					'A counter order is now available for your order. Apply it to start the swap.',
				action: 'Open your order',
			}));
		}
	}

	async notifyProposalReceived(orderId: number) {
		await this.send(orderId, ({ ticker }) => ({
			subject: `Zano Trade: you received a swap proposal for ${ticker}`,
			headline: 'A counterparty sent you a swap proposal. Accept it to complete the swap.',
			action: 'Review the proposal',
		}));
	}

	runInBackground(task: Promise<unknown>) {
		task.catch((error) => console.error('[email-notifications] Failed to notify:', error));
	}
}

const emailNotificationsModel = new EmailNotificationsModel();

export default emailNotificationsModel;
