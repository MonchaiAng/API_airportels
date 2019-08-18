module.exports = (sequelize, DataTypes) => {
  const notification_filters = sequelize.define(
    'notification_filters',
    {
      userId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
          notEmpty: true,
        },
      },
      notificationId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
          notEmpty: true,
        },
      },
      isActive: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      charset: 'utf8',
      collate: 'utf8_unicode_ci',
    },
  );
  notification_filters.associate = function (models) {
    // associations can be defined here
  };
  return notification_filters;
};
