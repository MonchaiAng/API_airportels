module.exports = (sequelize, DataTypes) => {
  const roles = sequelize.define(
    'roles',
    {
      name: {
        allowNull: false,
        unique: true,
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
  roles.associate = function (models) {
    // associations can be defined here
  };
  return roles;
};
