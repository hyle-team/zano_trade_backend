import { body } from 'express-validator';

import { isFiniteNumberValidator } from '@/methods/isFiniteNumberValidator';
import { isNonNegativeDecimalString } from '@/methods/isNonNegativeDecimalString';
import OfferType from '../../common/OfferType';

interface PageData {
	type: OfferType;
	page: number;
	input_currency_id?: string;
	target_currency_id?: string;
	price?: string;
	priceDescending?: boolean;
}

interface GetPageBody {
	data: PageData;
}

export const getPageValidator = [
	body('data.type')
		.isString()
		.isIn(['buy', 'sell'] satisfies OfferType[]),
	body('data.page').custom(isFiniteNumberValidator).isInt(),
	body('data.input_currency_id').optional().isString().isInt(),
	body('data.target_currency_id').optional().isString().isInt(),
	body('data.price').optional().custom(isNonNegativeDecimalString),
	body('data.priceDescending').optional().isBoolean(),
];

export default GetPageBody;

export { type PageData };
