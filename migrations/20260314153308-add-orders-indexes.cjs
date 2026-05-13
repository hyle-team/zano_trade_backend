
const ORDERS_TABLE_NAME = 'Orders';
const INDEX_NAMES = [
  'orders_pair_id_type_status_price',
  'orders_pair_id',
  'orders_user_id',
  'orders_timestamp',
];

async function getDeFactoApplied(queryInterface) {
  const indexes = await queryInterface.showIndex(ORDERS_TABLE_NAME);

  return INDEX_NAMES.every((indexName) => indexes.some(({ name }) => name === indexName));
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const deFactoApplied = await getDeFactoApplied(queryInterface);

    if (deFactoApplied) return;

    await queryInterface.addIndex(ORDERS_TABLE_NAME, ['pair_id', 'type', 'status', 'price'], {
      name: 'orders_pair_id_type_status_price',
    });
    await queryInterface.addIndex(ORDERS_TABLE_NAME, ['pair_id'], {
      name: 'orders_pair_id',
    });
    await queryInterface.addIndex(ORDERS_TABLE_NAME, ['user_id'], {
      name: 'orders_user_id',
    });
    await queryInterface.addIndex(ORDERS_TABLE_NAME, ['timestamp'], {
      name: 'orders_timestamp',
    });
  },

  async down(queryInterface) {
    const deFactoApplied = await getDeFactoApplied(queryInterface);

    if (!deFactoApplied) return;

    await queryInterface.removeIndex(ORDERS_TABLE_NAME, 'orders_pair_id_type_status_price');
    await queryInterface.removeIndex(ORDERS_TABLE_NAME, 'orders_pair_id');
    await queryInterface.removeIndex(ORDERS_TABLE_NAME, 'orders_user_id');
    await queryInterface.removeIndex(ORDERS_TABLE_NAME, 'orders_timestamp');
  },
};
