import { param } from 'express-validator';

interface GetAppTokenParams {
	appId: string;
}

export const getAppTokenParamsValidator = [
	param('appId').isInt({ min: 1 }).withMessage('appId must be a positive integer'),
];

export default GetAppTokenParams;
