const Sequelize = require('sequelize');
const sequelize = require('./connect');

const Users = sequelize.define('users', {
  userID: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false,
  },
  roleID: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
  },
});

module.exports = Users;
