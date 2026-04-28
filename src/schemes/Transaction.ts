import { Model, DataTypes } from 'sequelize';
import sequelize from '../sequelize';
import Order from './Order';

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
		},
		sell_order_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
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
	as: 'buy_order',
});

Transaction.belongsTo(Order, {
	foreignKey: 'buy_order_id',
});

Order.hasMany(Transaction, {
	foreignKey: 'sell_order_id',
	as: 'sell_order',
});

Transaction.belongsTo(Order, {
	foreignKey: 'sell_order_id',
});

export default Transaction;
