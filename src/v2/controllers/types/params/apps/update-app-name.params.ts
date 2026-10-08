import { param } from 'express-validator';
import { body } from 'express-validator';

import UserData from '@/interfaces/common/UserData';

export type UpdateAppNameRequestQueryParams = {
	appId: string;
};

export const updateAppNameRequestQueryParamsValidator = [
	param('appId').isInt({ min: 1 }).withMessage('appId must be a positive integer'),
];

export type UpdateAppNameRequestBody = {
	userData: UserData;
	name: string;
};

export const updateAppNameRequestBodyValidator = [
	body('name')
		.isString()
		.withMessage('name must be a string')
		.bail()
		.trim()
		.notEmpty()
		.withMessage('name must be a non-empty string')
		.isLength({ max: 256 })
		.withMessage('name must not be longer than 256 characters'),
];
