const _ = require('lodash');
const Sequelize = require('sequelize');
const sequelize = require('./connect');

const logTimeline = sequelize.define('logTimeline', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  planIDBefore: {
    type: Sequelize.varchar,
  },
  planIDAfter: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
  },
  planDate: Sequelize.DATE,
  mergePlan: {
    type: Sequelize.STRING, // many phone number (string array)
    get() {
      return _.split(this.getDataValue('mergePlan'), ',');
    },
    set(val) {
      return this.setDataValue('mergePlan', _.join(val));
    },
  },
  statusPlan: {
    type: Sequelize.INTEGER,
    validate: {
      isIn: {
        args: [['0', '1']],
        msg: 'statusPlan should be 0 or 1',
      },
    },
  },
  createdAt: Sequelize.DATE,
  updatedAt: {
    type: Sequelize.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
  },
});

module.exports = logTimeline;
