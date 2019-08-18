module.exports = (sequelize, DataTypes) => {
  const driver_authentications = sequelize.define(
    'driver_authentications',
    {
      driverId: DataTypes.INTEGER,
      token: DataTypes.STRING,
    },
    {
      charset: 'utf8',
      collate: 'utf8_unicode_ci',
    },
  );
  driver_authentications.associate = function (models) {
    // associations can be defined here
  };
  return driver_authentications;
};
