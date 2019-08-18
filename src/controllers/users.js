const bcrypt = require('bcrypt');
const { Users, Roles } = require('../models');

module.exports = {
  get: async (req, res, next) => {
    try {
      const { id } = req.params;
      const where = {};
      if (id) where.id = id;
      where.isDeleted = false;

      const users = await Users.findAll({
        where,
        include: [{ model: Roles }],
      });

      res.status(200).json({
        data: {
          users,
        },
      });
    } catch (err) {
      next(err);
    }
  },
  post: async (req, res, next) => {
    try {
      const { user } = req;
      const { firstname, lastname, email, phone, roleId, password } = req.body;

      if (user.roleId !== 1) throw new Error('Create user for admin only');

      const resultUser = await Users.findOne({
        where: { email },
      });
      if (resultUser) throw new Error(`This email: ${email} is registered.`);

      const hash = await bcrypt.hash(password, 10);
      if (!hash) throw new Error('Cannot hash password.');

      const newUser = await Users.create({
        firstname,
        lastname,
        email,
        phone,
        roleId,
        password: hash,
        createdBy: user.id,
        updatedBy: user.id,
      });
      res.status(200).json({
        data: {
          user: newUser,
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
      const { firstname, lastname, email, phone, roleId, currentPassword } = req.body;
      if (user.roleId !== 1) {
        if (+id !== +user.id) throw new Error('Cannot change the detail for another user.');
      }

      const currentUser = await Users.findOne({
        where: { id: user.id },
      });
      const isCorrentPassword = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isCorrentPassword) throw new Error('wrong current password.');

      const data = {
        firstname,
        lastname,
        email,
        phone,
        updatedBy: user.id,
      };

      if (user.roleId === 1) {
        if (roleId) data.roleId = roleId;
      }

      const [userUpdated] = await Users.update(data, {
        where: { id },
      });
      if (!userUpdated) throw new Error('Not found user');

      res.status(200).json({
        data: {
          user: userUpdated,
        },
      });
    } catch (err) {
      next(err);
    }
  },
  updatePassword: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { user } = req;
      const { password, currentPassword } = req.body;

      if (+id !== +user.id) throw new Error('Cannot change the password for another user.');

      const currentUser = await Users.findOne({
        where: {
          id: user.id,
        },
      });
      const isCorrentPassword = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isCorrentPassword) throw new Error('wrong current password.');

      const hash = await bcrypt.hash(password, 10);
      if (!hash) throw new Error('Cannot hash password.');

      const [userUpdated] = await Users.update(
        {
          password: hash,
          updatedBy: currentUser.id,
        },
        { where: { id } },
      );
      if (!userUpdated) throw new Error('Not found user');

      res.status(200).json({
        data: {
          user: userUpdated,
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

      const [userUpdated] = await Users.update(
        {
          isDeleted: true,
          updatedBy: user.id,
        },
        { where: { id } },
      );
      if (!userUpdated) throw new Error('Not found user');

      res.status(200).json({
        data: {
          user: userUpdated,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
