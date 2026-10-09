import { App } from '@/v2/entities/app.entity';
import { IAppRepository } from '@/v2/services/types/interfaces/repositories/app.repository';
import {
	RepositoryCountMethodOptions,
	RepositoryCreateMethodOptions,
	RepositoryFindMethodOptions,
} from '@/v2/services/types/interfaces/repositories/shared/types';
import AppSequelize from '@/schemes/App';

export class AppRepository implements IAppRepository {
	private mapRowToEntity = (appRow: AppSequelize): App =>
		new App({
			id: appRow.id,
			name: appRow.name,
			userId: appRow.user_id,
		});

	findOne = async (params: RepositoryFindMethodOptions): Promise<App | null> => {
		const appRow = await AppSequelize.findOne(params);

		if (appRow === null) {
			return null;
		}

		const app = this.mapRowToEntity(appRow);
		return app;
	};

	count = async (params: RepositoryCountMethodOptions): Promise<number> => {
		const appsCount = await AppSequelize.count(params);
		return appsCount;
	};

	create = async (
		values: Record<string, unknown>,
		params?: RepositoryCreateMethodOptions,
	): Promise<App> => {
		const appRow = await AppSequelize.create(values, params);

		const app = this.mapRowToEntity(appRow);
		return app;
	};
}

export const appRepository = new AppRepository();
