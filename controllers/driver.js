const _ = require('lodash');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const JWT = require('jsonwebtoken');

const { dateFormat, toBoolean } = require('../lib');
const DriverLocation = require('../models/mongoDB/driverLocation');

const Mail = require('../lib/Mail');
const { secret, hostWeb } = require('../config');

const {
  Drivers, OrderDrivers, Cars, Types,
} = require('../models');

const get = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { capacity, active, haveCar } = req.query;
    const where = {};
    if (id) where.driverID = id;
    if (capacity) where['$car.capacity$'] = { $gte: capacity }; // หาคนขับที่มีรถสามารถบรรทุกได้
    if (active) where.active = active;
    if (haveCar) {
      if (toBoolean(haveCar)) {
        where['$car.carID$'] = { $ne: null };
      } else {
        where['$car.carID$'] = null;
      }
    }
    const drivers = await Drivers.findAll({
      where,
      include: [
        {
          model: Cars,
          include: Types,
        },
      ],
    });

    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        total: drivers.length,
        drivers,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getDriversForPlan = async (req, res, next) => {
  try {
    const { capacity } = req.query;
    const where = {};
    if (capacity) where['$car.capacity$'] = { $gte: capacity }; // หาคนขับที่มีรถสามารถบรรทุกได้
    where.active = 1;
    const drivers = await Drivers.findAll({
      where,
      include: [
        {
          model: Cars,
          include: Types,
        },
      ],
    });
    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        total: drivers.length,
        drivers,
      },
    });
  } catch (err) {
    next(err);
  }
};

const post = async (req, res, next) => {
  try {
    const data = req.body;
    if (req.file) {
      data.image = req.file.filename;
    }
    const car = await Cars.findById(data.carID);
    if (_.isEmpty(car)) data.carID = undefined;
    const driver = await Drivers.create(data);

    if (driver) {
      // send mail register
      const token = await JWT.sign(driver.dataValues, secret, { expiresIn: 60 * 60 * 3 });
      const mail = new Mail({
        to: driver.email,
        subject: 'WELCOME TO AIRPORTELS',
        html: `
        <html>
          <body>
            <h1>WELCOME TO AIRPORTELS ${driver.fullname}</h1>
            <a href="${hostWeb}/registerdriver?token=${token}">CLICK HERE TO CREATE PASSWORD</a>
          </body>
        </html>
        `,
        successCallback: (suc) => {
          console.log(suc);
        },
        errorCallback: (err) => {
          console.log('EMAIL ERROR', err.message);
        },
      });
      mail.send();
    }

    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        driver,
      },
    });
  } catch (err) {
    if (req.file) fs.unlink(path.join(__dirname, `../public/img/drivers/${req.file.filename}`), () => {});
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const driver = await Drivers.findById(id);
    if (_.isEmpty(driver)) throw new Error(`Don't have driverID : ${id}`);
    if (req.file) {
      fs.unlink(path.join(__dirname, `../${driver.image}`), () => {});
      data.image = req.file.filename;
    }
    await driver.update(data);
    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        driver,
      },
    });
  } catch (err) {
    if (req.file) fs.unlink(path.join(__dirname, `../public/img/drivers/${req.file.filename}`), () => {});
    next(err);
  }
};

const del = async (req, res, next) => {
  try {
    const { id } = req.params;
    const driver = await Drivers.findById(id);
    if (_.isEmpty(driver)) throw new Error(`Don't have driverID : ${id}`);
    await fs.unlink(path.join(__dirname, `../${driver.image}`), () => {});
    await driver.destroy();
    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        driver,
      },
    });
  } catch (err) {
    next(err);
  }
};

const activate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const driver = await Drivers.findById(id);
    if (_.isEmpty(driver)) throw new Error(`Don't have driverID : ${id}`);
    await driver.update({
      active: !driver.active,
    });
    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        driver,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getLocations = async (req, res, next) => {
  try {
    const { driverID } = req.params;
    const { alltime } = req.query;
    if (_.isEmpty(driverID)) throw new Error('Please Request ID');

    const query = {
      driverID,
    };
    if (alltime !== 'true') {
      query.createDate = { $gte: moment().startOf('day'), $lt: moment().endOf('day') };
    }

    const driverLocations = await DriverLocation.find(query);
    if (driverLocations) {
      res.json({
        ok: true,
        message: `${req.method} ${req.path} SUCCESS`,
        data: {
          driverLocations: driverLocations.toObject(),
        },
      });
    } else {
      throw new Error('is empthy order id');
    }
  } catch (err) {
    next(err);
  }
};

const addLocation = async (req, res, next) => {
  try {
    const { driverID } = req.params;
    const {
      lat,
      lng,
    } = req.body;
    if (!driverID) throw new Error('Please Request driverID');
    if (!lat) throw new Error('Please Request lat');
    if (!lng) throw new Error('Please Request lng');

    const driver = new DriverLocation({
      driverID,
      lat,
      lng,
    });
    await driver.save();
    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        driver,
      },
    });
  } catch (err) {
    next(err);
  }
};

const pickupOrder = async (req, res, next) => {
  try {
    const { driverID } = req.params;
    if (!driverID) throw new Error('Please Request params driverID');

    const orderDrivers = await OrderDrivers.findAll({
      where: {
        driverID,
        createDate: {
          $like: `${moment().format(dateFormat)}%`,
        },
      },
    });

    if (!orderDrivers) throw new Error(`Driver : ${driverID} Don't Have orderDrivers`);
    await orderDrivers[0].update({ driverPickupDate: moment() });

    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
    });
  } catch (err) {
    next(err);
  }
};

const dropOrder = async (req, res, next) => {
  try {
    const { driverID } = req.params;
    if (!driverID) throw new Error('Please Request params driverID');
    const orderDrivers = await OrderDrivers.findAll({
      where: {
        driverID,
        createDate: {
          $like: `${moment().format(dateFormat)}%`,
        },
        driverPickupDate: {
          $ne: null,
        },
      },
    });
    if (!orderDrivers) throw new Error(`Driver : ${driverID} Don't Have orderDrivers`);

    await orderDrivers.update({ driverDropDate: moment() });

    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  get,
  post,
  update,
  del,
  activate,
  getDriversForPlan,

  getLocations,
  addLocation,

  pickupOrder,
  dropOrder,
};
