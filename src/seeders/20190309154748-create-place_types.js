'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("place_types", [{
      id: 1,
      type: "AIRPORT",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    },{
      id: 2,
      type: "HOTEL",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    },{
      id: 3,
      type: "MALL",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("place_types", null, {});
  }
};
