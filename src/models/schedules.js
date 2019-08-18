'use strict';
module.exports = (sequelize, DataTypes) => {
  const schedules = sequelize.define('schedules', {
    periodBegin: {
      allowNull: false,
      type: DataTypes.STRING(255),
      validate: {
        notEmpty: true
      }
    },
    periodEnd: {
      allowNull: false,
      type: DataTypes.STRING(255),
      validate: {
        notEmpty: true
      }
    },
    index: {
      allowNull: false,
      type: DataTypes.FLOAT,
      validate: {
        notEmpty: true
      }
    }
  }, {});
  schedules.associate = function(models) {
    // associations can be defined here
  };
  return schedules;
};