import { Model, DataTypes } from 'sequelize';
import sequelize from '../sequelize';

class App extends Model {
	declare readonly id: number;

	declare name: string;

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
	},
	{
		sequelize,
		modelName: 'App',
		timestamps: true,
		indexes: [{ name: 'apps_name', fields: ['name'] }],
	},
);

export default App;
