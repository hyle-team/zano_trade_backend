import { param } from 'express-validator';

interface UpdateAppNameParams {
	appId: string;
}

export const updateAppNameParamsValidator = [
	param('appId').isInt({ min: 1 }).withMessage('appId must be a positive integer'),
];

export default UpdateAppNameParams;
