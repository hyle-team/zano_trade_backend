import { body } from 'express-validator';

interface RequestAuthBody {
	address: string;
	alias: string;
}

export const requestAuthBodyValidator = [
	body('address').isString().notEmpty(),
	body('alias').isString().notEmpty(),
];

export default RequestAuthBody;
