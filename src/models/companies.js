module.exports = (sequelize, DataTypes) => {
  const companies = sequelize.define(
    'companies',
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
  companies.associate = function (models) {
    // associations can be defined here
  };
  return companies;
};
