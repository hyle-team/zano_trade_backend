import { Model, DataTypes } from 'sequelize';
import sequelize from '../sequelize';
import Chat from './Chat';

class Offer extends Model {
	declare readonly id: number;

	declare price: number;

	declare min: number;

	declare max: number;

	declare deposit_seller: number;

	declare deposit_buyer: number;

	declare user_id: number;

	declare type: string;

	declare comment: string;

	declare input_currency_id: number;

	declare target_currency_id: number;

	declare number: string;

	declare offer_status: string;

	declare deposit_currency_id: number;

	declare timestamp: bigint;

	declare readonly createdAt: Date;

	declare readonly updatedAt: Date;
}

Offer.init(
	{
		id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
		price: {
			type: DataTypes.DOUBLE,
			allowNull: false,
		},
		min: {
			type: DataTypes.DOUBLE,
			allowNull: false,
		},
		max: {
			type: DataTypes.DOUBLE,
			allowNull: false,
		},
		deposit_seller: {
			type: DataTypes.DOUBLE,
			allowNull: false,
		},
		deposit_buyer: {
			type: DataTypes.DOUBLE,
			allowNull: false,
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		type: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		comment: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		input_currency_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		target_currency_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		number: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		offer_status: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		deposit_currency_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		timestamp: {
			type: DataTypes.BIGINT,
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: 'Offer',
		timestamps: true,
	},
);

Offer.hasMany(Chat, {
	foreignKey: 'offer_number',
	sourceKey: 'number',
	as: 'chats',
	onDelete: 'CASCADE',
	onUpdate: 'CASCADE',
	hooks: true,
});

export default Offer;
