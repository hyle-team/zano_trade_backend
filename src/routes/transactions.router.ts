import express from 'express';
import { getAllTransactionsByAddressValidator } from '@/interfaces/bodies/exchange-transactions/GetAllTransactionsByAddressBody.js';
import { getAllTransactionsConfirmedByAddressValidator } from '@/interfaces/bodies/exchange-transactions/GetAllTransactionsConfirmedByAddressBody.js';
import transactionsController from '../controllers/transactions.controller.js';
import middleware from '../middleware/middleware.js';

const transactionsRouter = express.Router();

transactionsRouter.use(
	[
		'/transactions/confirm',
		'/transactions/get-active-tx-by-orders-ids',
		'/transactions/get-my-transactions',
		'/transactions/get-my-pending',
		'/transactions/cancel',
	],
	middleware.authGuard,
);

transactionsRouter.use(
	['/transactions/get-all-by-address', '/transactions/get-all-transactions-confirmed-by-address'],
	middleware.narrowRateLimit,
);

transactionsRouter.use(
	['/transactions/get-all-by-address', '/transactions/get-all-transactions-confirmed-by-address'],
	middleware.integrationKeyAuthGuard,
);

transactionsRouter.post('/transactions/confirm', transactionsController.confirmTransaction);
transactionsRouter.post(
	'/transactions/get-active-tx-by-orders-ids',
	transactionsController.getActiveTxByOrdersIds,
);

transactionsRouter.post(
	'/transactions/get-my-transactions',
	transactionsController.getMyTransactions,
);

transactionsRouter.post(
	'/transactions/get-my-pending',
	transactionsController.getPendingTransactions,
);

transactionsRouter.post('/transactions/cancel', transactionsController.cancelTransaction);

transactionsRouter.patch(
	'/transactions/get-all-by-address',
	middleware.expressValidator(getAllTransactionsByAddressValidator),
	transactionsController.getAllTransactionsByAddress.bind(transactionsController),
);

transactionsRouter.patch(
	'/transactions/get-all-transactions-confirmed-by-address',
	middleware.expressValidator(getAllTransactionsConfirmedByAddressValidator),
	transactionsController.getAllTransactionsConfirmedByAddress.bind(transactionsController),
);

export default transactionsRouter;
