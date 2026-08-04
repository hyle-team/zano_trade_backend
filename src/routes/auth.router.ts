import express from 'express';

import middleware from '@/middleware/middleware.js';
import { requestAuthBodyValidator } from '@/interfaces/bodies/auth/RequestAuthBody.js';
import { authBodyValidator } from '@/interfaces/bodies/auth/AuthBody.js';
import authController from '../controllers/auth.controller.js';

const authRouter = express.Router();

authRouter.post(
	'/auth/request-auth',
	middleware.expressValidator(requestAuthBodyValidator),
	authController.requestAuth.bind(authController),
);
authRouter.post(
	'/auth',
	middleware.expressValidator(authBodyValidator),
	authController.auth.bind(authController),
);

export default authRouter;
