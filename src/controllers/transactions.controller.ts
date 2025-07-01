import { Request, Response } from 'express';
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
}

const transactionsController = new TransactionsController();

export default transactionsController;
