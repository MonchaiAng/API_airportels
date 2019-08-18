module.exports = (sequelize, DataTypes) => {
  const cars = sequelize.define(
    'cars',
    {
      image: {
        allowNull: false,
        type: DataTypes.STRING(200),
        validate: {
          notEmpty: true,
        },
      },
      carLicensePlate: {
        allowNull: false,
        type: DataTypes.STRING(10),
        validate: {
          notEmpty: true,
        },
      },
      brand: {
        allowNull: false,
        type: DataTypes.STRING(100),
        validate: {
          notEmpty: true,
        },
      },
      model: {
        allowNull: false,
        type: DataTypes.STRING(100),
        validate: {
          notEmpty: true,
        },
      },
      engine: {
        allowNull: false,
        type: DataTypes.STRING(10),
        validate: {
          notEmpty: true,
        },
      },
      carCapacity: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
          notEmpty: true,
        },
      },
      companyId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
          notEmpty: true,
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
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
  cars.associate = function (models) {
    // associations can be defined here
  };
  return cars;
};
