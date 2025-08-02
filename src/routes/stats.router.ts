import express from 'express';
import statsController from '../controllers/stats.controller';

const statsRouter = express.Router();

statsRouter.get('/stats/asset', statsController.getAssetStats);
statsRouter.get('/stats/total', statsController.getTotalStats);
statsRouter.get('/stats/total_stats_in_period', statsController.getTotalStatsInPeriod);

export default statsRouter;
