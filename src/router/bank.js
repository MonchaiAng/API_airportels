const Router = require('express').Router();

const controllers = require('../controllers');
const { auth } = require('../middlewares');

const CRUD = (router) => {
  router.get('/:id?', auth.ADMIN, controllers.bank.get);
};

module.exports = () => {
  CRUD(Router);
  return Router;
};
