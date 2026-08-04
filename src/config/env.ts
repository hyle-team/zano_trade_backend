import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
	// Runtime
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	PORT: z.coerce.number().int().positive().default(3000),

	// Database
	PGUSER: z.string().min(1),
	PGPASSWORD: z.string().min(1),
	PGHOST: z.string().min(1),
	PGDATABASE: z.string().min(1),
	PGPORT: z.coerce.number().int().positive().default(5432),

	// Auth
	JWT_SECRET: z.string().min(32),
	OWNER_ALIAS: z.string().min(1).optional(),

	// Zano daemon
	DAEMON_URL: z.url(),

	// Frontend
	FRONTEND_URL: z.url(),

	TRUSTED_PROXY_BFF_IP_SIGNATURE_KEY: z.string().min(32),

	TRUST_PROXY_DEPTH: z.coerce.number().int().nonnegative().default(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	console.error(
		'Invalid environment variables. Read the following error messages to get the issues info:',
	);
	console.error(parsed.error.flatten((issue) => issue.message).fieldErrors);

	throw new Error('Invalid environment variables');
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
