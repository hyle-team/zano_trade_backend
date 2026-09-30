import { Model, DataTypes } from 'sequelize';

import sequelize from '@/sequelize';

export class Settings extends Model {
	declare readonly id: number;

	declare settings: unknown;

	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;
}

Settings.init(
	{
		id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
		settings: {
			type: DataTypes.JSONB,
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: 'Settings',
		timestamps: true,
	},
);

export default Settings;
