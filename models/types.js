const Sequelize = require('sequelize');
const sequelize = require('./connect');

const Types = sequelize.define('types', {
  typeID: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: Sequelize.STRING,
  display: Sequelize.STRING,
  description: Sequelize.STRING,
  value: Sequelize.INTEGER,
  categoryID: Sequelize.INTEGER,
});

module.exports = Types;
