import express from 'express';

import { createAppValidator } from '@/interfaces/bodies/apps/CreateAppBody.js';
import appsController from '@/controllers/apps.controller.js';
import middleware from '@/middleware/middleware';
import { deleteAppParamsValidator } from '@/interfaces/params/apps/DeleteAppParams';
import { getAppParamsValidator } from '@/interfaces/params/apps/GetAppParams';
import { updateAppNameValidator } from '@/interfaces/bodies/apps/UpdateAppNameBody';
import { updateAppNameParamsValidator } from '@/interfaces/params/apps/UpdateAppNameParams';

const appsRouter = express.Router();

appsRouter.use('/', middleware.authGuard);

appsRouter.post(
	'/',
	middleware.expressValidator(createAppValidator),
	appsController.create.bind(appsController),
);

appsRouter.patch('/', appsController.getAll.bind(appsController));

appsRouter.patch(
	'/get/:appId',
	middleware.expressValidator(getAppParamsValidator),
	appsController.getOne.bind(appsController),
);

appsRouter.put(
	'/:appId',
	middleware.expressValidator([...updateAppNameParamsValidator, ...updateAppNameValidator]),
	appsController.updateName.bind(appsController),
);

appsRouter.delete(
	'/:appId',
	middleware.expressValidator(deleteAppParamsValidator),
	appsController.delete.bind(appsController),
);

export default appsRouter;
