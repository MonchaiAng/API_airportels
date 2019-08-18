module.exports = (sequelize, DataTypes) => {
  const consolidations = sequelize.define(
    'consolidations', 
    {
      fromPlanId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
          notEmpty: true
        }
      },
      toPlanId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
          notEmpty: true
        }
      },
      orderId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
          notEmpty: true
        }
      },
      collectingTime: {
        allowNull: false,
        type: DataTypes.DATE,
        validate: {
          notEmpty: true
        }
      },
      type: {
        allowNull: false,
        type: DataTypes.ENUM,
        values: ["ORI", "DES"],
        defaultValue: "ORI",
        validate: {
          notEmpty: true
        }
      }
    },
    {
      charset: 'utf8',
      collate: 'utf8_unicode_ci',
    }
  );
  consolidations.associate = function(models) {
    // associations can be defined here
  };
  return consolidations;
};