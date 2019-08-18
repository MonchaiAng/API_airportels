'use strict';

module.exports = (sequelize, DataTypes) => {
  const driver_rankings = sequelize.define(
    'driver_rankings',
    {
      name: {
        allowNull: false,
        type: DataTypes.STRING(100),
        validate: {
          notEmpty: true,
        },
      },
      description: {
        allowNull: false,
        type: DataTypes.STRING(200),
        validate: {
          notEmpty: true,
        },
      },
      createdBy: {
        type: DataTypes.INTEGER,
        validate: {
          notEmpty: true,
        },
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        validate: {
          notEmpty: true,
        },
      },
    },
    {
      charset: 'utf8',
      collate: 'utf8_unicode_ci',
    },
  );
  driver_rankings.associate = function (models) {
    // associations can be defined here
  };
  return driver_rankings;
};
