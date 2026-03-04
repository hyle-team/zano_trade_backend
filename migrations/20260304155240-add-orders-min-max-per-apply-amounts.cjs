const ORDERS_TABLE_NAME = 'Orders';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up (queryInterface, Sequelize) {
		await queryInterface.addColumn(ORDERS_TABLE_NAME, 'min_apply_amount', {
			type: Sequelize.DataTypes.STRING,
			allowNull: true,
			defaultValue: null,
		});

		await queryInterface.addColumn(ORDERS_TABLE_NAME, 'max_apply_amount', {
			type: Sequelize.DataTypes.STRING,
			allowNull: true,
			defaultValue: null,
		});
	},

	async down (queryInterface) {
		await queryInterface.removeColumn(ORDERS_TABLE_NAME, 'min_apply_amount');

		await queryInterface.removeColumn(ORDERS_TABLE_NAME, 'max_apply_amount');
	}
};
