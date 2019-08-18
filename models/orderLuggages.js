
const Sequelize = require('sequelize');
const sequelize = require('./connect');

const OrderLuggages = sequelize.define('orderluggages', {
  orderLuggageID: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderID: Sequelize.INTEGER,
  luggageID: Sequelize.INTEGER,
  amount: Sequelize.INTEGER,
});

OrderLuggages.insert = async (luggages, orderID) => {
  await luggages.forEach(async (luggage) => {
    await OrderLuggages.create({
      orderID,
      luggageID: luggage.luggageID,
      amount: luggage.amount,
    });
  });
};

module.exports = OrderLuggages;
