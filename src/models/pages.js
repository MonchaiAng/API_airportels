module.exports = (sequelize, DataTypes) => {
  const pages = sequelize.define(
    'pages',
    {
      name: {
        allowNull: false,
        type: DataTypes.STRING(100),
        validate: {
          notEmpty: true,
        },
      },
      route: {
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
  pages.associate = function (models) {
    // associations can be defined here
  };
  return pages;
};
