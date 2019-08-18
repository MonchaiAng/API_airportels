const { check } = require('express-validator/check');
const Joi = require('joi');
const Router = require('express').Router();

const controllers = require('../controllers');
const { auth, validateBodyErrors, validatorBody } = require('../middlewares');
const { uploadConfig, upload } = require('../helpers/upload');

const CRUD = (router) => {
  router.get('/:id?', auth.ADMIN, controllers.driver.get);
  router.post(
    '',
    auth.ADMIN,
    uploadConfig('image', 'drivers', 'img'),
    upload,
    [
      check('firstname').isString(),
      check('lastname').isString(),
      check('birthday').exists(),
      check('phone').isString(),
      check('email').isEmail(),
      check('address').isString(),
      check('cardType').isString(),
      check('cardDetail').isString(),
      check('carId').isInt(),
      check('bankId').isInt(),
      check('bankAccountNo').isString(),
      check('bankAccountName').isString(),
      check('bankCutOffPeriod').isString(),
    ],
    validateBodyErrors,
    controllers.driver.post,
  );
  router.patch(
    '/:id',
    auth.ADMIN,
    uploadConfig('image', 'drivers', 'img'),
    upload,
    controllers.driver.update,
  );
  router.delete('/:id', auth.ADMIN, controllers.driver.delete);
};

const image = (router) => {
  router.get('/image/:name', controllers.driver.image);
};

const createPassword = (router) => {
  router.patch(
    '/:id/createPassword',
    validatorBody({
      password: Joi.string()
        .min(6)
        .required(),
    }),
    controllers.driver.createPassword,
  );
};
const plan = (router) => {
  router.get('/needPlan', auth.ADMIN, controllers.driver.getNeedPlan);
};

module.exports = () => {
  plan(Router);
  image(Router);
  createPassword(Router);
  CRUD(Router);
  return Router;
};
