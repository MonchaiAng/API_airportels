const { check } = require('express-validator/check');
const Joi = require('joi');
const Router = require('express').Router();

const controllers = require('../controllers');

const { auth, validateBodyErrors, validatorBody } = require('../middlewares');

const CRUD = (router) => {
  router.get('', auth.ADMIN, controllers.plan.get);

  router.post(
    '',
    auth.ADMIN,
    validatorBody({
      type: Joi.string()
        .valid(['driver', '3rd'])
        .required(),
      driverId: Joi.number().when('type', {
        is: 'driver',
        then: Joi.number().required(),
        otherwise: Joi.number(),
      }),
      capacity: Joi.number().when('type', {
        is: '3rd',
        then: Joi.number().required(),
        otherwise: Joi.number(),
      }),
      latitude: Joi.number().when('type', {
        is: 'driver',
        then: Joi.number().required(),
        otherwise: Joi.number(),
      }),
      longitude: Joi.number().when('type', {
        is: 'driver',
        then: Joi.number().required(),
        otherwise: Joi.number(),
      }),
      emergency: Joi.boolean(),
      time: Joi.string(),
    }),
    controllers.plan.generate,
  );
};

module.exports = () => {
  CRUD(Router);
  return Router;
};
