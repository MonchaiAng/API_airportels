module.exports = (sequelize, DataTypes) => {
  const user_activities = sequelize.define(
    'user_activities',
    {
      userId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
          notEmpty: true,
        },
      },
      roleId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
          notEmpty: true,
        },
      },
      function: {
        allowNull: false,
        type: DataTypes.STRING(255),
        validate: {
          notEmpty: true,
        },
      },
      description: {
        allowNull: false,
        type: DataTypes.STRING(255),
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
  user_activities.associate = function (models) {
    // associations can be defined here
  };
  return user_activities;
};
