const { check } = require('express-validator/check');
const Router = require('express').Router();

const controllers = require('../controllers');
// const expressValidatorHelper = require("../helpers/expressValidatorHelper");

const { auth, validateBodyErrors } = require('../middlewares');

const Admin = (router) => {
  router
    .post(
      '/login/admin',
      [check('email').isEmail(), check('password').exists()],
      validateBodyErrors,
      controllers.auth.loginAdmin,
    )
    .post(
      '/register/admin',
      [check('email').isEmail(), check('password').exists()],
      validateBodyErrors,
      controllers.auth.registerAdmin,
    )
    .post('/logout/admin', auth.ADMIN, controllers.auth.logoutAdmin);
};

module.exports = () => {
  Admin(Router);
  return Router;
};
