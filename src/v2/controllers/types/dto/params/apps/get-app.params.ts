import { param } from 'express-validator';

import UserData from '@/interfaces/common/UserData';

export type GetAppQueryParamsDTO = {
	appId: string;
};

export const getAppQueryParamsDTOValidator = [
	param('appId').isInt({ min: 1 }).withMessage('appId must be a positive integer'),
];

export type GetAppBodyDTO = {
	userData: UserData;
};
