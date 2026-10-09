import { param } from 'express-validator';

import UserData from '@/interfaces/common/UserData';

export type DeleteAppQueryParamsDTO = {
	appId: string;
};

export const deleteAppQueryParamsDTOValidator = [
	param('appId').isInt({ min: 1 }).withMessage('appId must be a positive integer'),
];

export type DeleteAppBodyDTO = {
	userData: UserData;
};
