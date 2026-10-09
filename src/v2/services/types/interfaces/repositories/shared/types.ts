import { CountOptions, CreateOptions, FindOptions, UpdateOptions } from 'sequelize';

export type RepositoryFindMethodOptions = FindOptions;
export type RepositoryUpdateMethodOptions = Omit<UpdateOptions, 'returning'>;
export type RepositoryCountMethodOptions = Omit<CountOptions, 'group'>;
export type RepositoryCreateMethodOptions = CreateOptions;
