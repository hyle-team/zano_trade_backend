import { param } from 'express-validator';

import UserData from '@/interfaces/common/UserData';

export type GetAppRequestQueryParams = {
	appId: string;
};

export const getAppRequestQueryParamsValidator = [
	param('appId').isInt({ min: 1 }).withMessage('appId must be a positive integer'),
];

export type GetAppRequestBody = {
	userData: UserData;
};
