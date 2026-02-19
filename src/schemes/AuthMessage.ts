import sequelize from '@/sequelize';
import { DataTypes, Model } from 'sequelize';

class AuthMessage extends Model {
	declare readonly id: number;
	declare address: string;
	declare alias: string;
	declare message: string;
	declare expires_at: Date;

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
		expires_at: {
			type: DataTypes.DATE,
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: 'AuthMessage',
	},
);

export default AuthMessage;
