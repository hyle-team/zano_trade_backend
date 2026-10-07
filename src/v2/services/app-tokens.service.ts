import crypto from 'node:crypto';
import { UniqueConstraintError } from 'sequelize';
import CryptoJS from 'crypto-js';

import settingsModel from '@/models/Settings.js';
import App from '@/schemes/App.js';
import AppToken from '@/schemes/AppToken.js';
import userModel from '@/models/User.js';
import { asymmetricEncryptionHelper } from '@/helpers/AsymmetricEncryption.helper.js';
import CreateAppTokenServiceParams from '@/v2/interfaces/services/AppTokens/params/CreateAppTokenServiceParams.js';
import CreateAppTokenServiceRes, {
	CreateAppTokenServiceErrorCode,
} from '@/v2/interfaces/services/AppTokens/responses/CreateAppTokenServiceRes.js';
import GetAppTokenServiceParams from '@/v2/interfaces/services/AppTokens/params/GetAppTokenServiceParams.js';
import GetAppTokenServiceRes, {
	GetAppTokenServiceErrorCode,
} from '@/v2/interfaces/services/AppTokens/responses/GetAppTokenServiceRes.js';
import RegenerateAppTokenServiceParams from '@/v2/interfaces/services/AppTokens/params/RegenerateAppTokenServiceParams.js';
import RegenerateAppTokenServiceRes, {
	RegenerateAppTokenServiceErrorCode,
} from '@/v2/interfaces/services/AppTokens/responses/RegenerateAppTokenServiceRes.js';
import GetDecryptedAppTokenRowByAppIdServiceRes from '@/v2/interfaces/services/AppTokens/responses/GetDecryptedAppTokenRowByAppIdServiceRes';
import CreateAppTokenRowServiceRes from '@/v2/interfaces/services/AppTokens/responses/CreateAppTokenRowServiceRes';
import CreateAppTokenRowServiceParams from '@/v2/interfaces/services/AppTokens/params/CreateAppTokenRowServiceParams';

class AppTokensService {
	private readonly VALUE_BYTES_LENGTH = 32;

	private generateValue = (): string =>
		crypto.randomBytes(this.VALUE_BYTES_LENGTH).toString('base64');

	private encryptAppTokenForStorage = ({ plainValue }: { plainValue: string }): string => {
		const keyWords = CryptoJS.enc.Hex.parse(
			settingsModel.globalValues.sensitiveDataEncryptionKey,
		).words.slice(0, 8);
		const key = CryptoJS.lib.WordArray.create(keyWords);

		const salt = CryptoJS.lib.WordArray.random(16);

		const valueEncryptedBody = CryptoJS.AES.encrypt(plainValue, key, { iv: salt }).toString();

		const valueEncrypted = `env_v1__${salt.toString(CryptoJS.enc.Base64)}:${valueEncryptedBody}`;

		return valueEncrypted;
	};

	private decryptAppTokenFromStorage = ({
		valueEncrypted,
	}: {
		valueEncrypted: string;
	}): string => {
		const [headers, valueEncryptedBody] = valueEncrypted.split(':');
		const salt = CryptoJS.enc.Base64.parse(headers.replace('env_v1__', ''));

		const keyWords = CryptoJS.enc.Hex.parse(
			settingsModel.globalValues.sensitiveDataEncryptionKey,
		).words.slice(0, 8);
		const key = CryptoJS.lib.WordArray.create(keyWords);

		const valueDecrypted = CryptoJS.AES.decrypt(valueEncryptedBody, key, { iv: salt }).toString(
			CryptoJS.enc.Utf8,
		);

		return valueDecrypted;
	};

	private getDecryptedAppTokenRowByAppId = async ({
		appId,
	}: {
		appId: number;
	}): Promise<GetDecryptedAppTokenRowByAppIdServiceRes> => {
		const appTokenRow = await AppToken.findOne({
			where: {
				app_id: appId,
			},
		});

		if (!appTokenRow) {
			return null;
		}

		const valueEncrypted = appTokenRow.value;

		const valueDecrypted = this.decryptAppTokenFromStorage({
			valueEncrypted,
		});

		return {
			id: appTokenRow.id,
			appId: appTokenRow.app_id,
			value: valueDecrypted,
			issuedAt: appTokenRow.issued_at,
		};
	};

