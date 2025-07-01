import express from 'express';
import dexController from '../controllers/dex.controller.js';
import middleware from '../middleware/middleware.js';

const dexRouter = express.Router();

dexRouter.post('/dex/get-pairs-page', dexController.getPairsPage);
dexRouter.post('/dex/get-pairs-pages-amount', dexController.getPairsPagesAmount);
dexRouter.post('/dex/get-pair', dexController.getPair);
dexRouter.post('/dex/renew-bot', middleware.verifyToken, dexController.registerBot);
dexRouter.post('/dex/volume-stats', dexController.volumeStats);
dexRouter.post('/dex/get-assets-price-rates', dexController.getAssetsPriceRates);
dexRouter.post('/dex/find-pair', dexController.findPairID);

export default dexRouter;
