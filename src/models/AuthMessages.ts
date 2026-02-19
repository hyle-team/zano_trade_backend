import { Transaction } from 'sequelize';

import AuthMessage from '@/schemes/AuthMessage';

class AuthMessagesModel {
	create = async (
		{
			address,
			alias,
			message,
			expiresAt,
		}: {
			address: string;
			alias: string;
			message: string;
			expiresAt: Date;
		},
		{ transaction }: { transaction?: Transaction } = {},
	): Promise<AuthMessage> => {
		const authMessage = await AuthMessage.create(
			{
				address,
				alias,
				message,
				expires_at: expiresAt,
			},
			{ transaction },
		);

		return authMessage;
	};

	findOne = async ({
		address,
		alias,
		message,
	}: {
		address: string;
		alias: string;
		message: string;
	}): Promise<AuthMessage | null> =>
		AuthMessage.findOne({
			where: {
				address,
				alias,
				message,
			},
		});

	deleteOne = async (
		{
			address,
			alias,
			message,
		}: {
			address: string;
			alias: string;
			message: string;
		},
		{ transaction }: { transaction?: Transaction } = {},
	): Promise<void> => {
		await AuthMessage.destroy({
			where: {
				address,
				alias,
				message,
			},
			transaction,
		});
	};
}

const authMessagesModel = new AuthMessagesModel();

export default authMessagesModel;
