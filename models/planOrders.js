const Sequelize = require('sequelize');
const sequelize = require('./connect');

const Orders = require('./orders');

const PlanOrders = sequelize.define('planorders', {
  orderID: {
    type: Sequelize.INTEGER,
    primaryKey: true,
  },
  planID: Sequelize.INTEGER,
  logPlanID: Sequelize.INTEGER,
});

PlanOrders.belongsTo(Orders, { foreignKey: 'orderID' });

module.exports = PlanOrders;
