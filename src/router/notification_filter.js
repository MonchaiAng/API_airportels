const { check } = require('express-validator/check');
const Router = require('express').Router();

const controllers = require('../controllers');
const { auth, validateBodyErrors } = require('../middlewares');

const CRUD = (router) => {
  router.get('/', auth.ADMIN, controllers.notification_filter.get);

  router.patch(
    '/:id',
    auth.ADMIN,
    controllers.notification_filter.update,
  );
};

module.exports = () => {
  CRUD(Router);
  return Router;
};
