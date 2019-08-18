const { check } = require('express-validator/check');
const Router = require('express').Router();

const controllers = require('../controllers');
const { auth, validateBodyErrors } = require('../middlewares');

const CRUD = (router) => {
  router.get('/:id?', auth.ADMIN, controllers.plan_comment.get);

  router.post(
    '',
    auth.ADMIN,
    [
      check('planId').isInt(),
      check('comment').isString(),
    ],
    validateBodyErrors,
    controllers.plan_comment.post,
  );

  router.patch(
    '/:id',
    auth.ADMIN,
    controllers.plan_comment.update,
  );

  router.delete(
    '/:id',
    auth.ADMIN,
    controllers.plan_comment.delete,
  );
};

module.exports = () => {
  CRUD(Router);
  return Router;
};
