import { Request, Response } from 'express';
import Transaction from '@/schemes/Transaction.js';
import GetMyTransactionsBody from '@/interfaces/bodies/exchange-transactions/GetMyTransactionsBody.js';
import { Op } from 'sequelize';
import {
	OrderWithAllTransactions,
	OrderWithBuyOrders,
} from '@/interfaces/database/modifiedRequests';
import exchangeModel from '../models/ExchangeTransactions.js';
import ConfirmTransactionBody from '../interfaces/bodies/exchange-transactions/ConfirmTransactionBody.js';
import GetActiveTxByOrdersIdsBody from '../interfaces/bodies/exchange-transactions/GetActiveTxByOrdersIdsBody.js';
import Order from '../schemes/Order.js';

class TransactionsController {
	async confirmTransaction(req: Request, res: Response) {
		try {
			if (!(req.body as ConfirmTransactionBody).transactionId) {
				return res.status(400).json({ success: false, data: 'Invalid transaction data' });
			}

			const result = await exchangeModel.confirmTransaction(
				req.body as ConfirmTransactionBody,
			);

			if (
				result.data === 'Transaction is not pending' ||
				result.data === 'You are not a participant of this transaction'
			) {
				return res.status(400).send(result);
			}

			if (result.data === 'Internal error') {
				return res.status(500).send(result);
			}

			return res.status(200).send(result);
		} catch (err) {
			console.log(err);
			return { success: false, data: 'Internal error' };
		}
	}

	async getActiveTxByOrdersIds(req: Request, res: Response) {
		try {
			const body = req.body as GetActiveTxByOrdersIdsBody;
			const { firstOrderId, secondOrderId, userData } = body;

			const userRow = await Order.findOne({ where: { address: userData.address } });

			if (!userRow) {
				throw new Error('JWT token of non-existent user');
			}

			const firstOrderRow = await Order.findOne({
				where: { id: firstOrderId, user_id: userRow.id },
			});
			const secondOrderRow = await Order.findOne({
				where: { id: secondOrderId, user_id: userRow.id },
			});

			if (!firstOrderRow && !secondOrderRow) {
				return res
					.status(400)
					.send({ success: false, data: 'None of the orders belong to this user' });
			}

			const tx = await exchangeModel.getActiveTxByOrdersIds(firstOrderId, secondOrderId);
			if (!tx) {
				return res.status(400).send({ success: false, data: 'Invalid order data' });
			}

			return res.status(200).send({ success: true, data: tx });
		} catch (err) {
			console.log(err);
			return res.status(500).send({ success: false, data: 'Internal error' });
		}
	}

	async getMyTransactions(req: Request, res: Response) {
		try {
			const {userData} = req.body;
			const body = req.body as GetMyTransactionsBody;
			const { from, to } = body;

			const parsedFrom = +new Date(from);
			const parsedTo = +new Date(to);

			const ordersWithTransactions = (await Order.findAll({
				where: { user_id: userData.id },
				include: [
					{
						model: Transaction,
						as: 'buy_orders',
						where: {
							createdAt: {
								[Op.between]: [parsedFrom, parsedTo],
							},
							status: 'confirmed',
						},
						required: true,
					},
					{
						model: Transaction,
						as: 'sell_orders',
						where: {
							createdAt: {
								[Op.between]: [parsedFrom, parsedTo],
							},
							status: 'confirmed',
						},
						required: true,
					},
				],
			})) as OrderWithAllTransactions[];

			const txs = ordersWithTransactions.map((order) => [
				...order.buy_orders,
				...order.sell_orders,
			]);

			const flatTxs = txs
				.flat()
				.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

			res.send({
				success: true,
				data: flatTxs.map((tx) => ({
					id: tx.id,
					buy_order_id: tx.buy_order_id,
					sell_order_id: tx.sell_order_id,
					amount: tx.amount,
					timestamp: tx.timestamp,
					status: tx.status,
					creator: tx.creator,
					hex_raw_proposal: tx.hex_raw_proposal,
					createdAt: tx.createdAt,
					updatedAt: tx.updatedAt,
				})),
			});
		} catch (err) {
			console.log(err);
			return res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}
}

const transactionsController = new TransactionsController();

export default transactionsController;
