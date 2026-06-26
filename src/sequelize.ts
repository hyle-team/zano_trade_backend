import { Sequelize } from 'sequelize';
import { env } from '@/config/env.js';

const sequelize = new Sequelize({
	dialect: 'postgres',
	password: env.PGPASSWORD,
	host: env.PGHOST,
	username: env.PGUSER,
	port: env.PGPORT,
	database: env.PGDATABASE,
	benchmark: true,
	logging: (sql, timingMs) => {
		if (typeof timingMs === 'number' && timingMs > 1000) {
			console.warn(`[slow sql] ${timingMs}ms`, sql);
		}
	},
	pool: {
		max: 80,
		min: 0,
		idle: 10000,
		maxUses: 1000,
		evict: 10000,
	},
});

export default sequelize;
