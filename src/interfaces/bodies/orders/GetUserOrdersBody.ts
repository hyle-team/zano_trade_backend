import UserData from '@/interfaces/common/UserData';
import { body } from 'express-validator';

export enum GetUserOrdersBodyStatus {
	// eslint-disable-next-line no-unused-vars
	ACTIVE = 'active',
	// eslint-disable-next-line no-unused-vars
	FINISHED = 'finished',
}

export enum GetUserOrdersBodyType {
	// eslint-disable-next-line no-unused-vars
	BUY = 'buy',
	// eslint-disable-next-line no-unused-vars
	SELL = 'sell',
}

interface GetUserOrdersBody {
	userData: UserData;

	limit: number;
	offset: number;
	filterInfo: {
		pairId?: number;
		status?: GetUserOrdersBodyStatus;
		type?: GetUserOrdersBodyType;
		date?: {
			// UNIX timestamps in milliseconds
			from: number;
			to: number;
		};
	};
}

export const getUserOrdersValidator = [
	body('limit')
		.isInt({ min: 1, max: 1000 })
		.withMessage('limit must be a positive integer within certain range'),
	body('offset').isInt({ min: 0 }).withMessage('offset must be a non-negative integer'),
	body('filterInfo').isObject().withMessage('filterInfo must be an object'),
	body('filterInfo.pairId')
		.optional()
		.isInt({ min: 0 })
		.withMessage('filterInfo.pairId must be a non-negative integer'),
	body('filterInfo.status')
		.optional()
		.isIn(Object.values(GetUserOrdersBodyStatus))
		.withMessage(`Invalid filterInfo.status value`),
	body('filterInfo.type')
		.optional()
		.isIn(Object.values(GetUserOrdersBodyType))
		.withMessage(`Invalid filterInfo.type value`),
	body('filterInfo.date').optional().isObject().withMessage('filterInfo.date must be an object'),
	body('filterInfo.date.from')
		.if(body('filterInfo.date').isObject())
		.isInt({ min: 0 })
		.withMessage(
			'filterInfo.date.from must be a non-negative integer representing a UNIX timestamp in milliseconds',
		),
	body('filterInfo.date.to')
		.if(body('filterInfo.date').isObject())
		.isInt({ min: 0 })
		.withMessage(
			'filterInfo.date.to must be a non-negative integer representing a UNIX timestamp in milliseconds',
		),
];

export default GetUserOrdersBody;
