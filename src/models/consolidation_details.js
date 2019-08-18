'use strict';
module.exports = (sequelize, DataTypes) => {
  const consolidation_details = sequelize.define(
    'consolidation_details', 
    {
      consolidationId: {
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
      type: {
        allowNull: false,
        type: DataTypes.ENUM,
        values: ["ORI", "DES"],
        defaultValue: "ORI",
        validate: {
          notEmpty: true
        }
      }
    },{
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
  });
  consolidation_details.associate = function(models) {
    // associations can be defined here
  };
  return consolidation_details;
};