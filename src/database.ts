import pg from 'pg';
import { env } from '@/config/env.js';

async function initdb() {
	const pool = new pg.Pool({
		user: env.PGUSER,
		password: env.PGPASSWORD,
		host: env.PGHOST,
		database: 'postgres',
		port: env.PGPORT,
		keepAlive: true,
		idleTimeoutMillis: 0,
		max: 100,
	});

	try {
		await pool.query(`CREATE DATABASE "${env.PGDATABASE}" `);
	} catch (error) {
		if ((error as { code: string }).code === '42P04') {
			console.log('Database already exists, skipping creation');
		} else {
			throw error;
		}
	}

	await pool.end();
}

export default initdb;
