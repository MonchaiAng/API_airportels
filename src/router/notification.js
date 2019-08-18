const { check } = require('express-validator/check');
const Router = require('express').Router();

const controllers = require('../controllers');
const { auth, validateBodyErrors } = require('../middlewares');

const CRUD = (router) => {
  router.get('', auth.ADMIN, controllers.notification.get);
};

module.exports = () => {
  CRUD(Router);
  return Router;
};
