'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('cars', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      image: {
        allowNull: false,
        type: Sequelize.STRING(200)
      },
      carLicensePlate: {
        allowNull: false,
        type: Sequelize.STRING(100)
      },
      brand: {
        allowNull: false,
        type: Sequelize.STRING(100)
      },
      model: {
        allowNull: false,
        type: Sequelize.STRING(100)
      },
      engine: {
        allowNull: false,
        type: Sequelize.STRING(100)
      },
      carCapacity: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      companyId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "companies",
          key: "id"
        }
      },
      isActive: {
       type: Sequelize.BOOLEAN,
       defaultValue: true
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
    return queryInterface.dropTable('cars');
  }
};