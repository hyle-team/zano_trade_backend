import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

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

	server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
})();

export default io;
