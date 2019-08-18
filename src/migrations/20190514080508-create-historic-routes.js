'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('historic_routes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      driverId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "drivers",
          key: "id"
        }
      },
      routeId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "routes",
          key: "id"
        }
      },
      scheduleId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "schedules",
          key: "id"
        }
      },
      driverDuration: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      departureTime: {
        allowNull: false,
        type: Sequelize.DATE
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
    return queryInterface.dropTable('historic_routes');
  }
};