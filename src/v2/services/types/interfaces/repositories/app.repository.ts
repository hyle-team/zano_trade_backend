import { App } from '@/v2/entities/app.entity';
import {
	RepositoryCountMethodOptions,
	RepositoryCreateMethodOptions,
	RepositoryFindMethodOptions,
} from './shared/types';

export type AppWithApiKeyCountEntry = {
	app: App;
	apiKeyCount: number;
};

export interface IAppRepository {
	findOne(params: RepositoryFindMethodOptions): Promise<App | null>;
	count(params: RepositoryCountMethodOptions): Promise<number>;
	create(values: Record<string, unknown>, params?: RepositoryCreateMethodOptions): Promise<App>;
	findAllWithApiKeyCount(params: { userId: number }): Promise<AppWithApiKeyCountEntry[]>;
}
