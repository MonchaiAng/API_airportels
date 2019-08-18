const { check } = require('express-validator/check');
const Joi = require('joi');
const Router = require('express').Router();

const controllers = require('../controllers');

const { auth, validateBodyErrors, validatorBody } = require('../middlewares');

const CRUD = (router) => {
  router.get('', auth.ADMIN, controllers.order.get);
  router.patch(
    '/:id',
    auth.ADMIN,
    [check('placeId').isString(), check('type').isString()],
    validateBodyErrors,
    controllers.order.update,
  );
  router.put(
    '/resetStatus',
    controllers.order.updateStatus,
  );
};

module.exports = () => {
  CRUD(Router);
  return Router;
};
