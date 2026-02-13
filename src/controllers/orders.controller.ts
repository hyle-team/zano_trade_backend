import { Request, Response } from 'express';
import Decimal from 'decimal.js';

import CreateOrderRes, { CreateOrderErrorCode } from '@/interfaces/responses/orders/CreateOrderRes';
import candlesModel from '../models/Candles';
import ordersModel from '../models/Orders';
import CreateOrderBody from '../interfaces/bodies/orders/CreateOrderBody';
import GetUserOrdersPageBody from '../interfaces/bodies/orders/GetUserOrdersPageBody';
import GetUserOrdersBody from '../interfaces/bodies/orders/GetUserOrdersBody';
import CancelOrderBody from '../interfaces/bodies/orders/CancelOrderBody';
import GetCandlesBody from '../interfaces/bodies/orders/GetCandlesBody';
import GetChartOrdersBody from '../interfaces/bodies/orders/GetChartOrdersBody';
import ApplyOrderBody from '../interfaces/bodies/orders/ApplyOrderBody';
import userModel from '../models/User';
import UserData from '../interfaces/common/UserData';
import Pair from '../schemes/Pair';
import Currency from '../schemes/Currency';
import { validateTokensInput } from '../../shared/utils';

class OrdersController {
	static CURRENCY_DECIMAL_POINT_NOT_FOUND_ERROR_MSG = 'CURRENCY_DECIMAL_POINT_MISSING';
	async createOrder(req: Request, res: Response<CreateOrderRes>) {
		try {
			const body = req.body as CreateOrderBody;
			const { orderData } = body;
			const { price, amount, pairId } = orderData;

			const priceDecimal = new Decimal(price);
			const amountDecimal = new Decimal(amount);

			const pair = await Pair.findByPk(pairId);

			const firstCurrency = await Currency.findByPk(pair?.first_currency_id);

			const secondCurrency = await Currency.findByPk(pair?.second_currency_id);

			if (!pair || !firstCurrency || !secondCurrency) {
				return res.status(400).send({
					success: false,
					data: CreateOrderErrorCode.INVALID_ORDER_DATA,
				});
			}

			const firstCurrencyDP = firstCurrency.asset_info?.decimal_point;
			const secondCurrencyDP = secondCurrency.asset_info?.decimal_point;

			if (firstCurrencyDP === undefined || secondCurrencyDP === undefined) {
				throw new Error(OrdersController.CURRENCY_DECIMAL_POINT_NOT_FOUND_ERROR_MSG);
			}

			const totalDecimal = priceDecimal.mul(amountDecimal);
			const total = totalDecimal.toFixed();

			const isPriceValid = validateTokensInput(price, secondCurrencyDP).valid;
			const isAmountValid = validateTokensInput(amount, firstCurrencyDP).valid;
			const isTotalValid = validateTokensInput(total, secondCurrencyDP).valid;

			const areAmountsValid = isPriceValid && isAmountValid && isTotalValid;

			if (!areAmountsValid) {
				return res.status(400).send({
					success: false,
					data: CreateOrderErrorCode.INVALID_ORDER_DATA,
				});
			}

			const result = await ordersModel.createOrder(req.body);

			if (result.data === 'Invalid order data')
				return res.status(400).send({
					success: false,
					data: CreateOrderErrorCode.INVALID_ORDER_DATA,
				});

			if (result.data === 'Same order')
				return res.status(400).send({
					success: false,
					data: CreateOrderErrorCode.SAME_ORDER,
				});

			if (result.data === 'Internal error') {
				throw new Error('orderModel.createOrder returned Internal error');
			}

			if (typeof result.data === 'string') {
				throw new Error('Invalid orderModel.createOrder result');
			}

			const createdOrder = result.data;

			res.status(200).send({
				success: true,
				data: {
					id: createdOrder.id,
					type: createdOrder.type,
					timestamp: createdOrder.timestamp,
					side: createdOrder.side,
					price: createdOrder.price,
					amount: createdOrder.amount,
					total: createdOrder.total,
					pair_id: createdOrder.pairId,
					user_id: createdOrder.userId,
					status: createdOrder.status,
					left: createdOrder.left,
					hasNotification: createdOrder.hasNotification,
					immediateMatch: createdOrder.immediateMatch,
				},
			});
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: CreateOrderErrorCode.UNHANDLED_ERROR });
		}
	}

	async getOrdersPage(req: Request, res: Response) {
		try {
			if (!req.body.pairId)
				return res.status(400).send({ success: false, data: 'Invalid pair data' });

			const result = await ordersModel.getOrdersPage(req.body.pairId);

			if (result.data === 'Invalid pair data') return res.status(400).send(result);

			if (result.data === 'Internal error') return res.status(500).send(result);

			res.status(200).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}

	async getUserOrdersPage(req: Request, res: Response) {
		try {
			if (!(req.body as GetUserOrdersPageBody).pairId)
				return res.status(400).send({ success: false, data: 'Invalid pair data' });

			const result = await ordersModel.getUserOrdersPage(req.body as GetUserOrdersPageBody);

			if (result.data === 'Invalid pair data') return res.status(400).send(result);

			if (result.data === 'Internal error') return res.status(500).send(result);

			const userAddress = (req.body.userData as UserData)?.address;

			if (userAddress) {
				await userModel.resetNotificationsForPair(
					(req.body.userData as UserData)?.address,
					req.body.pairId,
				);
			}

			res.status(200).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}

	async getUserOrders(req: Request, res: Response) {
		try {
			await userModel.resetExchangeNotificationsAmount(
				(req.body.userData as UserData).address,
			);
			const result = await ordersModel.getUserOrders(req.body as GetUserOrdersBody);

			if (result.data === 'Internal error') return res.status(500).send(result);

			res.status(200).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}

	async cancelOrder(req: Request, res: Response) {
		try {
			if (!(req.body as CancelOrderBody).orderId)
				return res.status(400).send({ success: false, data: 'Invalid order data' });

			const result = await ordersModel.cancelOrder(req.body as CancelOrderBody);

			if (result.data === 'Invalid order data') return res.status(400).send(result);

			if (result.data === 'Internal error') return res.status(500).send(result);

			res.status(200).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}

	async getCandles(req: Request, res: Response) {
		try {
			const { body }: { body: GetCandlesBody } = req;

			if (!body.pairId || !body.period)
				return res.status(400).send({ success: false, data: 'Invalid pair data' });

			const result = await candlesModel.getCandles(body.pairId, body.period);

			if (result.data === 'Invalid pair data') return res.status(400).send(result);

			if (result.data === 'Internal error') return res.status(500).send(result);

			return res.status(200).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}

	async getChartOrders(req: Request, res: Response) {
		try {
			const { body }: { body: GetChartOrdersBody } = req;

			if (!body.pairId)
				return res.status(400).send({ success: false, data: 'Invalid pair data' });

			const result = await ordersModel.getChartOrders(body.pairId);

			if (result.data === 'Internal error') return res.status(500).send(result);

			res.status(200).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}

	async getPairStats(req: Request, res: Response) {
		try {
			const { body }: { body: GetChartOrdersBody } = req;

			if (!body.pairId)
				return res.status(400).send({ success: false, data: 'Invalid pair data' });

			const result = await ordersModel.getPairStats(body.pairId);

			if (result.data === 'Internal error') return res.status(500).send(result);

			res.status(200).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}

	async applyOrder(req: Request, res: Response) {
		try {
			const { orderData } = req.body as ApplyOrderBody;

			const isFull = orderData && orderData?.id && orderData?.connected_order_id;

			if (!isFull)
				return res.status(400).send({ success: false, data: 'Invalid order data' });

			const result = await ordersModel.applyOrder(req.body);

			if (result.data === 'Invalid order data') return res.status(400).send(result);

			if (result.data === 'Internal error') return res.status(500).send(result);

			res.status(200).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}

	async getTrades(req: Request, res: Response) {
		try {
			const { pairId } = req.body;

			if (!pairId) {
				return res.status(400).send({ success: false, data: 'Invalid pair data' });
			}

			const result = await ordersModel.getTrades(Number(pairId));

			if (result.data === 'Invalid pair data') return res.status(400).send(result);

			if (result.data === 'Internal error') return res.status(500).send(result);

			res.status(200).send(result);
		} catch (err) {
			console.log(err);
			res.status(500).send({ success: false, data: 'Unhandled error' });
		}
	}
}

const ordersController = new OrdersController();

export default ordersController;
