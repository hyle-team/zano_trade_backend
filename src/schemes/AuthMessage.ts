import sequelize from '@/sequelize';
import { DataTypes, Model } from 'sequelize';

class AuthMessage extends Model {
	declare readonly id: number;
	declare address: string;
	declare alias: string;
	declare message: string;
	declare expiresAt: Date;

	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;
}

AuthMessage.init(
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		address: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		alias: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		message: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		expiresAt: {
			type: DataTypes.DATE,
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: 'AuthMessage',
		tableName: 'auth_messages',
	},
);

export default AuthMessage;
