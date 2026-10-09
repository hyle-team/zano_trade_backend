import { UniqueConstraintError } from 'sequelize';

import userModel from '@/models/User.js';
import { asymmetricEncryptionHelper } from '@/v2/helpers/asymmetric-encryption.helper.js';
import { CreateAppTokenServiceParams } from '@/v2/services/types/params/app-tokens/create-app-token.params.js';
import {
	CreateAppTokenServiceRes,
	CreateAppTokenServiceErrorCode,
} from '@/v2/services/types/responses/app-tokens/create-app-token.response.js';
import { GetAppTokenServiceParams } from '@/v2/services/types/params/app-tokens/get-app-token.params.js';
import {
	GetAppTokenServiceRes,
	GetAppTokenServiceErrorCode,
} from '@/v2/services/types/responses/app-tokens/get-app-token.response.js';
import { RegenerateAppTokenServiceParams } from '@/v2/services/types/params/app-tokens/regenerate-app-token.params.js';
import {
	RegenerateAppTokenServiceRes,
	RegenerateAppTokenServiceErrorCode,
} from '@/v2/services/types/responses/app-tokens/regenerate-app-token.response.js';
import { IAppRepository } from '@/v2/services/types/interfaces/repositories/app.repository';
import { appRepository } from '@/v2/database/repositories/app.repository';
import { IAppTokenRepository } from '@/v2/services/types/interfaces/repositories/app-token.repository';
import { appTokenRepository } from '@/v2/database/repositories/app-token.repository';
import { AppToken } from '@/v2/entities/app-token.entity';

class AppTokensService {
	private readonly appRepository: IAppRepository = appRepository;

	private readonly appTokenRepository: IAppTokenRepository = appTokenRepository;

	create = async ({
		appId,
		address,
		publicKeyHex,
	}: CreateAppTokenServiceParams): Promise<CreateAppTokenServiceRes> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return { success: false, data: CreateAppTokenServiceErrorCode.USER_NOT_FOUND };
		}

		const app = await this.appRepository.findOne({
			where: { id: appId, user_id: userRow.id },
		});

		if (!app) {
			return { success: false, data: CreateAppTokenServiceErrorCode.APP_NOT_FOUND };
		}

		const value = AppToken.generateValue();
		const valueEncryptedForStorage = AppToken.encryptValueForStorage({ valueDecrypted: value });

		const issuedAt = new Date();

		const {
			cipherDataHex: [valueEncryptedForTransmitHex, issuedAtEncryptedForTransmitHex],
			intermediateEncryptionPublicKeyHex,
		} = await asymmetricEncryptionHelper.encrypt({
			plainData: [value, issuedAt.toISOString()],
			publicKeyHex,
		});

		try {
			await this.appTokenRepository.create({
				app_id: app.id,
				value: valueEncryptedForStorage,
				issued_at: issuedAt,
			});

			return {
				success: true,
				data: {
					valueEncryptedHex: valueEncryptedForTransmitHex,
					issuedAtEncryptedHex: issuedAtEncryptedForTransmitHex,
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

		const app = await this.appRepository.findOne({
			where: { id: appId, user_id: userRow.id },
		});

		if (!app) {
			return { success: false, data: RegenerateAppTokenServiceErrorCode.APP_NOT_FOUND };
		}

		const value = AppToken.generateValue();
		const valueEncryptedForStorage = AppToken.encryptValueForStorage({ valueDecrypted: value });

		const issuedAt = new Date();

		const {
			cipherDataHex: [valueEncryptedForTransmitHex, issuedAtEncryptedForTransmitHex],
			intermediateEncryptionPublicKeyHex,
		} = await asymmetricEncryptionHelper.encrypt({
			plainData: [value, issuedAt.toISOString()],
			publicKeyHex,
		});

		const affectedRowsCount = await this.appTokenRepository.update(
			{ value: valueEncryptedForStorage, issued_at: issuedAt },
			{ where: { app_id: app.id } },
		);

		if (affectedRowsCount === 0) {
			return { success: false, data: RegenerateAppTokenServiceErrorCode.API_KEY_NOT_FOUND };
		}

		return {
			success: true,
			data: {
				valueEncryptedHex: valueEncryptedForTransmitHex,
				issuedAtEncryptedHex: issuedAtEncryptedForTransmitHex,
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

		const app = await this.appRepository.findOne({
			where: { id: appId, user_id: userRow.id },
		});

		if (!app) {
			return { success: false, data: GetAppTokenServiceErrorCode.APP_NOT_FOUND };
		}

		const appToken = await this.appTokenRepository.findOne({ where: { app_id: app.id } });

		if (!appToken) {
			return { success: false, data: GetAppTokenServiceErrorCode.API_KEY_NOT_FOUND };
		}

		const {
			cipherDataHex: [valueEncryptedForTransmitHex, issuedAtEncryptedForTransmitHex],
			intermediateEncryptionPublicKeyHex,
		} = await asymmetricEncryptionHelper.encrypt({
			plainData: [appToken.getValueDecrypted(), appToken.issuedAt.toISOString()],
			publicKeyHex,
		});

		return {
			success: true,
			data: {
				valueEncryptedHex: valueEncryptedForTransmitHex,
				issuedAtEncryptedHex: issuedAtEncryptedForTransmitHex,
				intermediateEncryptionPublicKeyHex,
			},
		};
	};
}

export const appTokensService = new AppTokensService();
