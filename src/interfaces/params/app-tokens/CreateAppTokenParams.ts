import { param } from 'express-validator';

interface CreateAppTokenParams {
	appId: string;
}

export const createAppTokenParamsValidator = [
	param('appId').isInt({ min: 1 }).withMessage('appId must be a positive integer'),
];

export default CreateAppTokenParams;
