import express from 'express';
import transactionsController from '../controllers/transactions.controller.js';
import middleware from '../middleware/middleware.js';

const transactionsRouter = express.Router();

transactionsRouter.use('/transactions/*', middleware.verifyToken);

transactionsRouter.post('/transactions/confirm', transactionsController.confirmTransaction);
transactionsRouter.post(
	'/transactions/get-active-tx-by-orders-ids',
	transactionsController.getActiveTxByOrdersIds,
);

export default transactionsRouter;
