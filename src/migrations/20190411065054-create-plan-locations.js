"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("plan_locations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      planId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "plans",
          key: "id"
        }
      },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "orders",
          key: "id"
        }
      },
      placeId: {
        type: Sequelize.STRING(255),
        allowNull: false,
        references: {
          model: "places",
          key: "placeId"
        }
      },
      transportationTime: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      possibleCollectingTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      possibleArrivingTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      collectingTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      arrivingTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM,
        values: ["ORI", "DES"]
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("plan_locations");
  }
};
