const Sequelize = require('sequelize');
const sequelize = require('./connect');

const Locations = require('./locations');

const Consolidations = sequelize.define('consolidations', {
  consolidationID: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  locationID: {
    type: Sequelize.INTEGER,
  },
  time: {
    type: Sequelize.TIME,
  },
});

Consolidations.belongsTo(Locations, { foreignKey: 'locationID' });

module.exports = Consolidations;
