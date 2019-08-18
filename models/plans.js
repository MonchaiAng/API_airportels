
const _ = require('lodash');
const moment = require('moment');
const { map, forEach } = require('p-iteration');
const Sequelize = require('sequelize');
const sequelize = require('./connect');

const Drivers = require('./drivers');
const PlanOrders = require('./planOrders');
const EstimateTimes = require('./estimateTimes');
const { dateFormat, datetimeFormat } = require('../lib');

const Plans = sequelize.define('plans', {
  planID: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  driverID: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
  },
  planDate: Sequelize.DATE,
  createdAt: Sequelize.DATE,
  updatedAt: {
    type: Sequelize.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
  },
});

Plans.belongsTo(Drivers, { foreignKey: 'driverID' });
Plans.hasMany(PlanOrders, { foreignKey: 'planID' });

Plans.updatePlan = async (plans, date) => {
  const planDate = moment.utc(date, dateFormat);
  const plansDay = await Plans.findAll({
    where: {
      planDate,
    },
  });
  if (plansDay.length > 0) {
    plansDay.forEach(async (Plan) => {
      await Plan.destroy();
    });
  }
  const newsPlan = [];
  await map(plans, async (plan) => {
    const newPlan = await Plans.create({
      driverID: 0,
      planDate,
    });
    newsPlan.push(newPlan);

    await forEach(plan.orders, async (order) => {
      await PlanOrders.upsert({
        orderID: order.orderID,
        planID: newPlan.planID,
        logPlanID: newPlan.planID,
      });
      await EstimateTimes.upsert({
        orderID: order.orderID,
        estimate: moment.utc(order.driverPickupDate, datetimeFormat),
        timeleft: moment.utc(order.driverDropDate, datetimeFormat),
        logEstimate: moment.utc(order.driverPickupDate, datetimeFormat),
        logTimeleft: moment.utc(order.driverDropDate, datetimeFormat),
      });
    });
  });
  return newsPlan;
};

module.exports = Plans;
