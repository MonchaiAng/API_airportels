const Sequelize = require('sequelize');
const sequelize = require('./connect');
const Cars = require('./cars');

const pathImage = 'public/img/drivers';

const Drivers = sequelize.define('drivers', {
  driverID: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  carID: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
  },
  image: {
    type: Sequelize.TEXT,
    get() {
      return `${pathImage}/${this.getDataValue('image')}`;
    },
    defaultValue: '',
  },
  fullname: Sequelize.STRING,
  gender: {
    type: Sequelize.STRING,
    validate: {
      isIn: {
        args: [['male', 'female']],
        msg: 'Gender should be male or famale',
      },
    },
    // get() {
    //   return _.capitalize(this.getDataValue('gender'));
    // },
  },
  age: {
    type: Sequelize.INTEGER,
    validate: {
      isInt: true,
    },
  },
  phone: {
    type: Sequelize.STRING(12),
    validate: {
      len: {
        args: [10, 12],
        msg: 'phone should be length 12',
      },
    },
  },
  email: {
    type: Sequelize.STRING,
    validate: {
      isEmail: true,
    },
  },
  active: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  successRate: Sequelize.INTEGER,
  delay: Sequelize.INTEGER,
  ontime: Sequelize.INTEGER,
});

Drivers.belongsTo(Cars, { foreignKey: 'carID' });

module.exports = Drivers;
