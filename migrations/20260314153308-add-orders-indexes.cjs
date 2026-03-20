
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('Orders', ['pair_id', 'type', 'status', 'price'], {
      name: 'orders_pair_id_type_status_price',
    });
    await queryInterface.addIndex('Orders', ['pair_id'], {
      name: 'orders_pair_id',
    });
    await queryInterface.addIndex('Orders', ['user_id'], {
      name: 'orders_user_id',
    });
    await queryInterface.addIndex('Orders', ['timestamp'], {
      name: 'orders_timestamp',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Orders', 'orders_pair_id_type_status_price');
    await queryInterface.removeIndex('Orders', 'orders_pair_id');
    await queryInterface.removeIndex('Orders', 'orders_user_id');
    await queryInterface.removeIndex('Orders', 'orders_timestamp');
  },
};
