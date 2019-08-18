module.exports = (sequelize, DataTypes) => {
  const plan_locations = sequelize.define(
    'plan_locations',
    {
      planId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      placeId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      transportationTime: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      collectingTime: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      possibleCollectingTime: {
        type: DataTypes.DATE,
        allowNull: true
      },
      possibleArrivingTime: {
        type: DataTypes.DATE,
        allowNull: true
      },
      arrivingTime: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      type: {
        type: DataTypes.ENUM,
        validate: {
          notEmpty: true,
        },
        values: ['ORI', 'DES'],
      }
    },
    {
      //   indexes: [{ fields: ["planId", "orderId"], unique: true }]
      charset: 'utf8',
      collate: 'utf8_unicode_ci',
    },
  );
  plan_locations.associate = function (models) {
    // associations can be defined here
  };
  return plan_locations;
};
