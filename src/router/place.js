const { check } = require('express-validator/check');
const Router = require('express').Router();

const controllers = require('../controllers');
const { auth, validateBodyErrors } = require('../middlewares');

const CRUD = (router) => {
  router.get('/:id', auth.ADMIN, controllers.place.get);

  router.post(
    '',
    auth.ADMIN,
    [
      check('placeId').isString(),
      check('typeId').isInt(),
      check('latitude').isDecimal(),
      check('longitude').isDecimal(),
      check('name').isString(),
      check('address').isString(),
    ],
    validateBodyErrors,
    controllers.place.post,
  );
};

module.exports = () => {
  CRUD(Router);
  return Router;
};
