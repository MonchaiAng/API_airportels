const { check } = require('express-validator/check');
const Router = require('express').Router();

const controllers = require('../controllers');
const { auth, validateBodyErrors } = require('../middlewares');
const { uploadConfig, upload } = require('../helpers/upload');

const CRUD = (router) => {
  router.get('/:id?', auth.ADMIN, controllers.car.get);

  router.post(
    '',
    auth.ADMIN,
    uploadConfig('image', 'cars', 'img'),
    upload,
    [
      check('carLicensePlate').isString(),
      check('brand').isString(),
      check('model').isString(),
      check('engine').isString(),
      check('carCapacity').isInt(),
      check('companyId').isInt(),
    ],
    validateBodyErrors,
    controllers.car.post,
  );

  router.patch(
    '/:id',
    auth.ADMIN,
    uploadConfig('image', 'cars', 'img'),
    upload,
    controllers.car.update,
  );

  router.delete(
    '/:id',
    auth.ADMIN,
    controllers.car.delete,
  );
};

const image = (router) => {
  router.get('/image/:name', controllers.car.image);
};

module.exports = () => {
  CRUD(Router);
  image(Router);
  return Router;
};
