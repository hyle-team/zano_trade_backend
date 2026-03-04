const ORDERS_TABLE_NAME = 'Orders';
const MIN_PER_APPLY_AMOUNT_COLUMN_NAME = 'min_per_apply_amount';
const MAX_PER_APPLY_AMOUNT_COLUMN_NAME = 'max_per_apply_amount';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up (queryInterface, Sequelize) {
		await queryInterface.addColumn(ORDERS_TABLE_NAME, MIN_PER_APPLY_AMOUNT_COLUMN_NAME, {
			type: Sequelize.DataTypes.STRING,
			allowNull: true,
			defaultValue: null,
		});

		await queryInterface.addColumn(ORDERS_TABLE_NAME, MAX_PER_APPLY_AMOUNT_COLUMN_NAME, {
			type: Sequelize.DataTypes.STRING,
			allowNull: true,
			defaultValue: null,
		});
	},

	async down (queryInterface) {
		await queryInterface.removeColumn(ORDERS_TABLE_NAME, MIN_PER_APPLY_AMOUNT_COLUMN_NAME);

		await queryInterface.removeColumn(ORDERS_TABLE_NAME, MAX_PER_APPLY_AMOUNT_COLUMN_NAME);
	}
};
