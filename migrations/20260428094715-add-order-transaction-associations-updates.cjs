const TRANSACTIONS_TABLE_NAME = 'Transactions';
const ORDERS_TABLE_NAME = 'Orders';

const TRANSACTIONS_TABLE_BUY_ORDER_ID_FKEY_NAME = 'Transactions_buy_order_id_fkey';
const TRANSACTIONS_TABLE_SELL_ORDER_ID_FKEY_NAME = 'Transactions_sell_order_id_fkey';
const TRANSACTIONS_TABLE_FKEY_NAMES = [
	TRANSACTIONS_TABLE_BUY_ORDER_ID_FKEY_NAME,
	TRANSACTIONS_TABLE_SELL_ORDER_ID_FKEY_NAME,
];

async function getDeFactoApplied(queryInterface) {
	const foreignKeyReferences = await queryInterface.getForeignKeyReferencesForTable(TRANSACTIONS_TABLE_NAME);
	const foreignKeyNames = foreignKeyReferences.map(({ constraintName }) => constraintName);

	return TRANSACTIONS_TABLE_FKEY_NAMES.every((constraintName) => foreignKeyNames.includes(constraintName));
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up (queryInterface) {
		const deFactoApplied = await getDeFactoApplied(queryInterface);

		if (deFactoApplied) return;

		await queryInterface.addConstraint(TRANSACTIONS_TABLE_NAME, {
			fields: ['buy_order_id'],
			type: 'foreign key',
			name: TRANSACTIONS_TABLE_BUY_ORDER_ID_FKEY_NAME,
			onDelete: 'CASCADE',
			onUpdate: 'CASCADE',
			references: {
				table: ORDERS_TABLE_NAME,
				field: 'id',
			},
		});

		await queryInterface.addConstraint(TRANSACTIONS_TABLE_NAME, {
			fields: ['sell_order_id'],
			type: 'foreign key',
			name: TRANSACTIONS_TABLE_SELL_ORDER_ID_FKEY_NAME,
			onDelete: 'CASCADE',
			onUpdate: 'CASCADE',
			references: {
				table: ORDERS_TABLE_NAME,
				field: 'id',
			},
		});
	},

	async down (queryInterface) {
		const deFactoApplied = await getDeFactoApplied(queryInterface);

		if (!deFactoApplied) return;

		await queryInterface.removeConstraint(TRANSACTIONS_TABLE_NAME, TRANSACTIONS_TABLE_BUY_ORDER_ID_FKEY_NAME);
		await queryInterface.removeConstraint(TRANSACTIONS_TABLE_NAME, TRANSACTIONS_TABLE_SELL_ORDER_ID_FKEY_NAME);
	}
};

