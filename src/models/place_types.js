module.exports = (sequelize, DataTypes) => {
  const place_types = sequelize.define(
    'place_types',
    {
      type: {
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
  place_types.associate = function (models) {
    // associations can be defined here
  };
  return place_types;
};
