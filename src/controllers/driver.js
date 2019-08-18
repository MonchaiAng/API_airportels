const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const JWT = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const { Drivers, Cars, DriverBankings, Banks, DriverRankings, Companies } = require('../models');
const Mail = require('../helpers/Mail');
const { storeDriverBankings } = require('../services/driver');
const { SECRET_DRIVER_REGISTER, driverRegisterExpire } = require('../config/secret');
const { hostWeb } = require('../../config');

module.exports = {
  get: async (req, res, next) => {
    try {
      const { id } = req.params;
      const where = {};
      if (id) where.id = id;

      where.isDeleted = false;
      const drivers = await Drivers.findAll({
        include: [
          {
            model: Cars,
            include: [{ model: Companies }],
          },
          {
            model: DriverBankings,
            include: [{ model: Banks }],
          },
          {
            model: DriverRankings,
          },
        ],
        where,
      });

      res.json({
        ok: true,
        data: {
          total: drivers.length,
          drivers,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  post: async (req, res, next) => {
    try {
      const data = req.body;
      const { user } = req;
      if (req.file) {
        data.image = req.file.filename;
      }
      data.createdBy = user.id;
      data.updatedBy = user.id;

      const car = await Cars.findById(data.carId);
      if (!car) throw new Error('Not found car');

      const bank = await Banks.findById(data.bankId);
      if (!bank) throw new Error('Not found bank');

      const driver = await Drivers.create(data);

      if (driver) {
        const token = await JWT.sign(driver.dataValues, SECRET_DRIVER_REGISTER, {
          expiresIn: driverRegisterExpire,
        });
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
          successCallback: suc => console.log(suc),
          errorCallback: err => console.log('EMAIL ERROR', err.message),
        });
        mail.send();
      }

      await storeDriverBankings(
        driver.id,
        bank.id,
        data.bankAccountNo,
        data.bankAccountName,
        data.bankCutOffPeriod,
        user.id,
      );

      res.json({
        ok: true,
        data: {
          driver,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { user } = req;
      const data = req.body;
      data.updatedBy = user.id;

      const driver = await Drivers.findById(id);
      if (!driver) throw new Error('Not found this driver');

      if (req.file) {
        if (driver.image !== 'default.png') {
          fs.unlink(path.join(__dirname, `../../public/img/drivers/${driver.image}`), () => {});
        }
        data.image = req.file.filename;
      }

      const bank = await Banks.findById(data.bankId);
      if (!bank) throw new Error('Not found bank');

      await driver.update(data);

      await storeDriverBankings(
        driver.id,
        bank.id,
        data.bankAccountNo,
        data.bankAccountName,
        data.bankCutOffPeriod,
        user.id,
      );

      res.json({
        ok: true,
        data: {
          driver,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { user } = req;
      const { id } = req.params;

      if (user.roleId !== 1) throw new Error('This function is only available for admin.');

      const [driverDeleted] = await Drivers.update({ isDeleted: true }, { where: { id } });
      if (!driverDeleted) throw new Error('Not found user');

      res.status(200).json({
        data: {
          driver: driverDeleted,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  image: async (req, res, next) => {
    try {
      if (!fs.existsSync(path.join(__dirname, `../../public/img/drivers/${req.params.name}`))) {
        throw new Error('Image Not found');
      } else {
        res
          .status(200)
          .sendFile(path.join(__dirname, `../../public/img/drivers/${req.params.name}`));
      }
    } catch (err) {
      next(err);
    }
  },

  createPassword: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      const hash = await bcrypt.hash(password, 10);
      if (!hash) throw new Error('Cannot hash password.');

      const [driver] = await Drivers.update({ password: hash }, { where: { id } });
      if (!driver) throw new Error('Not found driver');

      res.status(200).json({
        data: {
          driver,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  getNeedPlan: async (req, res, next) => {
    try {
      const drivers = await Drivers.findAll({
        include: [{ model: Cars }],
        where: { isOnline: 1, isDeleted: false },
      });
      res.json({
        ok: true,
        data: {
          total: drivers.length,
          drivers,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
