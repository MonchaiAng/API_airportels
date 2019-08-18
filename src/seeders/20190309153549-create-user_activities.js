'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("user_activities", [{
      id: 1,
      userId: 1,
      function: "login",
      description: "login successfully",
      createdAt: Sequelize.fn("NOW"),
      updatedAt: Sequelize.fn("NOW")
    }]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("user_activities", null, {});
  }
};
