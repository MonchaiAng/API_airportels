module.exports = (sequelize, DataTypes) => {
  const orders = sequelize.define(
    'orders',
    {
      code: {
        unique: true,
        allowNull: false,
        type: DataTypes.STRING(50),
        validate: {
          notEmpty: true,
        },
      },
      customerId: {
        allowNull: false,
        type: DataTypes.STRING(100),
        validate: {
          notEmpty: true,
        },
      },
      customerFullname: {
        allowNull: false,
        type: DataTypes.STRING(100),
        validate: {
          notEmpty: true,
        },
      },
      customerPhone: {
        allowNull: false,
        type: DataTypes.STRING(100),
        validate: {
          notEmpty: true,
        },
      },
      customerEmail: {
        allowNull: false,
        type: DataTypes.STRING(100),
        validate: {
          notEmpty: true,
        },
      },
      dropTime: {
        allowNull: false,
        type: DataTypes.DATE,
        validate: {
          notEmpty: true,
        },
      },
      pickupTime: {
        allowNull: false,
        type: DataTypes.DATE,
        validate: {
          notEmpty: true,
        },
      },
      arrivingTime: {
        allowNull: false,
        type: DataTypes.DATE,
        validate: {
          notEmpty: true,
        },
      },
      originPlaceId: {
        type: DataTypes.STRING(255),
      },
      destinationPlaceId: {
        type: DataTypes.STRING(255),
      },
      numberOfLuggage: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
          notEmpty: true,
        },
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        validate: {
          notEmpty: true,
        },
      },
      status: {
        allowNull: false,
        type: DataTypes.INTEGER,
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
  orders.associate = function (models) {
    // associations can be defined here
  };
  return orders;
};
