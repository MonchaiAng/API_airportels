const moment = require('moment');
const _ = require('lodash');
const Sequelize = require('sequelize');
const sequelize = require('./connect');

const { datetimeFormat, sqlDatetimeFormat } = require('../lib');

const EstimateTimes = sequelize.define('estimatetimes', {
  orderID: {
    type: Sequelize.INTEGER,
    primaryKey: true,
  },
  estimate: {
    type: Sequelize.DATE,
  },
  timeleft: {
    type: Sequelize.DATE,
  },
  logEstimate: {
    type: Sequelize.DATE,
  },
  logTimeleft: {
    type: Sequelize.DATE,
  },
});

EstimateTimes.updateOrderEstimate = async (order, estimate, timeleft) => {
  const { orderID } = order;
  estimate = estimate && moment.utc(estimate, datetimeFormat).format(sqlDatetimeFormat);
  timeleft = timeleft && moment.utc(timeleft, datetimeFormat).format(sqlDatetimeFormat);
  const estimateTime = await EstimateTimes.findById(orderID);
  if (!estimateTime) {
    EstimateTimes.create({
      orderID,
      estimate,
      timeleft,
    });
  } else {
    estimateTime.update(_.pickBy({
      estimate,
      timeleft,
    }, _.identity));
  }
};

module.exports = EstimateTimes;
