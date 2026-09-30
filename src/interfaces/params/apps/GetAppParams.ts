import { param } from 'express-validator';

interface GetAppParams {
	appId: string;
}

export const getAppParamsValidator = [
	param('appId').isInt({ min: 1 }).withMessage('appId must be a positive integer'),
];

export default GetAppParams;
