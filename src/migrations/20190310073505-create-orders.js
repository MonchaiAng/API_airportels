"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("orders", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      code: {
        unique: true,
        allowNull: false,
        type: Sequelize.STRING(100)
      },
      customerId: {
        allowNull: false,
        type: Sequelize.STRING(100)
      },
      customerFullname: {
        allowNull: false,
        type: Sequelize.STRING(100)
      },
      customerPhone: {
        allowNull: false,
        type: Sequelize.STRING(10)
      },
      customerEmail: {
        allowNull: false,
        type: Sequelize.STRING(100)
      },
      dropTime: {
        allowNull: false,
        type: Sequelize.DATE
      },
      pickupTime: {
        allowNull: false,
        type: Sequelize.DATE
      },
      arrivingTime: {
        allowNull: false,
        type: Sequelize.DATE
      },
      originPlaceId: {
        type: Sequelize.STRING(255),
        references: {
          model: "places",
          key: "placeId",
        }
      },
      destinationPlaceId: {
        type: Sequelize.STRING(255),
        references: {
          model: "places",
          key: "placeId"
        }
      },
      numberOfLuggage: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      status: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "order_statuses",
          key: "id"
        }
      },
      createdBy: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "users",
          key: "id"
        }
      },
      updatedBy: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "users",
          key: "id"
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
    return queryInterface.dropTable("orders");
  }
};
