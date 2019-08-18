"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("order_statuses", [
      {
        id: 1,
        status: "WAITING",
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW")
      },
      {
        id: 2,
        status: "PLANED",
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW")
      },
      {
        id: 3,
        status: "COLLECTED",
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW")
      },
      {
        id: 4,
        status: "DELIVERING",
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW")
      },
      {
        id: 5,
        status: "DELIVERED",
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW")
      },
      {
        id: 6,
        status: "LOCKED_ORI",
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW")
      },
      {
        id: 7,
        status: "LOCKED_DES",
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW")
      }
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("order_statuses", null, {});
  }
};
