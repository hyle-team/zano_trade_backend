import { Model, DataTypes } from 'sequelize';

import sequelize from '@/sequelize';
import AppSequelize from '../v2/database/schemes/App';

class AppToken extends Model {
	declare readonly id: number;

	declare app_id: number;

	declare value: string;

	declare issued_at: Date;
}

AppToken.init(
	{
		id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
		app_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			unique: true,
		},
		value: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		issued_at: {
			type: DataTypes.DATE,
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: 'AppToken',
		timestamps: true,
		indexes: [{ fields: ['value'] }],
	},
);

AppToken.belongsTo(AppSequelize, {
	foreignKey: 'app_id',
});

AppSequelize.hasOne(AppToken, {
	foreignKey: 'app_id',
});

export default AppToken;
