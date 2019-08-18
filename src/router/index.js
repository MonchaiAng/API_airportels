const Router = require('express').Router();
const { errorResponse } = require('../errors/error');

Router.use((req, res, next) => {
  next();
});

Router.use('/web/auth', require('./auth')());

Router.use('/web/users', require('./user')());
Router.use('/web/plans', require('./plans')());
Router.use('/web/orders', require('./order')());

Router.use('/web/drivers', require('./driver')());

Router.use('/web/cars', require('./car')());

Router.use('/web/places', require('./place')());

Router.use('/web/banks', require('./bank')());
Router.use('/web/roles', require('./role')());
Router.use('/web/companies', require('./company')());

Router.use('/web/planComments', require('./plan_comment')());
Router.use('/web/reports', require('./report')());
Router.use('/web/statistics', require('./statitics')());

Router.use('/web/notifications', require('./notification')());

Router.use('/web/notificationFilters', require('./notification_filter')());

Router.use('/web/test', require('./test')());

Router.use('/app', require('./app/index')());

Router.use('/dev', require('./dev/index')());

Router.use(require('./irp')());

Router.use(errorResponse);

module.exports = Router;
