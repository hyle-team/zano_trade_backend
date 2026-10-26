import express from 'express';
import { setEmailValidator } from '@/interfaces/bodies/user/SetEmailBody.js';
import userController from '../controllers/user.controller.js';
import middleware from '../middleware/middleware.js';

const userRouter = express.Router();

userRouter.use('/user', middleware.authGuard);
userRouter.post('/user/get-user', userController.getUser);
userRouter.post('/user/get-notifications-amount', userController.getNotificationsAmount);
userRouter.post('/user/set-favourite-currencies', userController.setFavouriteCurrencies);
userRouter.post('/user/get-notification-settings', userController.getNotificationSettings);
userRouter.post(
	'/user/set-email',
	middleware.expressValidator(setEmailValidator),
	userController.setEmail,
);

export default userRouter;
