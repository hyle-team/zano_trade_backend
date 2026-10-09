import { AppToken } from '@/v2/entities/app-token.entity';
import { RepositoryCreateMethodOptions, RepositoryFindMethodOptions } from './shared/types';

export interface IAppTokenRepository {
	findOne(params: RepositoryFindMethodOptions): Promise<AppToken | null>;
	create(
		values: Record<string, unknown>,
		params?: RepositoryCreateMethodOptions,
	): Promise<AppToken>;
}
