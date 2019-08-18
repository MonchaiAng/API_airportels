'use strict';
module.exports = (sequelize, DataTypes) => {
  const driver_indexes = sequelize.define('driver_indexes', {
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true
      }},
    index: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        notEmpty: true
      }}
  }, {
    charset: "utf8",
    collate: "utf8_unicode_ci"
  });
  driver_indexes.associate = function(models) {
    // associations can be defined here
  };
  return driver_indexes;
};