const Sequelize = require('sequelize');
const sequelize = require('./connect');
const Types = require('./types');

const pathImage = 'public/img/cars';

const Cars = sequelize.define('cars', {
  carID: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  typeID: {
    type: Sequelize.INTEGER,
    validate: {
      isIn: {
        args: [[6, 7, 8]],
        msg: 'typeID should be 6, 7, 8',
      },
    },
  },
  capacity: Sequelize.INTEGER,
  detail: Sequelize.STRING,
  engine: Sequelize.STRING,
  license: Sequelize.STRING,
  image: {
    type: Sequelize.TEXT,
    get() {
      return `${pathImage}/${this.getDataValue('image')}`;
    },
  },
});
// Cars.belongsTo(Drivers, { foreignKey: 'driverID' });
Cars.belongsTo(Types, { foreignKey: 'typeID' });

module.exports = Cars;
