module.exports = (sequelize, DataTypes) => {
  const places = sequelize.define(
    'places',
    {
      placeId: {
        unique: true,
        allowNull: false,
        type: DataTypes.STRING(255),
        validate: {
          notEmpty: true,
        },
      },
      latitude: {
        allowNull: false,
        type: DataTypes.STRING(20),
        validate: {
          notEmpty: true,
        },
      },
      longitude: {
        allowNull: false,
        type: DataTypes.STRING(20),
        validate: {
          notEmpty: true,
        },
      },
      address: {
        allowNull: false,
        type: DataTypes.STRING(255),
        validate: {
          notEmpty: true,
        },
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING(255),
        validate: {
          notEmpty: true,
        },
      },
      typeId: {
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
  places.associate = function (models) {
    // associations can be defined here
  };
  return places;
};
