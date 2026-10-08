import { App } from '@/v2/entities/app.entity';
import { RepositoryCountMethodOptions, RepositoryFindMethodOptions } from './shared/types';

export interface IAppRepository {
	findOneById(params: RepositoryFindMethodOptions): Promise<App | null>;
	count(params: RepositoryCountMethodOptions): Promise<number>;
}
