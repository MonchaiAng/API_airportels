'use strict';
module.exports = (sequelize, DataTypes) => {
  const route_indexes = sequelize.define('route_indexes', {
    routeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },
    index: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    }
  }, {
    charset: "utf8",
    collate: "utf8_unicode_ci"
  });
  route_indexes.associate = function(models) {
    // associations can be defined here
  };
  return route_indexes;
};