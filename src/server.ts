import 'express-async-errors';
import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';

import helmet from 'helmet';
import { env } from '@/config/env.js';
import authMessagesCleanService from '@/workers/authMessagesCleanService';
import authRouter from './routes/auth.router';
import offersRouter from './routes/offers.router';
import userRouter from './routes/user.router';
import appsRouter from './routes/v2/apps.router';
import middleware from './middleware/middleware';
import configRouter from './routes/config.router';
import chatsRouter from './routes/chats.router';
import dexRouter from './routes/dex.router';
import ordersRouter from './routes/orders.router';
import transactionsRouter from './routes/transactions.router';
import adminRouter from './routes/admin.router';

import { socketStart } from './socket/main';
import assetsUpdateChecker, { ZANO_ASSET_ID } from './workers/assetsUpdateChecker';
import initdb from './database';
import sequelize from './sequelize';
import Currency, { Asset } from './schemes/Currency';
import User from './schemes/User';
import statsRouter from './routes/stats.router';
import exchangeModel from './models/ExchangeTransactions';
import { setupAssociations } from './schemes/Associations';
import statsModel from './models/Stats';
import ordersModerationService from './workers/ordersModerationService';

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: env.FRONTEND_URL,
		methods: ['GET', 'POST'],
		credentials: true,
	},
});

// Log uncaught exceptions and unhandled promise rejections
process.on('uncaughtException', (err) => {
	console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const apiV2Router = express.Router();

apiV2Router.use('/apps', appsRouter);

(async () => {
	await initdb();
	await sequelize.authenticate();
	await sequelize.sync();
	await setupAssociations();

	const zanoRow = await Currency.findOne({ where: { asset_id: ZANO_ASSET_ID } });

	if (!zanoRow) {
		await Currency.create({
			name: 'ZANO',
			code: 'zano',
			type: 'crypto',
			asset_id: ZANO_ASSET_ID,
			auto_parsed: false,
			asset_info: {
				decimal_point: 12,
			},
		});
	} else if (!zanoRow.asset_info) {
		zanoRow.asset_info = {
			decimal_point: 12,
		} as Asset;
		await zanoRow.save();
	}

	if (env.OWNER_ALIAS) {
		await User.update({ isAdmin: true }, { where: { alias: env.OWNER_ALIAS } });
	}

	assetsUpdateChecker.run();
	ordersModerationService.run();
	authMessagesCleanService.run();
	exchangeModel.runPairStatsDaemon();
	statsModel.init();

	app.set('trust proxy', env.TRUST_PROXY_DEPTH);
	app.use(middleware.bffTrustedProxyIpSignatureCheckMiddleware);
	app.use(middleware.defaultRateLimit);

	socketStart(io);

	app.use(middleware.defaultCors);

	app.use(
		helmet({
			hsts: true,
		}),
	);

	app.use((_req, res, next) => {
		res.setHeader('Permissions-Policy', 'fullscreen=()');

		next();
	});

	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	app.use('/api', [
		authRouter,
		offersRouter,
		userRouter,
		configRouter,
		chatsRouter,
		dexRouter,
		ordersRouter,
		transactionsRouter,
		statsRouter,
	]);

	app.use('/api/v2', apiV2Router);

	app.use('/api/admin', adminRouter);

	app.post('/api/check-auth', middleware.authGuard, async (req: Request, res: Response) =>
		res.send({ success: true, userData: req.body.userData }),
	);

	app.use(middleware.resultGlobalErrorHandler);

	server.listen(env.PORT, () => console.log(`Server is running on port ${env.PORT}`));
})();

export default io;
