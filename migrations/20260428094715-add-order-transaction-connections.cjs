const TRANSACTIONS_TABLE_NAME = 'Transactions';
const ORDERS_TABLE_NAME = 'Orders';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up (queryInterface) {
		await queryInterface.addConstraint(TRANSACTIONS_TABLE_NAME, {
			fields: ['buy_order_id'],
			type: 'foreign key',
			name: 'Transactions_buy_order_id_fkey',
			references: {
				table: ORDERS_TABLE_NAME,
				field: 'id',
			},
		});

		await queryInterface.addConstraint(TRANSACTIONS_TABLE_NAME, {
			fields: ['sell_order_id'],
			type: 'foreign key',
			name: 'Transactions_sell_order_id_fkey',
			references: {
				table: ORDERS_TABLE_NAME,
				field: 'id',
			},
		});
	},

	async down (queryInterface) {
		await queryInterface.removeConstraint(TRANSACTIONS_TABLE_NAME, 'Transactions_buy_order_id_fkey');
		await queryInterface.removeConstraint(TRANSACTIONS_TABLE_NAME, 'Transactions_sell_order_id_fkey');
	}
};

