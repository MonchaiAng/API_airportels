module.exports = (sequelize, DataTypes) => {
  const order_statuses = sequelize.define(
    'order_statuses',
    {
      status: {
        allowNull: false,
        type: DataTypes.STRING(100),
        validate: {
          isEmpty: true,
        },
      },
    },
    {
      charset: 'utf8',
      collate: 'utf8_unicode_ci',
    },
  );
  order_statuses.associate = function (models) {
    // associations can be defined here
  };
  return order_statuses;
};
