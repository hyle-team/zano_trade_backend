'use strict';

const TRANSACTIONS_TABLE_NAME = 'Transactions';
const FINALIZE_TIMESTAMP_COLUMN_NAME = 'finalize_timestamp';
const FINALIZE_TIMESTAMP_INDEX_NAME = 'transactions_finalize_timestamp';

async function getDeFactoApplied(queryInterface) {
  const tableDescription = await queryInterface.describeTable(TRANSACTIONS_TABLE_NAME);

  return Boolean(tableDescription[FINALIZE_TIMESTAMP_COLUMN_NAME]);
}

async function backfillFromUpdatedAt(queryInterface) {
  const BACKFILL_BATCH_SIZE = 5000;

  let batchesDone = 0;

  while (true) {
    const [rows] = await queryInterface.sequelize.query(
      `SELECT "id" FROM "${TRANSACTIONS_TABLE_NAME}"
       WHERE "status" <> 'pending' AND "${FINALIZE_TIMESTAMP_COLUMN_NAME}" IS NULL
       ORDER BY "id"
       LIMIT ${BACKFILL_BATCH_SIZE}`,
    );

    if (rows.length === 0) break;

    const ids = rows.map((row) => Number(row.id)).join(',');

    await queryInterface.sequelize.query(
      `UPDATE "${TRANSACTIONS_TABLE_NAME}"
       SET "${FINALIZE_TIMESTAMP_COLUMN_NAME}" = (EXTRACT(EPOCH FROM "updatedAt") * 1000)::bigint
       WHERE "id" IN (${ids})`,
    );

    batchesDone += 1;

    console.log(
      `${FINALIZE_TIMESTAMP_COLUMN_NAME} backfill: ${batchesDone} batch(es) done, ${rows.length} row(s) in the last one`,
    );
  }
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const deFactoApplied = await getDeFactoApplied(queryInterface);

    if (deFactoApplied) return;

    await queryInterface.addColumn(TRANSACTIONS_TABLE_NAME, FINALIZE_TIMESTAMP_COLUMN_NAME, {
      type: Sequelize.DataTypes.BIGINT,
      allowNull: true,
      defaultValue: null,
    });

    await backfillFromUpdatedAt(queryInterface);

    await queryInterface.addIndex(TRANSACTIONS_TABLE_NAME, [FINALIZE_TIMESTAMP_COLUMN_NAME], {
      name: FINALIZE_TIMESTAMP_INDEX_NAME,
      concurrently: true,
    });
  },

  async down(queryInterface) {
    const deFactoApplied = await getDeFactoApplied(queryInterface);

    if (!deFactoApplied) return;

    await queryInterface.removeIndex(TRANSACTIONS_TABLE_NAME, FINALIZE_TIMESTAMP_INDEX_NAME);

    await queryInterface.removeColumn(TRANSACTIONS_TABLE_NAME, FINALIZE_TIMESTAMP_COLUMN_NAME);
  },
};