	private createAppTokenRow = async ({
		appId,
		plainValue,
		issuedAt,
	}: CreateAppTokenRowServiceParams): Promise<CreateAppTokenRowServiceRes> => {
		const valueEncrypted = this.encryptAppTokenForStorage({
			plainValue,
		});

		await AppToken.create({
			app_id: appId,
			value: valueEncrypted,
			issued_at: issuedAt,
		});

		return {
			success: true,
			data: null,
		};
	};

	create = async ({
		appId,
		address,
		publicKeyHex,
	}: CreateAppTokenServiceParams): Promise<CreateAppTokenServiceRes> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return { success: false, data: CreateAppTokenServiceErrorCode.USER_NOT_FOUND };
		}

		const appRow = await App.findOne({ where: { id: appId, user_id: userRow.id } });

		if (!appRow) {
			return { success: false, data: CreateAppTokenServiceErrorCode.APP_NOT_FOUND };
		}

		const value = this.generateValue();
		const issuedAt = new Date();

		const {
			cipherDataHex: [valueEncryptedHex, issuedAtEncryptedHex],
			intermediateEncryptionPublicKeyHex,
		} = await asymmetricEncryptionHelper.encrypt({
			plainData: [value, issuedAt.toISOString()],
			publicKeyHex,
		});

		try {
			await this.createAppTokenRow({
				appId: appRow.id,
				plainValue: value,
				issuedAt,
			});

			return {
				success: true,
				data: {
					valueEncryptedHex,
					issuedAtEncryptedHex,
					intermediateEncryptionPublicKeyHex,
				},
			};
		} catch (error) {
			if (error instanceof UniqueConstraintError) {
				return {
					success: false,
					data: CreateAppTokenServiceErrorCode.API_KEY_ALREADY_EXISTS,
				};
			}

			throw error;
		}
	};

	regenerate = async ({
		appId,
		address,
		publicKeyHex,
	}: RegenerateAppTokenServiceParams): Promise<RegenerateAppTokenServiceRes> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return { success: false, data: RegenerateAppTokenServiceErrorCode.USER_NOT_FOUND };
		}

		const appRow = await App.findOne({ where: { id: appId, user_id: userRow.id } });

		if (!appRow) {
			return { success: false, data: RegenerateAppTokenServiceErrorCode.APP_NOT_FOUND };
		}

		const value = this.generateValue();
		const issuedAt = new Date();

		const {
			cipherDataHex: [valueEncryptedHex, issuedAtEncryptedHex],
			intermediateEncryptionPublicKeyHex,
		} = await asymmetricEncryptionHelper.encrypt({
			plainData: [value, issuedAt.toISOString()],
			publicKeyHex,
		});

		const [affectedRowsCount] = await AppToken.update(
			{ value, issued_at: issuedAt },
			{ where: { app_id: appRow.id } },
		);

		if (affectedRowsCount === 0) {
			return { success: false, data: RegenerateAppTokenServiceErrorCode.API_KEY_NOT_FOUND };
		}

		return {
			success: true,
			data: {
				valueEncryptedHex,
				issuedAtEncryptedHex,
				intermediateEncryptionPublicKeyHex,
			},
		};
	};

	getOne = async ({
		appId,
		address,
		publicKeyHex,
	}: GetAppTokenServiceParams): Promise<GetAppTokenServiceRes> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return { success: false, data: GetAppTokenServiceErrorCode.USER_NOT_FOUND };
		}

		const appRow = await App.findOne({ where: { id: appId, user_id: userRow.id } });

		if (!appRow) {
			return { success: false, data: GetAppTokenServiceErrorCode.APP_NOT_FOUND };
		}

		const tokenRow = await this.getDecryptedAppTokenRowByAppId({ appId: appRow.id });

		if (!tokenRow) {
			return { success: false, data: GetAppTokenServiceErrorCode.API_KEY_NOT_FOUND };
		}

		const {
			cipherDataHex: [valueEncryptedHex, issuedAtEncryptedHex],
			intermediateEncryptionPublicKeyHex,
		} = await asymmetricEncryptionHelper.encrypt({
			plainData: [tokenRow.value, tokenRow.issuedAt.toISOString()],
			publicKeyHex,
		});

		return {
			success: true,
			data: {
				valueEncryptedHex,
				issuedAtEncryptedHex,
				intermediateEncryptionPublicKeyHex,
			},
		};
	};
}

const appTokensService = new AppTokensService();

export default appTokensService;
