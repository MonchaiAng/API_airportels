const Router = require('express').Router();

const controllers = require('../controllers');

const { auth } = require('../middlewares');

const CRUD = (router) => {
  router.get('/orders', auth.ADMIN, controllers.report.getOrders);
  router.get('/drivers', auth.ADMIN, controllers.report.getDrivers);
  router.get('/plans', auth.ADMIN, controllers.report.getPlans);
};

module.exports = () => {
  CRUD(Router);
  return Router;
};
