'use strict';

const USERS_TABLE_NAME = 'Users';
const ORDERS_TABLE_NAME = 'Orders';
const EMAIL_COLUMN_NAME = 'email';
const EMAIL_NOTIFICATIONS_COLUMN_NAME = 'email_notifications';

async function hasColumn(queryInterface, tableName, columnName) {
  const tableDescription = await queryInterface.describeTable(tableName);

  return Boolean(tableDescription[columnName]);
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await hasColumn(queryInterface, USERS_TABLE_NAME, EMAIL_COLUMN_NAME))) {
      await queryInterface.addColumn(USERS_TABLE_NAME, EMAIL_COLUMN_NAME, {
        type: Sequelize.DataTypes.STRING(254),
        allowNull: true,
        defaultValue: null,
      });
    }

    if (!(await hasColumn(queryInterface, ORDERS_TABLE_NAME, EMAIL_NOTIFICATIONS_COLUMN_NAME))) {
      await queryInterface.addColumn(ORDERS_TABLE_NAME, EMAIL_NOTIFICATIONS_COLUMN_NAME, {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface) {
    if (await hasColumn(queryInterface, ORDERS_TABLE_NAME, EMAIL_NOTIFICATIONS_COLUMN_NAME)) {
      await queryInterface.removeColumn(ORDERS_TABLE_NAME, EMAIL_NOTIFICATIONS_COLUMN_NAME);
    }

    if (await hasColumn(queryInterface, USERS_TABLE_NAME, EMAIL_COLUMN_NAME)) {
      await queryInterface.removeColumn(USERS_TABLE_NAME, EMAIL_COLUMN_NAME);
    }
  },
};
