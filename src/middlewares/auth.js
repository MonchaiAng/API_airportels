const jwt = require('express-jwt');
const { SECRET_ADMIN, SECRET_DRIVER } = require('../config/secret');
const { DriverAuthentications } = require('../models');
const { getTokenFromRequest } = require('../helpers/index');

const driverRevoked = async (req, payload, next) => {
  try {
    const { iat, exp } = payload;
    console.log(iat, exp);
    const driverAuth = await DriverAuthentications.findOne({
      where: {
        driverId: payload.id,
      },
    });
    const token = getTokenFromRequest(req);
    if (!driverAuth) throw new Error('Unauthorized!');
    if (driverAuth.token !== token) throw new Error('Unauthorized!');
    next();
  } catch (err) {
    next(err);
  }
};

const ADMIN = jwt({ secret: SECRET_ADMIN });
const DRIVER = jwt({
  secret: SECRET_DRIVER,
  isRevoked: driverRevoked,
});

module.exports = {
  ADMIN,
  DRIVER,
};
