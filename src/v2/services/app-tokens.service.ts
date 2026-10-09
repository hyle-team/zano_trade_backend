import { UniqueConstraintError } from 'sequelize';

import userModel from '@/models/User.js';
import { asymmetricEncryptionHelper } from '@/v2/helpers/asymmetric-encryption.helper.js';
import { IAppRepository } from '@/v2/services/types/interfaces/repositories/app.repository';
import { appRepository } from '@/v2/database/repositories/app.repository';
import { IAppTokenRepository } from '@/v2/services/types/interfaces/repositories/app-token.repository';
import { appTokenRepository } from '@/v2/database/repositories/app-token.repository';
import { AppToken } from '@/v2/entities/app-token.entity';
import { Services } from '@/v2/services/types';

class AppTokensService {
	private readonly appRepository: IAppRepository = appRepository;

	private readonly appTokenRepository: IAppTokenRepository = appTokenRepository;

	create = async ({
		appId,
		address,
		publicKeyHex,
	}: Services.Params.CreateAppTokenDTO): Promise<Services.Responses.CreateAppTokenDTO> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return {
				success: false,
				data: Services.Responses.CreateAppTokenErrorCode.USER_NOT_FOUND,
			};
		}

		const app = await this.appRepository.findOne({
			where: { id: appId, user_id: userRow.id },
		});

		if (!app) {
			return {
				success: false,
				data: Services.Responses.CreateAppTokenErrorCode.APP_NOT_FOUND,
			};
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
					data: Services.Responses.CreateAppTokenErrorCode.API_KEY_ALREADY_EXISTS,
				};
			}

			throw error;
		}
	};

	regenerate = async ({
		appId,
		address,
		publicKeyHex,
	}: Services.Params.RegenerateAppTokenDTO): Promise<Services.Responses.RegenerateAppTokenDTO> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return {
				success: false,
				data: Services.Responses.RegenerateAppTokenErrorCode.USER_NOT_FOUND,
			};
		}

		const app = await this.appRepository.findOne({
			where: { id: appId, user_id: userRow.id },
		});

		if (!app) {
			return {
				success: false,
				data: Services.Responses.RegenerateAppTokenErrorCode.APP_NOT_FOUND,
			};
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
			return {
				success: false,
				data: Services.Responses.RegenerateAppTokenErrorCode.API_KEY_NOT_FOUND,
			};
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
	}: Services.Params.GetAppTokenDTO): Promise<Services.Responses.GetAppTokenDTO> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return {
				success: false,
				data: Services.Responses.GetAppTokenErrorCode.USER_NOT_FOUND,
			};
		}

		const app = await this.appRepository.findOne({
			where: { id: appId, user_id: userRow.id },
		});

		if (!app) {
			return {
				success: false,
				data: Services.Responses.GetAppTokenErrorCode.APP_NOT_FOUND,
			};
		}

		const appToken = await this.appTokenRepository.findOne({ where: { app_id: app.id } });

		if (!appToken) {
			return {
				success: false,
				data: Services.Responses.GetAppTokenErrorCode.API_KEY_NOT_FOUND,
			};
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
