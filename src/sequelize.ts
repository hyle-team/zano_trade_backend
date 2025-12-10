import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
	dialect: 'postgres',
	password: process.env.PGPASSWORD,
	host: process.env.PGHOST,
	username: process.env.PGUSER,
	port: parseInt(process.env.PGPORT || '5432', 10),
	database: process.env.PGDATABASE,
	logging: false,
	pool: {
		max: 20,
		min: 5,
		idle: 10000,
	},
});

export default sequelize;
