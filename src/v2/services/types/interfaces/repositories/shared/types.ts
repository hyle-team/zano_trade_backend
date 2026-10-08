import { Transaction } from 'sequelize';

export type RepositoryMethodOptions = {
	transaction?: Transaction;
};
