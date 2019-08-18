'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('driver_bankings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      bankId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "banks",
          key: "id"
        }
      },
      accountName: {
        allowNull: false,
        type: Sequelize.STRING(100)
      },
      accountNo: {
        allowNull: false,
        type: Sequelize.STRING(100)
      },
      driverId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "drivers",
          key: "id"
        }
      },
      isActive: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      cutOffPeriod: {
        allowNull: false,
        type: Sequelize.ENUM,
        values: ["WEEKLY", "MONTHLY"]
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
    return queryInterface.dropTable('driver_bankings');
  }
};