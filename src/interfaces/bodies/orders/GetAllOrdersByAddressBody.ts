import { body } from 'express-validator';

export enum GetAllOrdersByAddressBodyOrder {
	// eslint-disable-next-line no-unused-vars
	NEWEST = 'NEWEST',
	// eslint-disable-next-line no-unused-vars
	OLDEST = 'OLDEST',
}

interface GetAllOrdersByAddressBody {
	address: string;

	offset: number;
	count: number;
	order: GetAllOrdersByAddressBodyOrder;
}

export const getAllOrdersByAddressValidator = [
	body('address')
		.isString()
		.withMessage('address must be a string')
		.bail()
		.trim()
		.notEmpty()
		.withMessage('address must be a non-empty string')
		.isLength({ max: 256 })
		.withMessage('address must not be longer than 256 characters'),
	body('offset').isInt({ min: 0 }).withMessage('offset must be a non-negative integer'),
	body('count')
		.isInt({ min: 1, max: 1000 })
		.withMessage('count must be a positive integer within certain range'),
	body('order')
		.isIn(Object.values(GetAllOrdersByAddressBodyOrder))
		.withMessage('Invalid order value'),
];

export default GetAllOrdersByAddressBody;
