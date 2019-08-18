'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("driver_bankings", [{
      id: 1,
      bankId: 2,
      accountName: "Aekachai Nakhong",
      accountNo: "BF111111",
      driverId: 1,
      isActive: 1,
      cutOffPeriod: "MONTHLY",
      createdBy: 1,
      updatedBy: 1,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("driver_bankings", null, {});
  }
};
