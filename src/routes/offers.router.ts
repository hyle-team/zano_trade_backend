import express from 'express';
import offersController from '../controllers/offers.controller.js';
import middleware from '../middleware/middleware.js';

const offersRouter = express.Router();

offersRouter.use(['/offers/update', '/offers/delete', '/offers/get-one'], middleware.verifyToken);
// offersRouter.post("/offers/get-all", offersController.getAll);
offersRouter.post('/offers/get-page', offersController.getPage);
offersRouter.post('/offers/update', offersController.update);
offersRouter.post('/offers/delete', offersController.delete);
offersRouter.get('/offers/get-stats', offersController.getStats);

export default offersRouter;
