'use strict';
module.exports = (sequelize, DataTypes) => {
  const routes = sequelize.define('routes', {
    oriPlaceId: {
      allowNull: false,
      type: DataTypes.STRING(255),
      validate: {
        notEmpty: true 
      }
    },
    desPlaceId: {
      allowNull: false,
      type: DataTypes.STRING(255),
      validate: {
        notEmpty: true 
      }
    }
  }, {
    charset: "utf8",
    collate: "utf8_unicode_ci"
  });
  routes.associate = function(models) {
    // associations can be defined here
  };
  return routes;
};