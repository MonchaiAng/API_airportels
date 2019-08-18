'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("driver_authentications", [{
      id: 1,
      driverId: 1,
      token: "xxxx.yyy.zzz",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("driver_authentications", null, {});
  }
};
