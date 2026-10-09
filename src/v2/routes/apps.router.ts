import express from 'express';

import { createAppBodyDTOValidator } from '@/v2/controllers/types/dto/params/apps/create-app.params.js';
import { appsController } from '@/v2/controllers/apps.controller.js';
import middleware from '@/middleware/middleware';
import { deleteAppQueryParamsDTOValidator } from '@/v2/controllers/types/dto/params/apps/delete-app.params.js';
import { getAppQueryParamsDTOValidator } from '@/v2/controllers/types/dto/params/apps/get-app.params.js';
import {
	updateAppNameBodyDTOValidator,
	updateAppNameQueryParamsDTOValidator,
} from '@/v2/controllers/types/dto/params/apps/update-app-name.params.js';
import {
	createAppTokenBodyDTOValidator,
	createAppTokenQueryParamsDTOValidator,
} from '@/v2/controllers/types/dto/params/app-tokens/create-app-token.params.js';
import {
	regenerateAppTokenBodyDTOValidator,
	regenerateAppTokenQueryParamsDTOValidator,
} from '@/v2/controllers/types/dto/params/app-tokens/regenerate-app-token.params.js';
import {
	getAppTokenBodyDTOValidator,
	getAppTokenQueryParamsDTOValidator,
} from '@/v2/controllers/types/dto/params/app-tokens/get-app-token.params.js';

export const appsRouter = express.Router();

appsRouter.use('/', middleware.authGuard);

appsRouter.post(
	'/',
	middleware.expressValidator(createAppBodyDTOValidator),
	appsController.create.bind(appsController),
);

appsRouter.patch('/', appsController.getAll.bind(appsController));

appsRouter.patch(
	'/get/:appId',
	middleware.expressValidator(getAppQueryParamsDTOValidator),
	appsController.getOne.bind(appsController),
);

appsRouter.put(
	'/:appId',
	middleware.expressValidator([
		...updateAppNameQueryParamsDTOValidator,
		...updateAppNameBodyDTOValidator,
	]),
	appsController.updateName.bind(appsController),
);

appsRouter.delete(
	'/:appId',
	middleware.expressValidator(deleteAppQueryParamsDTOValidator),
	appsController.delete.bind(appsController),
);

appsRouter.post(
	'/:appId/api-key',
	middleware.expressValidator([
		...createAppTokenQueryParamsDTOValidator,
		...createAppTokenBodyDTOValidator,
	]),
	appsController.createApiKey.bind(appsController),
);

appsRouter.put(
	'/:appId/api-key',
	middleware.expressValidator([
		...regenerateAppTokenQueryParamsDTOValidator,
		...regenerateAppTokenBodyDTOValidator,
	]),
	appsController.regenerateApiKey.bind(appsController),
);

appsRouter.patch(
	'/:appId/api-key/get',
	middleware.expressValidator([
		...getAppTokenQueryParamsDTOValidator,
		...getAppTokenBodyDTOValidator,
	]),
	appsController.getApiKey.bind(appsController),
);
