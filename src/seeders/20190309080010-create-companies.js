'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("companies", [{
      id: 1,
      name: "AIRPORTELS",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    },{
      id: 2,
      name: "THIRDPARTY",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }]);
  },

  down: queryInterface => queryInterface.bulkDelete("companies", null, {})
};
