import { Model, DataTypes } from 'sequelize';
import sequelize from '../sequelize';
import Transaction from './Transaction';
import Pair from './Pair';

class Order extends Model {
	declare readonly id: number;

	declare type: string;

	declare timestamp: number;

	declare side: string;

	declare price: string;

	declare amount: string;

	declare total: string;

	declare pair_id: number;

	declare user_id: number;

	declare status: string;

	declare left: string;

	declare hasNotification: boolean;

	declare readonly createdAt: Date;

	declare readonly updatedAt: Date;
}

Order.init(
	{
		id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
		type: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		timestamp: {
			type: DataTypes.BIGINT,
			allowNull: false,
		},
		side: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		price: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		amount: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		total: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		pair_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		status: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		left: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		hasNotification: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
	},
	{
		sequelize,
		modelName: 'Order',
		timestamps: true,
	},
);

Order.hasMany(Transaction, {
	foreignKey: 'buy_order_id',
	as: 'buy_orders',
	onDelete: 'CASCADE',
	onUpdate: 'CASCADE',
	hooks: true,
	constraints: false,
});

Order.hasMany(Transaction, {
	foreignKey: 'sell_order_id',
	as: 'sell_orders',
	onDelete: 'CASCADE',
	onUpdate: 'CASCADE',
	hooks: true,
	constraints: false,
});

Order.belongsTo(Pair, {
	foreignKey: 'pair_id',
	as: 'pair',
	onDelete: 'CASCADE',
	onUpdate: 'CASCADE',
	hooks: true,
	constraints: false,
});

export default Order;
