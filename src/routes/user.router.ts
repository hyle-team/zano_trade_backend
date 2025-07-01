import express from 'express';
import userController from '../controllers/user.controller.js';
import middleware from '../middleware/middleware.js';

const userRouter = express.Router();

userRouter.use('/user', middleware.verifyToken);
userRouter.post('/user/get-user', userController.getUser);
userRouter.post('/user/get-notifications-amount', userController.getNotificationsAmount);
userRouter.post('/user/set-favourite-currencies', userController.setFavouriteCurrencies);

export default userRouter;
