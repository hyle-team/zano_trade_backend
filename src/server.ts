import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRouter from './routes/auth.router.js';
import offersRouter from './routes/offers.router.js';
import userRouter from './routes/user.router.js';
import middleware from './middleware/middleware.js';
import configRouter from './routes/config.router.js';
import chatsRouter from './routes/chats.router.js';
import dexRouter from './routes/dex.router.js';
import ordersRouter from './routes/orders.router.js';
import transactionsRouter from './routes/transactions.router.js';
import adminRouter from './routes/admin.router.js';
import { socketStart } from './socket/main.js';
import assetsUpdateChecker, { ZANO_ASSET_ID } from './workers/assetsUpdateChecker.js';
import initdb from './database.js';
import sequelize from './sequelize.js';
import Currency, { Asset } from './schemes/Currency.js';
import User from './schemes/User.js';

const PORT = process.env.PORT || 3000;

const app = express();
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

	socketStart(io);

	app.use(cookieParser());
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	app.use(
		cors({
			origin: ['http://localhost:3000', 'http://localhost:3001', 'https://trade.zano.org'],
			credentials: true,
		}),
	);

	app.use('/api', [
		authRouter,
		offersRouter,
		userRouter,
		configRouter,
		chatsRouter,
		dexRouter,
		ordersRouter,
		transactionsRouter,
	]);

	app.use('/api/admin', adminRouter);

	app.post('/api/check-auth', middleware.verifyToken, async (req, res) =>
		res.send({ success: true, userData: req.body.userData }),
	);

	server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
})();

export default io;
