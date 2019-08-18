const Router = require('express').Router();
const socket = require('../../socket');

const App = (router) => {
  router
    .post('/driver/newjob', (req, res, next) => {
      try {
        const { driverId } = req.body;
        socket.emit(`driver.notification.newjob/${driverId}`, {
          order_id: 'String()', // planId
          started_at: new Date(), // startTime
        });
        res.status(200).json({
          message: 'Send newjob',
        });
      } catch (err) {
        next(err);
      }
    });
};

module.exports = () => {
  App(Router);
  return Router;
};
