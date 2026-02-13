import express from 'express';
import { createOrderValidator } from '@/interfaces/bodies/orders/CreateOrderBody.js';
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
ordersRouter.post('/orders/get', ordersController.getUserOrders);
ordersRouter.post('/orders/cancel', ordersController.cancelOrder);
ordersRouter.post('/orders/get-candles', ordersController.getCandles);
ordersRouter.post('/orders/get-chart-orders', ordersController.getChartOrders);
ordersRouter.post('/orders/get-pair-stats', ordersController.getPairStats);
ordersRouter.post('/orders/apply-order', ordersController.applyOrder);
ordersRouter.post('/orders/get-trades', ordersController.getTrades);

export default ordersRouter;
