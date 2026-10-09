import { param } from 'express-validator';
import { body } from 'express-validator';

import UserData from '@/interfaces/common/UserData';

export type CreateAppTokenRequestQueryParams = {
	appId: string;
};

export const createAppTokenRequestQueryParamsValidator = [
	param('appId').isInt({ min: 1 }).withMessage('appId must be a positive integer'),
];

export type CreateAppTokenRequestBody = {
	userData: UserData;
	publicKeyHex: string;
};

export const createAppTokenRequestBodyValidator = [
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
