import { param } from 'express-validator';

interface RegenerateAppTokenParams {
	appId: string;
}

export const regenerateAppTokenParamsValidator = [
	param('appId').isInt({ min: 1 }).withMessage('appId must be a positive integer'),
];

export default RegenerateAppTokenParams;
