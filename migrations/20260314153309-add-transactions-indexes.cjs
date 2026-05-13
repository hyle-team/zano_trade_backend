const TRANSACTIONS_TABLE_NAME = 'Transactions';
const INDEX_NAMES = [
  'transactions_buy_order_id_status',
  'transactions_sell_order_id_status',
  'transactions_timestamp',
];

async function getDeFactoApplied(queryInterface) {
  const indexes = await queryInterface.showIndex(TRANSACTIONS_TABLE_NAME);

  return INDEX_NAMES.every((indexName) => indexes.some(({ name }) => name === indexName));
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const deFactoApplied = await getDeFactoApplied(queryInterface);

    if (deFactoApplied) return;

    await queryInterface.addIndex(TRANSACTIONS_TABLE_NAME, ['buy_order_id', 'status'], {
      name: 'transactions_buy_order_id_status',
    });
    await queryInterface.addIndex(TRANSACTIONS_TABLE_NAME, ['sell_order_id', 'status'], {
      name: 'transactions_sell_order_id_status',
    });
    await queryInterface.addIndex(TRANSACTIONS_TABLE_NAME, ['timestamp'], {
      name: 'transactions_timestamp',
    });
  },

  async down(queryInterface) {
    const deFactoApplied = await getDeFactoApplied(queryInterface);

    if (!deFactoApplied) return;

    await queryInterface.removeIndex(TRANSACTIONS_TABLE_NAME, 'transactions_buy_order_id_status');
    await queryInterface.removeIndex(TRANSACTIONS_TABLE_NAME, 'transactions_sell_order_id_status');
    await queryInterface.removeIndex(TRANSACTIONS_TABLE_NAME, 'transactions_timestamp');
  },
};
