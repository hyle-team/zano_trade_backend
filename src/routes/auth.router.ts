import express from 'express';

import middleware from '@/middleware/middleware.js';
import { requestAuthBodyValidator } from '@/interfaces/bodies/auth/RequestAuthBody.js';
import authController from '../controllers/auth.controller.js';

const authRouter = express.Router();

authRouter.post(
	'/auth/request-auth',
	middleware.expressValidator(requestAuthBodyValidator),
	authController.requestAuth.bind(authController),
);
authRouter.post('/auth', authController.auth);

export default authRouter;
