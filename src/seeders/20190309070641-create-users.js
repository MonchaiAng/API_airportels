"use strict";
const bcrypt = require("bcrypt");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const password = await bcrypt.hash("airportels", 10);

    return queryInterface.bulkInsert("users", [
      {
        id: 1,
        roleId: 1,
        firstname: "Airport",
        lastname: "Hotel",
        image: "Airportels.jpg",
        email: "admin@airportels.com",
        phone: "0123456789",
        password: password,
        isActive: 1,
        isDeleted: 0,
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW"),
        createdBy: 1,
        updatedBy: 1
      },
      {
        id: 2,
        roleId: 2,
        firstname: "MANAGER",
        lastname: "MANAGER",
        image: "Airportels.jpg",
        email: "MANAGER@airportels.com",
        phone: "0123456789",
        password: password,
        isActive: 1,
        isDeleted: 0,
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW"),
        createdBy: 1,
        updatedBy: 1
      },
      {
        id: 3,
        roleId: 3,
        firstname: "ACCOUNTANT",
        lastname: "ACCOUNTANT",
        image: "Airportels.jpg",
        email: "ACCOUNTANT@airportels.com",
        phone: "0123456789",
        password: password,
        isActive: 1,
        isDeleted: 0,
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW"),
        createdBy: 1,
        updatedBy: 1
      },
    ]);
  },
  down: queryInterface => queryInterface.bulkDelete("users", null, {})
};
