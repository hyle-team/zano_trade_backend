import express from 'express';
import authController from '../controllers/auth.controller.js';

const authRouter = express.Router();

authRouter.post('/auth', authController.auth);
authRouter.post('/logout', authController.logout);

export default authRouter;
