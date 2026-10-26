import UserData from '@/interfaces/common/UserData';
import { body } from 'express-validator';

interface SetEmailNotificationsBody {
	userData: UserData;
	orderId: number;
	enabled: boolean;
}

export const setEmailNotificationsValidator = [
	body('orderId').isInt({ min: 1 }).withMessage('orderId must be a positive integer').toInt(),
	body('enabled').isBoolean({ strict: true }).withMessage('enabled must be a boolean'),
];

export default SetEmailNotificationsBody;
