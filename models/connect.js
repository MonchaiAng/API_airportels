const Sequelize = require('sequelize');
const _ = require('lodash');
const { mysqlConfig, sequelConfig } = require('../config');

const sequelize = new Sequelize(
  mysqlConfig.database,
  mysqlConfig.user,
  !_.isEmpty(mysqlConfig.password) ? mysqlConfig.password : null,
  sequelConfig,
);
module.exports = sequelize;
