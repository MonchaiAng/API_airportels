const { UserAuthentications } = require('../models');

const storeUserTokenSingleWay = async (userId, token) => {
  const userToken = await UserAuthentications.findOne({
    where: {
      userId,
    },
  });
  if (userToken) {
    await userToken.update({
      token,
    });
  } else {
    await UserAuthentications.create({
      userId,
      token,
    });
  }
};

const storeUserTokenMultipleWay = async (userId, token) => {
  await UserAuthentications.create({
    userId,
    token,
  });
};

module.exports = {
  storeUserTokenSingleWay,
  storeUserTokenMultipleWay,
};
