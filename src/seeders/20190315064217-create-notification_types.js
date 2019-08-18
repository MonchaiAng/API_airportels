'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("notification_types", [{
      id: 1,
      name: "Driver going to delay",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    },{
      id: 2,
      name: "Order moved to new plan",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    },{
      id: 3,
      name: "Consolidation suggestions",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    },{
      id: 4,
      name: "Confirmed consolidation",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    },{
      id: 5,
      name: 'Order Reach "Must Plan" Time',
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    },{
      id: 6,
      name: "Plans assigned to driver",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    },{
      id: 7,
      name: "Canceled tasks",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    },{
      id: 8,
      name: "Order removed from plan",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("notification_types", null, {});
  }
};
