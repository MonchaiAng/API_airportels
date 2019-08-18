const Router = require('express').Router();
const controllers = require('../controllers');

const CRUD = (router) => {
  router.patch('/mobile/irp/driverStartThePlan/:driverId/:planId', controllers.irp.updateWorkingStatus);

  router.get("/web/irp/refreshmentIRP/:orderId", controllers.irp.refreshmentIRP);
};

module.exports = () => {
  CRUD(Router);
  return Router;
};
