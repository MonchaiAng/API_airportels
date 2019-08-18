const Router = require('express').Router();

const controllers = require('../controllers');

const { auth } = require('../middlewares');

const CRUD = (router) => {
  router.get('/', auth.ADMIN, controllers.statistic.get);
};

module.exports = () => {
  CRUD(Router);
  return Router;
};
