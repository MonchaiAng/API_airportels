const { check } = require('express-validator/check');
const Joi = require('joi');
const Router = require('express').Router();

const controllers = require('../controllers');
const { Users } = require('../models');
// const expressValidatorHelper = require("../helpers/expressValidatorHelper");

const { auth, validatorBody } = require('../middlewares');

const CRUD = (router) => {
  router.get('/:id?', auth.ADMIN, controllers.users.get);
  router.post(
    '',
    auth.ADMIN,
    validatorBody({
      firstname: Joi.string().required(),
      lastname: Joi.string().required(),
      email: Joi.string().email().required(),
      phone: Joi.string().length(10).required(),
      roleId: Joi.number().integer().required(),
      password: Joi.string().min(6).required(),
    }),
    controllers.users.post,
  );
  router.patch(
    '/:id',
    auth.ADMIN,
    validatorBody({
      firstname: Joi.string(),
      lastname: Joi.string(),
      email: Joi.string().email(),
      phone: Joi.string().length(10),
      roleId: Joi.number().integer(),
      currentPassword: Joi.string().min(6).required(),
    }),
    controllers.users.update,
  );

  router.patch(
    '/:id/password',
    auth.ADMIN,
    validatorBody({
      password: Joi.string().min(6).required(),
      currentPassword: Joi.string().min(6).required(),
    }),
    controllers.users.updatePassword,
  );
  router.delete('/:id', auth.ADMIN, controllers.users.delete);
};

module.exports = () => {
  CRUD(Router);
  return Router;
};
