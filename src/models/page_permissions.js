module.exports = (sequelize, DataTypes) => {
  const page_permissions = sequelize.define(
    'page_permissions',
    {
      pageId: {
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
      get: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: 0,
        validate: {
          notEmpty: true,
        },
      },
      post: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: 0,
        validate: {
          notEmpty: true,
        },
      },
      patch: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: 0,
        validate: {
          notEmpty: true,
        },
      },
      delete: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: 0,
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
  page_permissions.associate = function (models) {
    // associations can be defined here
  };
  return page_permissions;
};
