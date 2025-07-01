import { Model, DataTypes } from 'sequelize';
import sequelize from '../sequelize';

class Message extends Model {
	declare readonly id: number;

	declare type: string;

	declare url: string;

	declare text: string;

	declare timestamp: number;

	declare from_owner: boolean;

	declare success: boolean;

	declare fail: boolean;

	declare system: boolean;

	declare chat_id: number;

	declare readonly createdAt: Date;

	declare readonly updatedAt: Date;
}

Message.init(
	{
		id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
		type: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		url: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		text: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		timestamp: {
			type: DataTypes.BIGINT,
			allowNull: false,
		},
		from_owner: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
		},
		success: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
		},
		fail: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
		},
		system: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
		},
		chat_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: 'Message',
		timestamps: true,
	},
);

export default Message;
