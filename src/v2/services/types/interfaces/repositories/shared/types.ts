import { CountOptions, FindOptions, UpdateOptions } from 'sequelize';

export type RepositoryFindMethodOptions = FindOptions;
export type RepositoryUpdateMethodOptions = UpdateOptions;
export type RepositoryCountMethodOptions = Omit<CountOptions, 'group'>;
