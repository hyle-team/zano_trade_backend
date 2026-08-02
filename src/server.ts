import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

import authMessagesCleanService from '@/workers/authMessagesCleanService';
import authRouter from './routes/auth.router';
import offersRouter from './routes/offers.router';
import userRouter from './routes/user.router';
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

const PORT = process.env.PORT || 3000;

if (!process.env.TRUST_PROXY) {
	throw new Error('TRUST_PROXY is not provided at .env file');
}

const trustProxy = Number(process.env.TRUST_PROXY);

if (Number.isNaN(trustProxy)) {
	throw new Error('TRUST_PROXY must be a number');
}

const app = express();
app.set('trust proxy', trustProxy);
const server = http.createServer(app);
const io = new Server(server);

// Log uncaught exceptions and unhandled promise rejections
process.on('uncaughtException', (err) => {
	console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

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

	if (process.env.OWNER_ALIAS) {
		await User.update({ isAdmin: true }, { where: { alias: process.env.OWNER_ALIAS } });
	}

	assetsUpdateChecker.run();
	ordersModerationService.run();
	authMessagesCleanService.run();
	exchangeModel.runPairStatsDaemon();
	statsModel.init();

	socketStart(io);

	app.use(middleware.defaultRateLimit);

	const FRONTEND_ORIGIN = process.env.FRONTEND_URL;

	const AUTH_REQUIRED_ROUTES = [
		'/api/user',
		'/api/chats',
		'/api/transactions',
		'/api/admin',
		'/api/check-auth',

		'/api/offers/update',
		'/api/offers/delete',
		'/api/offers/get-one',

		'/api/orders/create',
		'/api/orders/get-user-page',
		'/api/orders/get',
		'/api/orders/cancel',
		'/api/orders/apply-order',
		'/api/orders/get-user-orders-pairs',
		'/api/orders/cancel-all',

		'/api/dex/renew-bot',
	];

	app.use((req, res, next) => {
		if (req.method === 'OPTIONS') {
			res.header('Access-Control-Allow-Origin', '*');

			res.header(
				'Access-Control-Allow-Headers',
				'Origin, X-Requested-With, Content-Type, Accept, Authorization',
			);

			res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');

			return res.sendStatus(204);
		}

		const { origin } = req.headers;

		const isProtectedRoute = AUTH_REQUIRED_ROUTES.some((route) => req.path.startsWith(route));

		if (isProtectedRoute) {
			const isServerRequest = !origin;

			if (!isServerRequest && origin !== FRONTEND_ORIGIN) {
				return res.status(403).send({
					success: false,
					message: 'CORS origin denied',
				});
			}

			if (origin) {
				res.header('Access-Control-Allow-Origin', origin);
			}
		} else {
			res.header('Access-Control-Allow-Origin', '*');
		}

		res.header(
			'Access-Control-Allow-Headers',
			'Origin, X-Requested-With, Content-Type, Accept, Authorization',
		);
		res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
		res.header('Referrer-Policy', 'same-origin');
		res.header(
			'Permissions-Policy',
			['fullscreen=(self)', 'picture-in-picture=(self)'].join(', '),
		);
		res.header('X-Content-Type-Options', 'nosniff');
		res.header('X-Frame-Options', 'SAMEORIGIN');

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

	app.use('/api/admin', adminRouter);

	app.post('/api/check-auth', middleware.verifyToken, async (req, res) =>
		res.send({ success: true, userData: req.body.userData }),
	);

	app.use(middleware.resultGlobalErrorHandler);

	server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
})();

export default io;
