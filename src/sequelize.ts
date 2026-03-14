import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
	dialect: 'postgres',
	password: process.env.PGPASSWORD,
	host: process.env.PGHOST,
	username: process.env.PGUSER,
	port: parseInt(process.env.PGPORT || '5432', 10),
	database: process.env.PGDATABASE,
	benchmark: true,
	logging: (sql, timingMs) => {
		if (typeof timingMs === 'number' && timingMs > 1000) {
			console.warn(`[slow sql] ${timingMs}ms`, sql);
		}
	},
	pool: {
		max: 20,
		min: 0,
		idle: 10000,
		maxUses: 1000,
		evict: 10000,
	},
});

export default sequelize;
