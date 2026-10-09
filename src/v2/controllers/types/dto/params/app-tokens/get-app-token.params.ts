import { param } from 'express-validator';
import { body } from 'express-validator';

import UserData from '@/interfaces/common/UserData';

export type GetAppTokenRequestQueryParams = {
	appId: string;
};

export const getAppTokenRequestQueryParamsValidator = [
	param('appId').isInt({ min: 1 }).withMessage('appId must be a positive integer'),
];

export type GetAppTokenRequestBody = {
	userData: UserData;
	publicKeyHex: string;
};

export const getAppTokenRequestBodyValidator = [
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
