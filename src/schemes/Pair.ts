import { Model, DataTypes } from 'sequelize';
import sequelize from '../sequelize';

class Pair extends Model {
	declare readonly id: number;

	declare first_currency_id: number;

	declare second_currency_id: number;

	declare rate?: number;

	declare coefficient?: number;

	declare high?: number;

	declare low?: number;

	declare volume: number;

	declare featured: boolean;

	declare readonly createdAt: Date;

	declare readonly updatedAt: Date;
}

Pair.init(
	{
		id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
		first_currency_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		second_currency_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		rate: {
			type: DataTypes.DOUBLE,
		},
		coefficient: {
			type: DataTypes.DOUBLE,
		},
		high: {
			type: DataTypes.DOUBLE,
		},
		low: {
			type: DataTypes.DOUBLE,
		},
		volume: {
			type: DataTypes.DOUBLE,
			defaultValue: 0,
			allowNull: false,
		},
		featured: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: 'Pair',
		timestamps: true,
	},
);

export default Pair;
