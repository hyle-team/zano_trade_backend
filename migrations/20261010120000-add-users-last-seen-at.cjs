'use strict';

const USERS_TABLE_NAME = 'Users';
const LAST_SEEN_AT_COLUMN_NAME = 'last_seen_at';
const LAST_SEEN_AT_INDEX_NAME = 'users_last_seen_at';

async function getDeFactoApplied(queryInterface) {
  const tableDescription = await queryInterface.describeTable(USERS_TABLE_NAME);

  return Boolean(tableDescription[LAST_SEEN_AT_COLUMN_NAME]);
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const deFactoApplied = await getDeFactoApplied(queryInterface);

    if (deFactoApplied) return;

    await queryInterface.addColumn(USERS_TABLE_NAME, LAST_SEEN_AT_COLUMN_NAME, {
      type: Sequelize.DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.sequelize.query(
      `UPDATE "${USERS_TABLE_NAME}" SET "${LAST_SEEN_AT_COLUMN_NAME}" = NOW()`,
    );

    await queryInterface.addIndex(USERS_TABLE_NAME, [LAST_SEEN_AT_COLUMN_NAME], {
      name: LAST_SEEN_AT_INDEX_NAME,
    });
  },

  async down(queryInterface) {
    const deFactoApplied = await getDeFactoApplied(queryInterface);

    if (!deFactoApplied) return;

    await queryInterface.removeIndex(USERS_TABLE_NAME, LAST_SEEN_AT_INDEX_NAME);

    await queryInterface.removeColumn(USERS_TABLE_NAME, LAST_SEEN_AT_COLUMN_NAME);
  },
};
