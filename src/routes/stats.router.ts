import express from 'express';
import statsController from '../controllers/stats.controller';

const statsRouter = express.Router();

statsRouter.get('/stats/asset', statsController.getAssetStats);
statsRouter.get('/stats/total', statsController.getTotalStats);

export default statsRouter;
