const JWT = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const _ = require('lodash');

const { secret, rolesPermission } = require('../config');
const Users = require('../models/users');

const saltRounds = 10;

const loginweb = async (req, res, next) => {
  try {
    const data = req.body;
    if (!data.email) throw new Error('Please request email');
    if (!data.password) throw new Error('Please request password');
    let user = await Users.find({
      where: {
        email: data.email,
      },
    });
    if (_.isEmpty(user)) throw new Error(`havn't this email ${data.email}`);
    const isUser = await bcrypt.compare(data.password, user.password);
    if (isUser) {
      if (!rolesPermission.roles[user.roleID].permissions.includes(1)) throw new Error('FAIL PERMISSION');
      
      user = _.pick(user, ['email', 'roleID']);
      const token = await JWT.sign(user, secret, { expiresIn: 60 * 60 * 24 });
      res.json({
        ok: true,
        message: `${req.method} ${req.path} SUCCESS`,
        data: {
          user,
          token,
        },
      });
    } else {
      throw new Error('wrong password');
    }
  } catch (err) {
    next(err);
  }
};

const register = async (req, res, next) => {
  try {
    const data = req.body;
    if (!data.password) throw new Error('Please request password');
    if (!data.roleID) throw new Error('Please request roleID');
    const usersSameEmail = await Users.find({
      where: {
        email: data.email,
      },
    });
    if (!_.isEmpty(usersSameEmail)) throw new Error(`this email ${data.email} has registered`);
    const hash = await bcrypt.hash(req.body.password, saltRounds);
    if (hash) {
      data.password = hash;
      const user = await Users.create(data);
      res.json({
        ok: true,
        message: `${req.method} ${req.path} SUCCESS`,
        data: {
          user,
        },
      });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  loginweb,
  register,
};
