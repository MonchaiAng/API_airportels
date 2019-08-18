
const Sequelize = require('sequelize');
const sequelize = require('./connect');

const Templates = sequelize.define('templates', {
  templateID: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  traveling: Sequelize.TIME,
  templateDetail: Sequelize.STRING,
});

module.exports = Templates;
