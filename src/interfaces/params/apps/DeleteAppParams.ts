import { param } from 'express-validator';

interface DeleteAppParams {
	appId: string;
}

export const deleteAppParamsValidator = [
	param('appId').isInt({ min: 1 }).withMessage('appId must be a positive integer'),
];

export default DeleteAppParams;
