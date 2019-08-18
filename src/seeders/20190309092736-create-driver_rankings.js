'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("driver_rankings", [
      {
        id: 1,
        name: "BRONZE",
        description: "bronze level",
        createdBy: 1,
        updatedBy: 1,
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW")
      },{
        id: 2,
        name: "SILVER",
        description: "silver level",
        createdBy: 1,
        updatedBy: 1,
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW")
      },{
        id: 3,
        name: "GOLD",
        description: "gold level",
        createdBy: 1,
        updatedBy: 1,
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW")
      },{
        id: 4,
        name: "PLATINUM",
        description: "platinum level",
        createdBy: 1,
        updatedBy: 1,
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW")
      },{
        id: 5,
        name: "DAIMOND",
        description: "daimond level",
        createdBy: 1,
        updatedBy: 1,
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW")
      }
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("driver_rankings", null, {});
  }
};
