const JWT = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const _ = require('lodash');

const { SECRET_ADMIN, adminExpire } = require('../config/secret');
const { Users, UserAuthentications } = require('../models');
const { getTokenFromRequest } = require('../helpers');

module.exports = {
  loginAdmin: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await Users.findOne({
        where: {
          email,
        },
      });
      if (!user) throw new Error(`Not found user ${email}.`);
      if (![1, 2, 3].includes(user.roleId)) throw new Error('This user cannot login this site.');

      const isCorrectPassword = await bcrypt.compare(password, user.password);
      if (!isCorrectPassword) throw new Error('wrong password.');

      const payload = _.pick(user, ['id', 'email', 'roleId']);
      const token = await JWT.sign(payload, SECRET_ADMIN, {
        expiresIn: adminExpire,
      });
      await UserAuthentications.create({
        userId: user.id,
        token,
      });

      const resultUser = user.dataValues;
      resultUser.token = token;
      res.status(200).json({
        status: 200,
        message: `${req.method} ${req.path} SUCCESS`,
        data: {
          user,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  registerAdmin: async (req, res, next) => {
    try {
      const { body, user } = req;

      const hash = await bcrypt.hash(body.password, 10);
      if (!hash) throw new Error('Cannot hash password.');

      const result = await Users.findOne({
        where: {
          email: body.email,
        },
      });
      if (result) throw new Error(`This email: ${body.email} is registered.`);

      body.password = hash;
      body.roleId = 1;
      body.updatedBy = user.id;
      body.createdBy = user.id;
      const newUser = await Users.create(body);
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

  logoutAdmin: async (req, res, next) => {
    try {
      const { user } = req;
      const token = getTokenFromRequest(req);
      const destroyedToken = await UserAuthentications.destroy({
        where: {
          token,
        },
      });
      if (!destroyedToken) throw new Error('logout failed');

      res.status(200).json({
        message: 'logout success',
      });
    } catch (err) {
      next(err);
    }
  },
};
