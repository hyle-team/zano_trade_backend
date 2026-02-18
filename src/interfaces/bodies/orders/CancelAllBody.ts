import UserData from '@/interfaces/common/UserData';
import { body } from 'express-validator';

export enum CancelAllBodyOrderType {
	// eslint-disable-next-line no-unused-vars
	BUY = 'buy',
	// eslint-disable-next-line no-unused-vars
	SELL = 'sell',
}

interface CancelAllBody {
	userData: UserData;

	filterInfo: {
		pairId?: number;
		type?: CancelAllBodyOrderType;
		date?: {
			// UNIX timestamps in milliseconds
			from: number;
			to: number;
		};
	};
}

export const cancelAllValidator = [
	body('filterInfo').isObject().withMessage('filterInfo must be an object'),
	body('filterInfo.pairId')
		.optional()
		.isInt({ min: 0 })
		.withMessage('filterInfo.pairId must be a non-negative integer'),
	body('filterInfo.type')
		.optional()
		.isIn(Object.values(CancelAllBodyOrderType))
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

export default CancelAllBody;
