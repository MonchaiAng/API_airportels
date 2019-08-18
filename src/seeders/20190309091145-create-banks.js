'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("banks", [
      {
        id: 1,
        name: "KBANK",
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW")
      },{
        id: 2,
        name: "SCB",
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW")
      }
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("banks", null, {});
  }
};
