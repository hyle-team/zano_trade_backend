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
	minPerApplyAmount: string | null;
	maxPerApplyAmount: string | null;
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
	body('orderData.minPerApplyAmount')
		.if(body('orderData.minPerApplyAmount').not().isString())
		.custom((value) => value === null)
		.withMessage('orderData.minPerApplyAmount must be a string or null')
		.if(body('orderData.minPerApplyAmount').isString())
		.isString()
		.matches(NON_NEGATIVE_REAL_NUMBER_REGEX)
		.withMessage('orderData.minPerApplyAmount must be a positive decimal string'),
	body('orderData.maxPerApplyAmount')
		.if(body('orderData.maxPerApplyAmount').not().isString())
		.custom((value) => value === null)
		.withMessage('orderData.maxPerApplyAmount must be a string or null')
		.isString()
		.matches(NON_NEGATIVE_REAL_NUMBER_REGEX)
		.withMessage('orderData.maxPerApplyAmount must be a positive decimal string'),
];

export default CreateOrderBody;
