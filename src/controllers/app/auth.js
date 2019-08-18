const JWT = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const _ = require('lodash');

const { SECRET_DRIVER, driverExpire } = require('../../config/secret');
const {
  Drivers,
  DriverAuthentications,
  Cars,
  Companies,
  DriverRankings,
} = require('../../models');
const { getTokenFromRequest } = require('../../helpers');

const pathImage = (folderName, fileName) => `/public/img/${folderName}/${fileName}`;
const pathFileImage = (folderName, fileName) => path.join(__dirname, `../../../public/img/${folderName}/${fileName}`);

module.exports = {
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const driver = await Drivers.findOne({
        where: {
          email,
          isDeleted: false,
        },
      });
      if (!driver) throw new Error(`Not found driver ${email}.`);

      const isCorrectPassword = await bcrypt.compare(password, driver.password);
      if (!isCorrectPassword) throw new Error('wrong password.');

      const payload = _.pick(driver, ['id', 'email']);
      const token = await JWT.sign(payload, SECRET_DRIVER, {
        expiresIn: driverExpire,
      });
      DriverAuthentications.destroy({
        where: {
          driverId: driver.id,
        },
      });
      await DriverAuthentications.create({
        driverId: driver.id,
        token,
      });

      const resultDriver = _.pick(driver.dataValues, ['carId', 'rating', 'firstname', 'lastname']);
      resultDriver.token = token;
      res.status(200).json({
        status: 200,
        message: `${req.method} ${req.path} SUCCESS`,
        data: {
          driver: resultDriver,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  register: async (req, res, next) => {
    try {
      const { body, user } = req;
      const { password, email } = body;

      const hash = await bcrypt.hash(password, 10);
      if (!hash) throw new Error('Cannot hash password.');

      const result = await Drivers.findOne({
        where: {
          email,
        },
      });
      if (result) throw new Error(`This email: ${email} is registered.`);

      const newUser = await Drivers.create({
        email,
        password: hash,
        updatedBy: user.id,
        createdBy: user.id,
      });
      res.status(200).json({
        ok: true,
        message: `${req.method} ${req.path} SUCCESS`,
        data: {
          user: newUser,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  logout: async (req, res, next) => {
    try {
      const { user } = req;
      const token = getTokenFromRequest(req);
      const destroyedToken = await DriverAuthentications.destroy({
        where: {
          driverId: user.id,
        },
      });
      if (!destroyedToken) throw new Error('logout failed');

      res.status(200).json({
        status: 200,
        message: 'logout success',
      });
    } catch (err) {
      next(err);
    }
  },

  changePassword: async (req, res, next) => {
    try {
      const { user } = req;
      const { body } = req;
      const { password, newPassword } = body;

      const driver = await Drivers.findOne({
        where: {
          id: user.id,
        },
      });

      const isCorrectPassword = await bcrypt.compare(password, driver.password);
      if (!isCorrectPassword) throw new Error('wrong password.');

      if (!driver) throw new Error('Not found driver.');

      const hash = await bcrypt.hash(newPassword, 10);
      if (!hash) throw new Error('Cannot hash password.');

      // await driver.update({
      //   password: hash,
      // });

      res.status(200).json({
        status: 200,
        message: 'change password successed',
      });
    } catch (err) {
      next(err);
    }
  },

  profile: async (req, res, next) => {
    try {
      const { user } = req;
      let driver = await Drivers.findOne({
        attributes: ['id', 'rating', 'firstname', 'lastname', 'gender', 'image', 'birthday', 'cardType', 'cardDetail', 'phone', 'email', 'address', 'isOnline'],
        where: { id: user.id },
        include: [
          {
            attributes: {
              exclude: ['companyId', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'],
            },
            model: Cars,
            include: {
              attributes: ['id', 'name'],
              model: Companies,
            },
          },
          {
            attributes: ['id', 'name', 'description'],
            model: DriverRankings,
          },
        ],
      });
      driver = driver.toJSON();
      if (driver.image) driver.image = pathImage('drivers', driver.image);
      if (driver.car && driver.car.image) driver.car.image = pathImage('cars', driver.car.image);
      res.status(200).json({
        status: 200,
        message: `${req.method} ${req.path} SUCCESS`,
        data: {
          driver,
        },
      });
    } catch (err) {
      next(err);
    }
  },
  profileImage: async (req, res, next) => {
    try {
      if (!fs.existsSync(pathFileImage('drivers', req.params.name))) {
        throw new Error('Image Not found');
      } else {
        res
          .status(200)
          .sendFile(pathFileImage('drivers', req.params.name));
      }
    } catch (err) {
      next(err);
    }
  },
  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;

      // Send email to

      res.status(200).json({
        status: 200,
        message: `${req.method} ${req.path} SUCCESS`,
      });
    } catch (err) {
      next(err);
    }
  },

  editProfile: async (req, res, next) => {
    try {
      const { user } = req;
      const data = req.body;
      data.updatedBy = user.id;

      const driver = await Drivers.findById(user.id);
      if (!driver) throw new Error('Not found this driver');

      if (req.file) {
        if (driver.image !== 'default.png') {
          fs.unlink(path.join(__dirname, `../../../public/img/drivers/${driver.image}`), () => {});
        }
        data.image = req.file.filename;
      }

      await driver.update(data);

      res.status(200).json({
        status: 200,
        message: `${req.method} ${req.path} SUCCESS`,
        data: {
          driver,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
