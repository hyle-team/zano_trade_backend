import express from 'express';
import { createAppValidator } from '@/interfaces/bodies/apps/CreateAppBody.js';
import appsController from '@/controllers/apps.controller.js';
import middleware from '@/middleware/middleware';

const appsRouter = express.Router();

appsRouter.use('/', middleware.authGuard);

appsRouter.post(
	'/',
	middleware.expressValidator(createAppValidator),
	appsController.create.bind(appsController),
);

export default appsRouter;
