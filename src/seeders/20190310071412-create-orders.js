"use strict";
const {mockupOrders} = require("../mockupData/orders");

module.exports = {
  up: (queryInterface, Sequelize) => {
    
    return queryInterface.bulkInsert("orders", mockupOrders);
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("orders", null, {});
  }
};
