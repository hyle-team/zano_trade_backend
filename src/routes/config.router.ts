import express from 'express';
import configController from '../controllers/config.controller.js';

const configRouter = express.Router();

configRouter.get('/config', configController.get);

export default configRouter;
