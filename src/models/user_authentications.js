module.exports = (sequelize, DataTypes) => {
  const user_authentications = sequelize.define(
    'user_authentications',
    {
      userId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
          notEmpty: true,
        },
      },
      token: {
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
  user_authentications.associate = function (models) {
    // associations can be defined here
  };
  return user_authentications;
};
