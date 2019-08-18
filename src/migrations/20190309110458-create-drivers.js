'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('drivers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      carId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "cars",
          key: "id"
        }
      },
      rating: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      firstname: {
        allowNull: false,
        type: Sequelize.STRING(100)
      },
      lastname: {
        allowNull: false,
        type: Sequelize.STRING(100)
      },
      gender: {
        allowNull: false,
        type: Sequelize.ENUM,
        values: ["MALE", "FEMALE"]
      },
      image: {
        allowNull: false,
        type: Sequelize.STRING(200)
      },
      birthday: {
        allowNull: false,
        type: Sequelize.DATE
      },
      cardType: {
        allowNull: false,
        type: Sequelize.ENUM,
        values: ["IDCARD", "PASSPORT"]
      },
      cardDetail: {
        allowNull: false,
        type: Sequelize.STRING(15)
      },
      rankingId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "driver_rankings",
          key: "id"
        }
      },
      phone: {
        allowNull: false,
        type: Sequelize.STRING(10)
      },
      email: {
        allowNull: false,
        type: Sequelize.STRING(100)
      },
      address: {
        allowNull: false,
        type: Sequelize.STRING(200)
      },
      password: {
        type: Sequelize.STRING(200)
      },
      latitude: {
        type: Sequelize.STRING(20)
      },
      longitude: {
        type: Sequelize.STRING(20)
      },
      isOnline: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      isDeleted: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
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
    return queryInterface.dropTable('drivers');
  }
};