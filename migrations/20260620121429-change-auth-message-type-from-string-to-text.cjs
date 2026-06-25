'use strict';

const AUTH_MESSAGE_TABLE_NAME = 'AuthMessages';
const AUTH_MESSAGE_TABLE_MESSAGE_COLUMN_NAME = 'message';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn(AUTH_MESSAGE_TABLE_NAME, AUTH_MESSAGE_TABLE_MESSAGE_COLUMN_NAME, {
      type: Sequelize.TEXT,
      allowNull: false,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn(AUTH_MESSAGE_TABLE_NAME, AUTH_MESSAGE_TABLE_MESSAGE_COLUMN_NAME, {
      type: Sequelize.STRING,
      allowNull: false,
    });
  }
};
