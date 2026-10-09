import { AppToken } from '@/v2/entities/app-token.entity';
import { IAppTokenRepository } from '@/v2/services/types/interfaces/repositories/app-token.repository';
import {
	RepositoryCreateMethodOptions,
	RepositoryFindMethodOptions,
} from '@/v2/services/types/interfaces/repositories/shared/types';
import { AppTokenSequelize } from '@/v2/database/schemes/app-token.scheme';

export class AppTokenRepository implements IAppTokenRepository {
	private mapRowToEntity = (appTokenRow: AppTokenSequelize): AppToken =>
		new AppToken({
			id: appTokenRow.id,
			appId: appTokenRow.app_id,
			value: appTokenRow.value,
			issuedAt: appTokenRow.issued_at,
		});

	findOne = async (params: RepositoryFindMethodOptions): Promise<AppToken | null> => {
		const appTokenRow = await AppTokenSequelize.findOne(params);

		if (appTokenRow === null) {
			return null;
		}

		const appToken = this.mapRowToEntity(appTokenRow);
		return appToken;
	};

	create = async (
		values: Record<string, unknown>,
		params?: RepositoryCreateMethodOptions,
	): Promise<AppToken> => {
		const appTokenRow = await AppTokenSequelize.create(values, params);

		const appToken = this.mapRowToEntity(appTokenRow);
		return appToken;
	};
}

export const appTokenRepository = new AppTokenRepository();
