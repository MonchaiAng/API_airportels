module.exports = (sequelize, DataTypes) => {
  const banks = sequelize.define(
    'banks',
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
  banks.associate = function (models) {
    // associations can be defined here
  };
  return banks;
};
