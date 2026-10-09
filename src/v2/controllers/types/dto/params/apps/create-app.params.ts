import { body } from 'express-validator';

import UserData from '@/interfaces/common/UserData';

export type CreateAppBodyDTO = {
	userData: UserData;
	name: string;
};

export const createAppBodyDTOValidator = [
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
