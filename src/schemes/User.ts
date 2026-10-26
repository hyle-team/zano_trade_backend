import { Model, DataTypes } from 'sequelize';
import sequelize from '../sequelize';

import Offer from './Offer';
import Order from './Order';

class User extends Model {
	declare readonly id: number;

	declare alias: string;

	declare address: string;

	declare favourite_currencies?: string[];

	declare isAdmin: boolean;

	declare last_seen_at: Date | null;

	declare email: string | null;

	declare readonly createdAt: Date;

	declare readonly updatedAt: Date;
}

User.init(
	{
		id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
		alias: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		address: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		favourite_currencies: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			allowNull: true,
			defaultValue: [],
		},
		isAdmin: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		last_seen_at: {
			type: DataTypes.DATE,
			allowNull: true,
			defaultValue: null,
		},
		email: {
			type: DataTypes.STRING(254),
			allowNull: true,
			defaultValue: null,
		},
	},
	{
		sequelize,
		modelName: 'User',
		timestamps: true,
		defaultScope: {
			attributes: { exclude: ['email', 'last_seen_at'] },
		},
	},
);

User.hasMany(Offer, {
	foreignKey: 'user_id',
	as: 'offers',
	onDelete: 'CASCADE',
	onUpdate: 'CASCADE',
	hooks: true,
});

User.hasMany(Order, {
	foreignKey: 'user_id',
	as: 'orders',
	onDelete: 'CASCADE',
	onUpdate: 'CASCADE',
	hooks: true,
});

export default User;
