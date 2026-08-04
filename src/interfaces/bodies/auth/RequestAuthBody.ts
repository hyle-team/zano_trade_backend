import { body } from 'express-validator';

interface RequestAuthBody {
	address: string;
	alias: string;
	path: string;
}

export const requestAuthBodyValidator = [
	body('address').isString().notEmpty(),
	body('alias').isString().notEmpty(),
	body('path').isString().notEmpty(),
];

export default RequestAuthBody;
