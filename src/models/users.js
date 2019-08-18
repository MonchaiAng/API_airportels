module.exports = (sequelize, DataTypes) => {
  const users = sequelize.define(
    'users',
    {
      roleId: {
        allowNull: false,
        validate: {
          notEmpty: true,
        },
        type: DataTypes.INTEGER,
      },
      firstname: {
        allowNull: false,
        validate: {
          notEmpty: true,
        },
        type: DataTypes.STRING(100),
      },
      lastname: {
        allowNull: false,
        validate: {
          notEmpty: true,
        },
        type: DataTypes.STRING(100),
      },
      image: {
        allowNull: false,
        validate: {
          notEmpty: true,
        },
        defaultValue: 'default.png',
        type: DataTypes.STRING(200),
      },
      email: {
        allowNull: false,
        validate: {
          notEmpty: true,
        },
        type: DataTypes.STRING(100),
      },
      phone: {
        allowNull: false,
        validate: {
          notEmpty: true,
        },
        type: DataTypes.STRING(10),
      },
      password: {
        allowNull: false,
        validate: {
          notEmpty: true,
        },
        type: DataTypes.STRING(200),
      },
      isActive: {
        allowNull: false,
        validate: {
          notEmpty: true,
        },
        defaultValue: 0,
        type: DataTypes.BOOLEAN,
      },
      isDeleted: {
        allowNull: false,
        validate: {
          notEmpty: true,
        },
        defaultValue: 0,
        type: DataTypes.BOOLEAN,
      },
      createdBy: {
        allowNull: false,
        validate: {
          notEmpty: true,
        },
        type: DataTypes.INTEGER,
      },
      updatedBy: {
        allowNull: false,
        validate: {
          notEmpty: true,
        },
        type: DataTypes.INTEGER,
      },
    },
    {
      charset: 'utf8',
      collate: 'utf8_unicode_ci',
    },
  );
  users.associate = function (models) {
    // associations can be defined here
  };
  return users;
};
