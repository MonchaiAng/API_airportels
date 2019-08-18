module.exports = (sequelize, DataTypes) => {
  const drivers = sequelize.define(
    'drivers',
    {
      carId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
          notEmpty: true,
        },
      },
      rating: {
        allowNull: false,
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          notEmpty: true,
        },
      },
      firstname: {
        allowNull: false,
        type: DataTypes.STRING(100),
        validate: {
          notEmpty: true,
        },
      },
      lastname: {
        allowNull: false,
        type: DataTypes.STRING(100),
        validate: {
          notEmpty: true,
        },
      },
      gender: {
        allowNull: false,
        type: DataTypes.ENUM,
        validate: {
          notEmpty: true,
        },
        values: ['MALE', 'FEMALE'],
      },
      image: {
        allowNull: false,
        type: DataTypes.STRING(200),
        validate: {
          notEmpty: true,
        },
      },
      birthday: {
        allowNull: false,
        type: DataTypes.DATE,
        validate: {
          notEmpty: true,
        },
      },
      cardType: {
        allowNull: false,
        validate: {
          notEmpty: true,
        },
        type: DataTypes.ENUM,
        values: ['IDCARD', 'PASSPORT'],
      },
      cardDetail: {
        allowNull: false,
        type: DataTypes.STRING(15),
        validate: {
          notEmpty: true,
        },
      },
      rankingId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
          notEmpty: true,
        },
      },
      phone: {
        allowNull: false,
        type: DataTypes.STRING(10),
        validate: {
          notEmpty: true,
        },
      },
      email: {
        allowNull: false,
        type: DataTypes.STRING(100),
        validate: {
          notEmpty: true,
        },
      },
      address: {
        allowNull: false,
        type: DataTypes.STRING(200),
        validate: {
          notEmpty: true,
        },
      },
      password: {
        type: DataTypes.STRING(200),
      },
      latitude: {
        type: DataTypes.STRING(20),
      },
      longitude: {
        type: DataTypes.STRING(20),
      },
      isOnline: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: 0,
        validate: {
          notEmpty: true,
        },
      },
      isDeleted: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: 0,
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
  drivers.associate = function (models) {
    // associations can be defined here
  };
  return drivers;
};
