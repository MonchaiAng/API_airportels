'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('places', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      placeId: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING(255),
      },
      typeId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "place_types",
          key: "id"
        }
      },
      latitude: {
        allowNull: false,
        type: Sequelize.STRING(20)
      },
      longitude: {
        allowNull: false,
        type: Sequelize.STRING(20)
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING(100)
      },
      address: {
        allowNull: false,
        type: Sequelize.STRING(200)
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
    return queryInterface.dropTable('places');
  }
};