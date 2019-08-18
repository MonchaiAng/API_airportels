module.exports = (sequelize, DataTypes) => {
  const notification_types = sequelize.define(
    'notification_types',
    {
      name: {
        allowNull: false,
        type: DataTypes.STRING(100),
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
  notification_types.associate = function (models) {
    // associations can be defined here
  };
  return notification_types;
};
