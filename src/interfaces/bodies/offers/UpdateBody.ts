import { body } from 'express-validator';
import { isNonNegativeDecimalString } from '@/methods/isNonNegativeDecimalString';

import OfferType from '../../common/OfferType';
import UserData from '../../common/UserData';

interface OfferData {
	price: string;
	min: string;
	max: string;
	deposit_seller: string;
	deposit_buyer: string;
	type: OfferType;
	comment?: string;
	input_currency_id: string;
	target_currency_id: string;
	deposit_currency_id: string;
	number?: string;
}

interface UpdateBody {
	userData: UserData;
	offerData: OfferData;
}

export const updateValidator = [
	body('offerData.price').isString().custom(isNonNegativeDecimalString),
	body('offerData.min').isString().custom(isNonNegativeDecimalString),
	body('offerData.max').isString().custom(isNonNegativeDecimalString),
	body('offerData.deposit_seller').isString().custom(isNonNegativeDecimalString),
	body('offerData.deposit_buyer').isString().custom(isNonNegativeDecimalString),
	body('offerData.type')
		.isString()
		.isIn(['buy', 'sell'] satisfies OfferType[]),
	body('offerData.comment').optional().isString(),
	body('offerData.input_currency_id').isString().isInt(),
	body('offerData.target_currency_id').isString().isInt(),
	body('offerData.deposit_currency_id').isString().isInt(),
	body('offerData.number').optional().isString().isInt(),
];

export default UpdateBody;
