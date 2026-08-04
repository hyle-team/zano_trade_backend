import { body } from 'express-validator';

import { isNonNegativeDecimalString } from '@/methods/isNonNegativeDecimalString';
import UserData from '../../common/UserData';

interface CreateBody {
	userData: UserData;
	number: string;
	chatData: {
		pay: string;
		receive: string;
	};
}

export const createValidator = [
	body('number').isString().isInt(),
	body('chatData.pay').isString().custom(isNonNegativeDecimalString),
	body('chatData.receive').isString().custom(isNonNegativeDecimalString),
];

export default CreateBody;
