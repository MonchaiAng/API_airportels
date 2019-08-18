module.exports = (sequelize, DataTypes) => {
  const plans = sequelize.define(
    'plans',
    {
      driverId: {
        type: DataTypes.INTEGER,
      },
      status:{
        type: DataTypes.ENUM,
        values: ["WAITING", "WORKING", "FINISHED"],
        defaultValue: "WAITING",
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
  plans.associate = function (models) {
    // associations can be defined here
  };
  return plans;
};
