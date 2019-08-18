module.exports = (sequelize, DataTypes) => {
  const plan_orders = sequelize.define(
    'plan_orders',
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
      collectingTime: {
        type: DataTypes.DATE,
      },
      embarkingTime: {
        type: DataTypes.DATE,
      },
      criticalTime: {
        type: DataTypes.DATE,
      },
    },
    {
      indexes: [{ fields: ['planId', 'orderId'], unique: true }],
      charset: 'utf8',
      collate: 'utf8_unicode_ci',
    },
  );
  plan_orders.associate = function (models) {
    // associations can be defined here
  };
  return plan_orders;
};
