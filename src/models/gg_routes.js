'use strict';
module.exports = (sequelize, DataTypes) => {
  const gg_routes = sequelize.define('gg_routes', {
    routeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },
    scheduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },
    ggDuration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },
    trafficDuration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },
    departureTime: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    }
  }, {
    indexes: [{ fields: ["routeId", "scheduleId"]}],
    charset: "utf8",
    collate: "utf8_unicode_ci"
  });
  gg_routes.associate = function(models) {
    // associations can be defined here
  };
  return gg_routes;
};