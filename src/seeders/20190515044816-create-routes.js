'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.bulkInsert("routes", [
    {
      id: 1,
      oriPlaceId: "AirportBKK",
      desPlaceId: "AirportDMK",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW"),
    },
    {
      id: 2,
      oriPlaceId: "MallT21",
      desPlaceId: "AirportBKK",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW"),
    },
    {
      id: 3,
      oriPlaceId: "MallT21",
      desPlaceId: "AirportDMK",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW"),
    }
  ]),

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("routes", null, {});
  }
};
