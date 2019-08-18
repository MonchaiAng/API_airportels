module.exports = (sequelize, DataTypes) => {
  const plan_comments = sequelize.define(
    'plan_comments',
    {
      planId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
          notEmpty: true,
        },
        unique: true,
      },
      comment: {
        allowNull: false,
        type: DataTypes.STRING(255),
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
  plan_comments.associate = function (models) {
    // associations can be defined here
  };
  return plan_comments;
};
