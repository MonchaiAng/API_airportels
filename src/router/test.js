const Router = require('express').Router();

const controllers = require('../controllers');

const { uploadConfig, uploadExcel } = require('../helpers/upload');
const { auth } = require('../middlewares');

const TEST = (router) => {
  router.post(
    '/importOrders',
    uploadConfig('', 'document', 'document'),
    uploadExcel,
    controllers.test.importOrders,
  );
  router.post(
    '/resetOrdersStatus',
    controllers.test.resetOrdersStatus,
  );
};

module.exports = () => {
  TEST(Router);
  return Router;
};
