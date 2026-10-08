import { App } from '@/v2/entities/app.entity';
import { RepositoryMethodOptions } from './shared/types';

export interface IAppRepository {
	findOneById(
		params: {
			id: number;
		},
		options: RepositoryMethodOptions,
	): Promise<App>;
}
