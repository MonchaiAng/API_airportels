'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('consolidation_details', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      consolidationId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "consolidations",
          key: "id"
        }
      },
      orderId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "orders",
          key: "id"
        }
      },
      type: {
        allowNull: false,
        type: Sequelize.ENUM,
        values: ["ORI", "DES"],
        defaultValue: "ORI"
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
    return queryInterface.dropTable('consolidation_details');
  }
};