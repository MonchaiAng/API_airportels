const Sequelize = require('sequelize');
const sequelize = require('./connect');

const Schedules = sequelize.define('schedules', {
  scheduleID: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  locationID: Sequelize.INTEGER, // location id of t21
  start: {
    type: Sequelize.DATE,
  },
  end: {
    type: Sequelize.DATE,
  },
  area: {
    type: Sequelize.STRING, // Bangkok
  },
});

module.exports = Schedules;
