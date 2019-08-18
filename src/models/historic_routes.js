'use strict';
module.exports = (sequelize, DataTypes) => {
  const historic_routes = sequelize.define('historic_routes', {
    driverId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: true,
      },
      allowNull: false
    },
    routeId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: true,
      },
      allowNull: false
    },
    scheduleId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: true,
      },
      allowNull: false
    },
    driverDuration: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: true,
      },
      allowNull: false
    },
    departureTime: {
      type: DataTypes.DATE,
      validate: {
        notEmpty: true,
      },
      allowNull: false
    }
  }, {

    indexes: [{ fields: ["routeId", "scheduleId", "driverId"]}],
    charset: 'utf8',
    collate: 'utf8_unicode_ci'
  });
  historic_routes.associate = function(models) {
    // associations can be defined here
  };
  return historic_routes;
};