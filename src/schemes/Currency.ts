import { Model, DataTypes } from 'sequelize';
import sequelize from '../sequelize';
import Pair from './Pair';

export interface Asset {
	asset_id: string;
	logo: string;
	price_url: string;
	ticker: string;
	full_name: string;
	total_max_supply: string;
	current_supply: string;
	decimal_point: number;
	meta_info: string;
}

class Currency extends Model {
	declare readonly id: number;

	declare name: string;

	declare code: string;

	declare type: string;

	declare asset_id: string;

	declare auto_parsed: boolean;

	declare asset_info?: Asset;

	declare whitelisted: boolean;

	declare readonly createdAt: Date;

	declare readonly updatedAt: Date;
}

Currency.init(
	{
		id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		code: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		type: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		asset_id: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		auto_parsed: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
		},
		asset_info: {
			type: DataTypes.JSONB,
			allowNull: true,
		},
		whitelisted: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
	},
	{
		sequelize,
		modelName: 'Currency',
		timestamps: true,
	},
);

Currency.hasMany(Pair, {
	foreignKey: 'first_currency_id',
	as: 'first_currency',
	onDelete: 'CASCADE',
	onUpdate: 'CASCADE',
	hooks: true,
	constraints: false,
});

Currency.hasMany(Pair, {
	foreignKey: 'second_currency_id',
	as: 'second_currency',
	onDelete: 'CASCADE',
	onUpdate: 'CASCADE',
	hooks: true,
	constraints: false,
});

Pair.belongsTo(Currency, {
	foreignKey: 'first_currency_id',
	as: 'first_currency',
	onDelete: 'CASCADE',
	onUpdate: 'CASCADE',
	hooks: true,
});
Pair.belongsTo(Currency, {
	foreignKey: 'second_currency_id',
	as: 'second_currency',
	onDelete: 'CASCADE',
	onUpdate: 'CASCADE',
	hooks: true,
});

export default Currency;
