import { App } from '@/v2/entities/app.entity';
import {
	AppWithApiKeyCountEntry,
	IAppRepository,
} from '@/v2/services/types/interfaces/repositories/app.repository';
import {
	RepositoryCountMethodOptions,
	RepositoryCreateMethodOptions,
	RepositoryFindMethodOptions,
	RepositoryUpdateMethodOptions,
} from '@/v2/services/types/interfaces/repositories/shared/types';
import AppSequelize from '@/schemes/App';
import AppToken from '@/schemes/AppToken.js';
import sequelize from '@/sequelize.js';

export interface AppWithApiKeyCount {
	id: number;
	name: string;
	api_key_count: string;
}

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

	findAllWithApiKeyCount = async ({
		userId,
	}: {
		userId: number;
	}): Promise<AppWithApiKeyCountEntry[]> => {
		const appRows = (await AppSequelize.findAll({
			where: { user_id: userId },
			attributes: [
				'id',
				'name',
				[sequelize.fn('COUNT', sequelize.col('AppToken.id')), 'api_key_count'],
			],
			include: [{ model: AppToken, attributes: [] }],
			group: ['App.id'],
			order: [['id', 'ASC']],
			raw: true,
		})) as unknown as AppWithApiKeyCount[];

		return appRows.map((appRow) => ({
			app: new App({ id: appRow.id, name: appRow.name, userId }),
			apiKeyCount: Number(appRow.api_key_count),
		}));
	};

	update = async (
		values: Record<string, unknown>,
		params: RepositoryUpdateMethodOptions,
	): Promise<number> => {
		const [affectedRowsCount] = await AppSequelize.update(values, params);
		return affectedRowsCount;
	};
}

export const appRepository = new AppRepository();
