import UserData from '@/interfaces/common/UserData';
import { body } from 'express-validator';

interface SetEmailBody {
	userData: UserData;
	email: string | null;
}

export const setEmailValidator = [
	body('email')
		.optional({ values: 'null' })
		.isString()
		.withMessage('email must be a string')
		.bail()
		.trim()
		.isLength({ max: 254 })
		.withMessage('email is too long')
		.bail()
		.isEmail()
		.withMessage('email is invalid'),
];

export default SetEmailBody;
