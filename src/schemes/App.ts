import { Model, DataTypes } from 'sequelize';

import sequelize from '@/sequelize';
import User from './User';

export const APPS_USER_ID_NAME_UNIQUE_CONSTRAINT = 'apps_user_id_name_unique';

class App extends Model {
	declare readonly id: number;

	declare name: string;

	declare user_id: number;

	declare readonly createdAt: Date;

	declare readonly updatedAt: Date;
}

App.init(
	{
		id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: APPS_USER_ID_NAME_UNIQUE_CONSTRAINT,
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			unique: APPS_USER_ID_NAME_UNIQUE_CONSTRAINT,
		},
	},
	{
		sequelize,
		modelName: 'App',
		timestamps: true,
	},
);

App.belongsTo(User, {
	foreignKey: 'user_id',
});

User.hasMany(App, {
	foreignKey: 'user_id',
});

export default App;
