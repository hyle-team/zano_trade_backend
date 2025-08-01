import middleware from '@/middleware/middleware';
import Currency from '@/schemes/Currency';
import Order from '@/schemes/Order';
import Pair from '@/schemes/Pair';
import User from '@/schemes/User';
import express from 'express';

const adminRouter = express.Router();

adminRouter.use(middleware.verifyToken, middleware.verifyAdmin);

adminRouter.post('/check-admin', (req, res) => {
	res.send({ success: true, data: 'You are an admin' });
});

adminRouter.post('/get-admins', async (req, res) => {
	const owner = await User.findOne({ where: { alias: process.env.OWNER_ALIAS } });

	const admins = await User.findAll({
		where: {
			isAdmin: true,
		},
	});

	const preparedAdmins = admins.map((admin) => ({
		id: admin.id,
		alias: admin.alias,
		isOwner: admin.id === owner?.id,
	}));

	res.send({ success: true, data: preparedAdmins });
});

adminRouter.post('/delete-admin', async (req, res) => {
	const admin = await User.findOne({ where: { id: req.body.id || null } });

	if (!admin) {
		return res.send({ success: false, message: 'Admin not found' });
	}

	if (admin.alias === process.env.OWNER_ALIAS) {
		return res.send({ success: false, message: "You can't delete owner" });
	}

	await admin.update({ isAdmin: false });

	res.send({ success: true, message: 'Admin deleted' });
});

adminRouter.post('/add-admin', async (req, res) => {
	const admin = await User.findOne({ where: { alias: req.body.alias || null } });

	if (!admin) {
		return res.send({ success: false, message: 'Admin not found' });
	}

	await admin.update({ isAdmin: true });

	res.send({ success: true, message: 'Admin updated' });
});

adminRouter.post('/get-featured', async (req, res) => {
	const pairs = await Pair.findAll({
		where: {
			featured: true,
		},
		include: [
			{
				model: Currency,
				as: 'first_currency',
			},
		],
	});

	res.send({ success: true, data: pairs });
});

adminRouter.post('/delete-featured', async (req, res) => {
	const pair = await Pair.findOne({ where: { id: req.body.id } });

	if (!pair) {
		return res.send({ success: false, message: 'Pair not found' });
	}

	await pair.update({ featured: false });

	res.send({ success: true, message: 'Pair deleted' });
});

adminRouter.post('/add-featured', async (req, res) => {
	const currency = await Currency.findOne({ where: { asset_id: req.body.asset_id } });

	const pair = await Pair.findOne({ where: { first_currency_id: currency?.id || null } });

	if (!pair) {
		return res.send({ success: false, message: 'Pair not found' });
	}

	await pair.update({ featured: true });

	res.send({ success: true, message: 'Pair updated' });
});

adminRouter.post('/get_order_data', async (req, res) => {
	const { orderId } = req.body;

	if (!orderId) {
		return res.status(400).send({ success: false, data: 'Order ID is required' });
	}

	const order = await Order.findOne({
		where: { id: orderId },
	});

	if (!order) {
		return res.status(404).send({ success: false, data: 'Order not found' });
	}

	const orderData = order.toJSON();

	res.send({ success: true, data: orderData });
});

adminRouter.post('/get_user_data', async (req, res) => {
	const { userId } = req.body;
	if (!userId) {
		return res.status(400).send({ success: false, data: 'User ID is required' });
	}
	const user = await User.findOne({
		where: { id: userId },
	});

	if (!user) {
		return res.status(404).send({ success: false, data: 'User not found' });
	}

	res.send({ success: true, data: user.toJSON() });
});

export default adminRouter;
