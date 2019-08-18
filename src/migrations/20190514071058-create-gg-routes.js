'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('gg_routes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      ggDuration: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      trafficDuration: {
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
    return queryInterface.dropTable('gg_routes');
  }
};