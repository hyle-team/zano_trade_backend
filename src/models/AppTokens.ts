import crypto from 'node:crypto';
import { UniqueConstraintError } from 'sequelize';

import App from '@/schemes/App.js';
import AppToken from '@/schemes/AppToken.js';
import userModel from '@/models/User.js';
import CreateAppTokenModelParams from '@/interfaces/models/AppTokens/params/CreateAppTokenModelParams.js';
import CreateAppTokenModelRes, {
	CreateAppTokenModelErrorCode,
} from '@/interfaces/models/AppTokens/responses/CreateAppTokenModelRes.js';
import RegenerateAppTokenModelParams from '@/interfaces/models/AppTokens/params/RegenerateAppTokenModelParams.js';
import RegenerateAppTokenModelRes, {
	RegenerateAppTokenModelErrorCode,
} from '@/interfaces/models/AppTokens/responses/RegenerateAppTokenModelRes.js';

class AppTokens {
	private readonly VALUE_BYTES_LENGTH = 32;

	private generateValue = (): string =>
		crypto.randomBytes(this.VALUE_BYTES_LENGTH).toString('base64url');

	create = async ({
		appId,
		address,
	}: CreateAppTokenModelParams): Promise<CreateAppTokenModelRes> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return { success: false, data: CreateAppTokenModelErrorCode.USER_NOT_FOUND };
		}

		const appRow = await App.findOne({ where: { id: appId, user_id: userRow.id } });

		if (!appRow) {
			return { success: false, data: CreateAppTokenModelErrorCode.APP_NOT_FOUND };
		}

		try {
			const tokenRow = await AppToken.create({
				app_id: appRow.id,
				value: this.generateValue(),
				issued_at: new Date(),
			});

			return {
				success: true,
				data: {
					value: tokenRow.value,
					issuedAt: tokenRow.issued_at,
				},
			};
		} catch (error) {
			if (error instanceof UniqueConstraintError) {
				return {
					success: false,
					data: CreateAppTokenModelErrorCode.API_KEY_ALREADY_EXISTS,
				};
			}

			throw error;
		}
	};

	regenerate = async ({
		appId,
		address,
	}: RegenerateAppTokenModelParams): Promise<RegenerateAppTokenModelRes> => {
		const userRow = await userModel.getUserRow(address);

		if (!userRow) {
			return { success: false, data: RegenerateAppTokenModelErrorCode.USER_NOT_FOUND };
		}

		const appRow = await App.findOne({ where: { id: appId, user_id: userRow.id } });

		if (!appRow) {
			return { success: false, data: RegenerateAppTokenModelErrorCode.APP_NOT_FOUND };
		}

		const value = this.generateValue();
		const issuedAt = new Date();

		const [affectedRowsCount] = await AppToken.update(
			{ value, issued_at: issuedAt },
			{ where: { app_id: appRow.id } },
		);

		if (affectedRowsCount === 0) {
			return { success: false, data: RegenerateAppTokenModelErrorCode.API_KEY_NOT_FOUND };
		}

		return {
			success: true,
			data: {
				value,
				issuedAt,
			},
		};
	};
}

const appTokensModel = new AppTokens();

export default appTokensModel;
