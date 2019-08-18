'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('page_permissions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      pageId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "pages",
          key: "id"
        }
      },
      roleId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "roles",
          key: "id"
        }
      },
      get: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      post: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      patch: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      delete: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('page_permissions');
  }
};