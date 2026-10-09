import { App } from '@/v2/entities/app.entity';
import {
	RepositoryCountMethodOptions,
	RepositoryCreateMethodOptions,
	RepositoryFindMethodOptions,
} from './shared/types';

export interface IAppRepository {
	findOne(params: RepositoryFindMethodOptions): Promise<App | null>;
	count(params: RepositoryCountMethodOptions): Promise<number>;
	create(values: Record<string, unknown>, params?: RepositoryCreateMethodOptions): Promise<App>;
}
