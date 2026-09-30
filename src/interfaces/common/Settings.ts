import { z } from 'zod';

const hexStringSchema = z
	.string()
	.min(1)
	.regex(/^[0-9a-f]+$/i);

export const appSettingsSchema = z.object({
	passwordHash: hexStringSchema,
	passwordSalt: hexStringSchema,
});

export type AppSettings = z.infer<typeof appSettingsSchema>;
