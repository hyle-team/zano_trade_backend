import express from 'express';

import { createAppRequestBodyValidator } from '@/v2/controllers/types/params/apps/create-app.params.js';
import { appsController } from '@/v2/controllers/apps.controller.js';
import middleware from '@/middleware/middleware';
import { deleteAppRequestQueryParamsValidator } from '@/v2/controllers/types/params/apps/delete-app.params.js';
import { getAppRequestQueryParamsValidator } from '@/v2/controllers/types/params/apps/get-app.params.js';
import {
	updateAppNameRequestBodyValidator,
	updateAppNameRequestQueryParamsValidator,
} from '@/v2/controllers/types/params/apps/update-app-name.params.js';
import {
	createAppTokenRequestBodyValidator,
	createAppTokenRequestQueryParamsValidator,
} from '@/v2/controllers/types/params/app-tokens/create-app-token.params.js';
import {
	regenerateAppTokenRequestBodyValidator,
	regenerateAppTokenRequestQueryParamsValidator,
} from '@/v2/controllers/types/params/app-tokens/regenerate-app-token.params.js';
import {
	getAppTokenRequestBodyValidator,
	getAppTokenRequestQueryParamsValidator,
} from '@/v2/controllers/types/params/app-tokens/get-app-token.params.js';

export const appsRouter = express.Router();

appsRouter.use('/', middleware.authGuard);

appsRouter.post(
	'/',
	middleware.expressValidator(createAppRequestBodyValidator),
	appsController.create.bind(appsController),
);

appsRouter.patch('/', appsController.getAll.bind(appsController));

appsRouter.patch(
	'/get/:appId',
	middleware.expressValidator(getAppRequestQueryParamsValidator),
	appsController.getOne.bind(appsController),
);

appsRouter.put(
	'/:appId',
	middleware.expressValidator([
		...updateAppNameRequestQueryParamsValidator,
		...updateAppNameRequestBodyValidator,
	]),
	appsController.updateName.bind(appsController),
);

appsRouter.delete(
	'/:appId',
	middleware.expressValidator(deleteAppRequestQueryParamsValidator),
	appsController.delete.bind(appsController),
);

appsRouter.post(
	'/:appId/api-key',
	middleware.expressValidator([
		...createAppTokenRequestQueryParamsValidator,
		...createAppTokenRequestBodyValidator,
	]),
	appsController.createApiKey.bind(appsController),
);

appsRouter.put(
	'/:appId/api-key',
	middleware.expressValidator([
		...regenerateAppTokenRequestQueryParamsValidator,
		...regenerateAppTokenRequestBodyValidator,
	]),
	appsController.regenerateApiKey.bind(appsController),
);

appsRouter.patch(
	'/:appId/api-key/get',
	middleware.expressValidator([
		...getAppTokenRequestQueryParamsValidator,
		...getAppTokenRequestBodyValidator,
	]),
	appsController.getApiKey.bind(appsController),
);
