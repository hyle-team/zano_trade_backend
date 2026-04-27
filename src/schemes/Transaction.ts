import { Model, DataTypes } from 'sequelize';
import sequelize from '../sequelize';
import Order from './Order';

const APPLY_TRANSACTION_BUY_SELL_ORDER_ID_UNIQUE_CONSTRAINT_NAME =
	'apply_transaction_buy_sell_order_id_unique';

class Transaction extends Model {
	declare readonly id: number;

	declare buy_order_id: number;

	declare sell_order_id: number;

	declare amount: string;

	declare timestamp: number;

	declare status: 'pending' | 'confirmed' | 'rejected';

	declare creator: 'buy' | 'sell';

	declare hex_raw_proposal: string;

	declare readonly createdAt: Date;

	declare readonly updatedAt: Date;
}

Transaction.init(
	{
		id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
		buy_order_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			unique: APPLY_TRANSACTION_BUY_SELL_ORDER_ID_UNIQUE_CONSTRAINT_NAME,
		},
		sell_order_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			unique: APPLY_TRANSACTION_BUY_SELL_ORDER_ID_UNIQUE_CONSTRAINT_NAME,
		},
		amount: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		timestamp: {
			type: DataTypes.BIGINT,
			allowNull: false,
		},
		status: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		creator: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		hex_raw_proposal: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: 'Transaction',
		timestamps: true,
		indexes: [
			{ fields: ['buy_order_id', 'status'] },
			{ fields: ['sell_order_id', 'status'] },
			{ fields: ['timestamp'] },
		],
	},
);

Order.hasMany(Transaction, {
	foreignKey: 'buy_order_id',
});

Transaction.belongsTo(Order, {
	foreignKey: 'buy_order_id',
});

Order.hasMany(Transaction, {
	foreignKey: 'sell_order_id',
});

Transaction.belongsTo(Order, {
	foreignKey: 'sell_order_id',
});

export default Transaction;
