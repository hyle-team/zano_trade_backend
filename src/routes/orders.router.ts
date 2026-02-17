import express from 'express';

import { createOrderValidator } from '@/interfaces/bodies/orders/CreateOrderBody.js';
import { getUserOrdersValidator } from '@/interfaces/bodies/orders/GetUserOrdersBody.js';
import { getUserOrdersAllPairsValidator } from '@/interfaces/bodies/orders/GetUserOrdersAllPairsBody.js';
import { cancelAllValidator } from '@/interfaces/bodies/orders/CancelAllBody.js';
import middleware from '../middleware/middleware.js';
import ordersController from '../controllers/orders.controller.js';

const ordersRouter = express.Router();

ordersRouter.use(
	[
		'/orders/create',
		'/orders/get-user-page',
		'/orders/get',
		'/orders/cancel',
		'/orders/apply-order',
		'/orders/get-user-orders-pairs',
	],
	middleware.verifyToken,
);

ordersRouter.post(
	'/orders/create',
	middleware.expressValidator(createOrderValidator),
	ordersController.createOrder,
);
ordersRouter.post('/orders/get-page', ordersController.getOrdersPage);
ordersRouter.post('/orders/get-user-page', ordersController.getUserOrdersPage);
ordersRouter.patch(
	'/orders/get',
	middleware.expressValidator(getUserOrdersValidator),
	ordersController.getUserOrders.bind(ordersController),
);
ordersRouter.post('/orders/cancel', ordersController.cancelOrder);
ordersRouter.post('/orders/get-candles', ordersController.getCandles);
ordersRouter.post('/orders/get-chart-orders', ordersController.getChartOrders);
ordersRouter.post('/orders/get-pair-stats', ordersController.getPairStats);
ordersRouter.post('/orders/apply-order', ordersController.applyOrder);
ordersRouter.post('/orders/get-trades', ordersController.getTrades);
ordersRouter.patch(
	'/orders/get-user-orders-pairs',
	middleware.expressValidator(getUserOrdersAllPairsValidator),
	ordersController.getUserOrdersAllPairs.bind(ordersController),
);
ordersRouter.patch(
	'/orders/cancel-all',
	middleware.expressValidator(cancelAllValidator),
	ordersController.cancelAll.bind(ordersController),
);

export default ordersRouter;
