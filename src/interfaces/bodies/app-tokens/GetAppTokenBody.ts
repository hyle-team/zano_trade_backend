import { body } from 'express-validator';

import UserData from '@/interfaces/common/UserData';

interface GetAppTokenBody {
	userData: UserData;
	publicKeyHex: string;
}

export const getAppTokenValidator = [
	body('publicKeyHex')
		.isString()
		.withMessage('publicKeyHex must be a string')
		.bail()
		.notEmpty()
		.withMessage('publicKeyHex must not be empty')
		.bail()
		.isLength({ max: 1000 })
		.withMessage('publicKeyHex must be at most 1000 characters long')
		.bail()
		.isHexadecimal()
		.withMessage('publicKeyHex must be a hex string'),
];

export default GetAppTokenBody;
