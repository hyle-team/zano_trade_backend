/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('Transactions', ['buy_order_id', 'status'], {
      name: 'transactions_buy_order_id_status',
    });
    await queryInterface.addIndex('Transactions', ['sell_order_id', 'status'], {
      name: 'transactions_sell_order_id_status',
    });
    await queryInterface.addIndex('Transactions', ['timestamp'], {
      name: 'transactions_timestamp',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Transactions', 'transactions_buy_order_id_status');
    await queryInterface.removeIndex('Transactions', 'transactions_sell_order_id_status');
    await queryInterface.removeIndex('Transactions', 'transactions_timestamp');
  },
};
