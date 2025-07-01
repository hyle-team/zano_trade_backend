import { Model, DataTypes } from 'sequelize';
import sequelize from '../sequelize';

class Transaction extends Model {
	declare readonly id: number;

	declare buy_order_id: number;

	declare sell_order_id: number;

	declare amount: string;

	declare timestamp: number;

	declare status: string;

	declare creator: string;

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
	},
);

export default Transaction;
