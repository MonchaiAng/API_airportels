"use strict";

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.bulkInsert("roles", [
      {
        id: 1,
        name: "ADMINISTRATOR",
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW")
      },
      {
        id: 2,
        name: "MANAGER",
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW")
      },
      {
        id: 3,
        name: "ACCOUNTANT",
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW")
      }
    ]),

  down: queryInterface => queryInterface.bulkDelete("roles", null, {})
};
