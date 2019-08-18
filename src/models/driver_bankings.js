'use strict';

module.exports = (sequelize, DataTypes) => {
  const driver_bankings = sequelize.define(
    'driver_bankings',
    {
      bankId: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      accountName: {
        allowNull: false,
        type: DataTypes.STRING(100),
        validate: {
          notEmpty: true,
        },
      },
      accountNo: {
        allowNull: false,
        type: DataTypes.STRING(100),
        validate: {
          notEmpty: true,
        },
      },
      driverId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
          notEmpty: true,
        },
      },
      isActive: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        validate: {
          notEmpty: true,
        },
      },
      cutOffPeriod: {
        allowNull: false,
        type: DataTypes.ENUM,
        values: ['WEEKLY', 'MONTHLY'],
        validate: {
          notEmpty: true,
        },
      },
      createdBy: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
          notEmpty: true,
        },
      },
      updatedBy: {
        allowNull: false,
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
  driver_bankings.associate = function (models) {
    // associations can be defined here
  };
  return driver_bankings;
};
