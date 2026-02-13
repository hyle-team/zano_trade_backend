import { body } from 'express-validator';
import { NON_NEGATIVE_REAL_NUMBER_REGEX } from 'shared/constants';
import UserData from '../../common/UserData';

export enum CreateOrderType {
	// eslint-disable-next-line no-unused-vars
	BUY = 'buy',
	// eslint-disable-next-line no-unused-vars
	SELL = 'sell',
}

export enum CreateOrderSide {
	// eslint-disable-next-line no-unused-vars
	LIMIT = 'limit',
	// eslint-disable-next-line no-unused-vars
	MARKET = 'market',
}

interface CreateOrderData {
	type: CreateOrderType;
	side: CreateOrderSide;
	price: string;
	amount: string;
	pairId: string;
}

interface CreateOrderBody {
	userData: UserData;
	orderData: CreateOrderData;
}

export const createOrderValidator = [
	body('orderData').isObject().withMessage('orderData must be an object'),
	body('orderData.type')
		.isIn(Object.values(CreateOrderType))
		.withMessage(`Invalid orderData.type value`),
	body('orderData.side')
		.isIn(Object.values(CreateOrderSide))
		.withMessage(`Invalid orderData.side value`),
	body('orderData.price')
		.isString()
		.matches(NON_NEGATIVE_REAL_NUMBER_REGEX)
		.withMessage('orderData.price must be a positive decimal string'),
	body('orderData.amount')
		.isString()
		.matches(NON_NEGATIVE_REAL_NUMBER_REGEX)
		.withMessage('orderData.amount must be a positive decimal string'),
	body('orderData.pairId').isString().withMessage('orderData.pairId must be a string'),
];

export default CreateOrderBody;
