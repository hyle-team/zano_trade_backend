const TRANSACTIONS_TABLE_NAME = 'Transactions';
const ORDERS_TABLE_NAME = 'Orders';

const TRANSACTIONS_TABLE_BUY_ORDER_ID_FKEY_NAME = 'Transactions_buy_order_id_fkey';
const TRANSACTIONS_TABLE_SELL_ORDER_ID_FKEY_NAME = 'Transactions_sell_order_id_fkey';
const TRANSACTIONS_TABLE_BUY_ORDER_ID_SELL_ORDER_ID_INDEX_NAME = 'transactions_buy_order_id_sell_order_id';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up (queryInterface) {
		await queryInterface.addConstraint(TRANSACTIONS_TABLE_NAME, {
			fields: ['buy_order_id'],
			type: 'foreign key',
			name: TRANSACTIONS_TABLE_BUY_ORDER_ID_FKEY_NAME,
			references: {
				table: ORDERS_TABLE_NAME,
				field: 'id',
			},
		});

		await queryInterface.addConstraint(TRANSACTIONS_TABLE_NAME, {
			fields: ['sell_order_id'],
			type: 'foreign key',
			name: TRANSACTIONS_TABLE_SELL_ORDER_ID_FKEY_NAME,
			references: {
				table: ORDERS_TABLE_NAME,
				field: 'id',
			},
		});

		await queryInterface.addIndex(TRANSACTIONS_TABLE_NAME, {
			name: TRANSACTIONS_TABLE_BUY_ORDER_ID_SELL_ORDER_ID_INDEX_NAME,
			fields: ['buy_order_id', 'sell_order_id'],
			unique: true,
			where: {
				status: 'pending',
			},
		});
	},

	async down (queryInterface) {
		await queryInterface.removeConstraint(TRANSACTIONS_TABLE_NAME, TRANSACTIONS_TABLE_BUY_ORDER_ID_FKEY_NAME);
		await queryInterface.removeConstraint(TRANSACTIONS_TABLE_NAME, TRANSACTIONS_TABLE_SELL_ORDER_ID_FKEY_NAME);
		await queryInterface.removeIndex(TRANSACTIONS_TABLE_NAME, TRANSACTIONS_TABLE_BUY_ORDER_ID_SELL_ORDER_ID_INDEX_NAME);
	}
};

