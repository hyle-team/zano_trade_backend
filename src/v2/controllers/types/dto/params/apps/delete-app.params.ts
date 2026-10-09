import { param } from 'express-validator';

import UserData from '@/interfaces/common/UserData';

export type DeleteAppRequestQueryParams = {
	appId: string;
};

export const deleteAppRequestQueryParamsValidator = [
	param('appId').isInt({ min: 1 }).withMessage('appId must be a positive integer'),
];

export type DeleteAppRequestBody = {
	userData: UserData;
};
