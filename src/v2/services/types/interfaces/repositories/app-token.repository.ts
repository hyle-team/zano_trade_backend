import { AppToken } from '@/v2/entities/app-token.entity';
import { RepositoryFindMethodOptions } from './shared/types';

export interface IAppTokenRepository {
	findOne(params: RepositoryFindMethodOptions): Promise<AppToken | null>;
}
