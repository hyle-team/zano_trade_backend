import { App } from '@/v2/entities/app.entity';
import { IAppRepository } from '@/v2/services/types/interfaces/repositories/app.repository';
import { RepositoryFindMethodOptions } from '@/v2/services/types/interfaces/repositories/shared/types';
import AppSequelize from '@/schemes/App';

export class AppRepository implements IAppRepository {
	private mapRowToEntity = (appRow: AppSequelize): App =>
		new App({
			id: appRow.id,
			name: appRow.name,
			userId: appRow.user_id,
		});

	findOneById = async (params: RepositoryFindMethodOptions): Promise<App | null> => {
		const appRow = await AppSequelize.findOne(params);

		if (appRow === null) {
			return null;
		}

		const app = this.mapRowToEntity(appRow);
		return app;
	};
}

export const appRepository = new AppRepository();
