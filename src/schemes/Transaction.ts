import { Model, DataTypes } from 'sequelize';
import sequelize from '../sequelize';

class Transaction extends Model {
	declare readonly id: number;

	declare buy_order_id: number;

	declare sell_order_id: number;

	declare amount: string;

	declare timestamp: number;

	declare status: 'pending' | 'confirmed' | 'rejected';

	declare creator: 'buy' | 'sell';

	declare hex_raw_proposal: string;

	declare finalize_timestamp: number | null;

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
		finalize_timestamp: {
			type: DataTypes.BIGINT,
			allowNull: true,
			defaultValue: null,
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
			{ name: 'transactions_finalize_timestamp', fields: ['finalize_timestamp'] },
			{
				name: 'transactions_buy_order_id_sell_order_id',
				fields: ['buy_order_id', 'sell_order_id'],
				unique: true,
				where: {
					status: 'pending',
				},
			},
		],
	},
);

export default Transaction;
