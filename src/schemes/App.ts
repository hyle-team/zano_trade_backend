import { Model, DataTypes } from 'sequelize';

import sequelize from '@/sequelize';
import User from './User';

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
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: 'App',
		timestamps: true,
		indexes: [{ name: 'apps_name', fields: ['name'] }, { fields: ['user_id'] }],
	},
);

App.belongsTo(User, {
	foreignKey: 'user_id',
});

User.hasMany(App, {
	foreignKey: 'user_id',
});

export default App;
