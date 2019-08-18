const { check } = require('express-validator/check');
const Router = require('express').Router();
const Joi = require('joi');

const { app: appColtrollers } = require('../../controllers');
const { auth, validateBodyErrors, validatorBody } = require('../../middlewares');
const { uploadConfig, uploadBag } = require('../../helpers/upload');

const App = (router) => {
  router
    .post('/auth/login', appColtrollers.auth.login)
    .post('/auth/register', appColtrollers.auth.register)
    .delete('/auth/logout', auth.DRIVER, appColtrollers.auth.logout)
    .patch('/auth/changePassword', auth.DRIVER,
      validatorBody({
        password: Joi.string().required(),
        newPassword: Joi.string().required(),
      }),
      appColtrollers.auth.changePassword)
    .post('/auth/forgotPassword',
      validatorBody({
        email: Joi.string().required(),
      }),
      appColtrollers.auth.forgotPassword)

    .get('/profile', auth.DRIVER, appColtrollers.auth.profile)
    .get('/profile/image/:name', auth.DRIVER, appColtrollers.auth.profileImage)
    .get('/wallet', auth.DRIVER, appColtrollers.wallet.get)
    .patch('/profile/image',
      auth.DRIVER,
      uploadConfig('image', 'drivers', 'img'),
      uploadBag.single('file'),
      appColtrollers.auth.editProfile)

    .get('/job/:planId?', auth.DRIVER, appColtrollers.job.get)
    .post('/job/:planId/accept', auth.DRIVER, appColtrollers.job.accept)
    .get('/notifications', auth.DRIVER, appColtrollers.notification.get)

    .patch('/online', auth.DRIVER, appColtrollers.job.online)
    .patch('/offline', auth.DRIVER, appColtrollers.job.offline)

    .post('/pickup',
      auth.DRIVER,
      uploadConfig('image', 'bags', 'img'),
      uploadBag.array('file', 3),
      validatorBody({
        orderId: Joi.number().required(),
        detail: Joi.string(),
      }),
      appColtrollers.job.pickup)
    .post('/pickupLicense',
      auth.DRIVER,
      uploadConfig('image', 'license', 'img'),
      uploadBag.single('file'),
      validatorBody({
        orderId: Joi.number().required(),
      }),
      appColtrollers.job.pickupLicense)
    .post('/dropoff',
      auth.DRIVER,
      uploadConfig('image', 'bags', 'img'),
      uploadBag.array('file', 3),
      validatorBody({
        orderId: Joi.number().required(),
        detail: Joi.string(),
      }),
      appColtrollers.job.dropoff)
    .post('/dropoffLicense',
      auth.DRIVER,
      uploadConfig('image', 'license', 'img'),
      uploadBag.single('file'),
      validatorBody({
        orderId: Joi.number().required(),
      }),
      appColtrollers.job.dropoffLicense)

    .get('/faq', appColtrollers.config.getFaq)
    .get('/manual', appColtrollers.config.getManual);
};

module.exports = () => {
  App(Router);
  return Router;
};
