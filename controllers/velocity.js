const _ = require('lodash');

const {
  Velocities,
} = require('../models');

const generateVelocities = async ({ day, month, type }) => {
  const newVelocities = [];
  if (month && day && type) {
    const newVelocity = await Velocities.create({
      velocityID: `${month}_${day}_${type}`,
      month,
      day,
      type,
    });
    newVelocities.push(newVelocity);
  } else if (month) {
    if (type) {
      _.range(7).map(async (i) => {
        const newVelocity = await Velocities.create({
          velocityID: `${month}_${i + 1}_${type}`,
          month,
          day: i + 1,
          type,
        });
        newVelocities.push(newVelocity);
      });
    } else if (!type) {
      const typeIntown = 'intown';
      _.range(7).map(async (i) => {
        const newVelocity = await Velocities.create({
          velocityID: `${month}_${i + 1}_${typeIntown}`,
          month,
          day: i + 1,
          type: typeIntown,
        });
        newVelocities.push(newVelocity);
      });
      const typeLong = 'long';
      _.range(7).map(async (i) => {
        const newVelocity = await Velocities.create({
          velocityID: `${month}_${i + 1}_${typeLong}`,
          month,
          day: i + 1,
          type: typeLong,
        });
        newVelocities.push(newVelocity);
      });
    }
  }
  return newVelocities;
};

const get = async (req, res, next) => {
  try {
    const { month, day, type } = req.query;
    let velocities = await Velocities.findAll({
      where: _.pickBy({ month, day, type }, _.identity),
    });
    if (_.isEmpty(velocities)) {
      velocities = await generateVelocities({ month, day, type });
    }
    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        velocities,
      },
    });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const {
      month,
      day,
      type,
      q1,
      q2,
      q3,
      q4,
      q5,
    } = req.body;
    let newVelocity = {};
    const velocity = await Velocities.findById(`${month}_${day}_${type}`);
    if (_.isEmpty(velocity)) {
      newVelocity = await Velocities.create({
        velocityID: `${month}_${day}_${type}`,
        month,
        day,
        type,
        q1,
        q2,
        q3,
        q4,
        q5,
      });
    } else {
      newVelocity = await velocity.update({
        q1,
        q2,
        q3,
        q4,
        q5,
      });
    }
    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        velocity: newVelocity,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  get,
  update,
};
