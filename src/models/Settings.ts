import crypto from 'node:crypto';
import CryptoJS from 'crypto-js';

import AppSequelize from '@/v2/database/schemes/app.scheme';
import sequelize from '@/sequelize';
import { Settings as SettingsScheme } from '@/schemes/Settings';
import { AppSettings, appSettingsSchema } from '@/interfaces/common/Settings';
import { env } from '@/config/env';

class Settings {
	globalValues: { sensitiveDataEncryptionKey: string } = {
		sensitiveDataEncryptionKey: '',
	};

	private readonly dependantTables = [AppSequelize];

	initAndCheckSettings = async (): Promise<void> => {
		await sequelize.query(`REVOKE DELETE ON TABLE "${SettingsScheme.tableName}" FROM PUBLIC;`);

		const settingsRow = await SettingsScheme.findOne();

		let sensitiveDataEncryptionKey: string | undefined;

		if (!settingsRow) {
			this.dependantTables.forEach(async (table) => {
				const tableRowsCount = await table.count();

				if (tableRowsCount !== 0) {
					throw new Error('DB is already initialized. Unable to create settings row.');
				}
			});

			const accessPasswordSalt = CryptoJS.lib.WordArray.random(64).toString(CryptoJS.enc.Hex);

			const accessPasswordHash = crypto
				.scryptSync(env.ACCESS_PASSWORD, accessPasswordSalt, 128)
				.toString('hex');

			const accessPasswordDoubleHash = crypto
				.scryptSync(accessPasswordHash, accessPasswordSalt, 128)
				.toString('hex');

			const settings: AppSettings = {
				passwordHash: accessPasswordDoubleHash,
				passwordSalt: accessPasswordSalt,
			};

			await SettingsScheme.create({
				settings,
			});

			sensitiveDataEncryptionKey = accessPasswordHash;

			console.log(`Access password set correctly.`);
		} else {
			const { settings: settingsRaw } = settingsRow;

			const settings = appSettingsSchema.parse(settingsRaw);

			const { passwordHash, passwordSalt } = settings;

			const newPasswordHash = crypto
				.scryptSync(env.ACCESS_PASSWORD, passwordSalt, 128)
				.toString('hex');

			const newPasswordDoubleHash = crypto
				.scryptSync(newPasswordHash, passwordSalt, 128)
				.toString('hex');

			const isPasswordValid = newPasswordDoubleHash === passwordHash;

			if (!isPasswordValid) {
				throw new Error('Wrong ACCESS_PASSWORD. Access denied.');
			}

			sensitiveDataEncryptionKey = newPasswordHash;

			console.log(`Access password verified.`);
		}

		this.globalValues = Object.freeze({
			sensitiveDataEncryptionKey,
		});
	};
}

const settingsModel = new Settings();

export default settingsModel;
