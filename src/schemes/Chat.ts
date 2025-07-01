import { Model, DataTypes } from 'sequelize';
import sequelize from '../sequelize';
import Message from './Message';

class Chat extends Model {
	declare readonly id: number;

	declare offer_number: string;

	declare user_id: number;

	declare buyer_id: number;

	declare status: string;

	declare pay: number;

	declare receive: number;

	declare owner_deposit: string;

	declare opponent_deposit: string;

	declare view_list: number[];

	declare readonly createdAt: Date;

	declare readonly updatedAt: Date;
}

Chat.init(
	{
		id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
		offer_number: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		buyer_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		status: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		pay: {
			type: DataTypes.DOUBLE,
			allowNull: false,
		},
		receive: {
			type: DataTypes.DOUBLE,
			allowNull: false,
		},
		owner_deposit: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		opponent_deposit: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		view_list: {
			type: DataTypes.ARRAY(DataTypes.INTEGER),
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: 'Chat',
		timestamps: true,
	},
);

Chat.hasMany(Message, {
	foreignKey: 'chat_id',
	as: 'messages',
	onDelete: 'CASCADE',
	onUpdate: 'CASCADE',
	hooks: true,
});

export default Chat;
