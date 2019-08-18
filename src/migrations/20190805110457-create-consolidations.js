'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('consolidations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fromPlanId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "plans",
          key: "id"
        }
      },
      toPlanId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "plans",
          key: "id"
        }
      },
      orderId: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      collectingTime: {
        allowNull: false,
        type: Sequelize.DATE
      },
      type: {
        allowNull: false,
        type: Sequelize.ENUM,
        values: ["ORI", "DES"],
        defaultValue: "ORI"
      },
      placeId: {
        allowNull: false,
        type: Sequelize.STRING(255),
        references: {
          model: "places",
          key: "placeId"
        }
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
    return queryInterface.dropTable('consolidations');
  }
};