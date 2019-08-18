'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("notification_filters", [{
      id: 1,
      userId: 1,
      notificationId: 1,
      isActive: true,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    },{
      id: 2,
      userId: 1,
      notificationId: 2,
      isActive: true,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    },{
      id: 3,
      userId: 1,
      notificationId: 3,
      isActive: true,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    },{
      id: 4,
      userId: 1,
      notificationId: 4,
      isActive: true,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    },{
      id: 5,
      userId: 1,
      notificationId: 5,
      isActive: true,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    },{
      id: 6,
      userId: 1,
      notificationId: 6,
      isActive: true,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    },{
      id: 7,
      userId: 1,
      notificationId: 7,
      isActive: true,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    },{
      id: 8,
      userId: 1,
      notificationId: 8,
      isActive: true,
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("notification_filters", null, {});
  }
};
