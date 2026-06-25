import { body } from 'express-validator';

type AuthBody = {
	data: {
		address: string;
		alias: string;
		signature: string;
		message: string;
		pkey: string;
	};
};

export const authBodyValidator = [
	body('data.address').isString().notEmpty(),
	body('data.alias').isString().notEmpty(),
	body('data.signature').isString().notEmpty(),
	body('data.message').isString().notEmpty(),
	body('data.pkey').isString().notEmpty(),
];

export default AuthBody;
