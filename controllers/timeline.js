const moment = require('moment');
const _ = require('lodash');
// const distance = require('google-distance');

const MasterRoutePlans = require('../class/MasterRoutePlans');
// distance.apiKey = googleAPI;

const {
  Plans,
  Drivers,
  Cars,
  Types,
  PlanOrders,
  Orders,
} = require('../models');
const {
  dateFormat,
} = require('../lib');

const get = async (req, res, next) => {
  try {
    let { date } = req.query;
    const where = {};
    if (date) {
      date = moment.utc(date, dateFormat);
      where.planDate = date;
    }
    where.statusPlan = 1;
    let timeline = [];
    const plans = await Plans.findAll({
      where,
      order: [
        ['planID', 'ASC'],
      ],
      include: [
        {
          model: Drivers,
          include: [
            {
              model: Cars,
              include: Types,
            },
          ],
        },
        {
          model: PlanOrders,
          include: [
            {
              model: Orders,
              attributes: Orders.attributes,
              include: Orders.include,
            },
          ],
        },
      ],
    });
    let newPlans = [];
    if (plans.length > 0) {
      newPlans = await plans.map((plan) => {
        const planData = {};
        planData.planDate = plan.planDate;
        planData.planID = plan.planID;
        planData.driverID = plan.driverID;
        planData.driver = plan.driver;
        planData.ordersData = _.orderBy(plan.planorders, ['order.estimatetime.estimate']);
        planData.capacity = _.sumBy(plan.planorders, planorder => _.sumBy(planorder.order.luggages, 'amount'));
        // console.log(plan);
        return planData;
      });
    } else {
      const MRP = new MasterRoutePlans(date);
      const allOrders = await Orders.getOrders({ date: moment.utc(date).format(dateFormat), fullPlace: true });
      await MRP.setAllOrder(allOrders);
      await MRP.planning();
      const newPlansBeforeProcess = await Plans.updatePlan(MRP.plans, date);
      newPlans = await newPlansBeforeProcess.map((plan) => {
        const planData = {};
        planData.planDate = req.query.date;
        planData.planID = plan.planID;
        planData.driverID = plan.driverID;
        planData.driver = plan.driver;
        planData.ordersData = _.orderBy( plan.planorders, ['order.estimatetime.estimate']);
        planData.capacity = _.sumBy(plan.planorders, planorder => _.sumBy(planorder.order.luggages, 'amount'));
        return planData;
      });
    }
    newPlans = _.groupBy(newPlans, 'planDate');
    timeline = _.map(newPlans, (allPlans, planDate) => {
      return {
        planDate,
        totalPlans: allPlans.length,
        totalOrders: _.sumBy(allPlans, 'totalOrders'),
        plans: allPlans,
      };
    });
    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        timeline,
        totalTimeline: timeline.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

const addDriverToPlan = async (req, res, next) => {
  try {
    const { planID, driverID, planDate } = req.body;
    if (!planID) throw new Error('please request planID');
    if (!driverID) throw new Error('please request driverID');
    if (!planDate) throw new Error('please request planDate format YYYY-MM-DD');

    const driver = await Drivers.findById(driverID);
    if (!driver) throw new Error(`Dont Have driverID ${driverID}`);

    // const driverHavePlan = await Plans.findAll({
    //   where: {
    //     driverID,
    //     planDate: moment.utc(planDate, dateFormat),
    //   },
    // });
    // if (driverHavePlan.length > 0) throw new Error(`driver ${driverID} have plan today`);

    let plan = await Plans.findById(planID);
    if (!plan) throw new Error(`Dont Have planID ${planID}`);
    plan = await plan.update({
      driverID,
      updatedAt: moment.utc(),
    });

    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        plan,
      },
    });
  } catch (err) {
    next(err);
  }
};

const removeDriverFromPlan = async (req, res, next) => {
  try {
    const { planID } = req.body;
    let plan = await Plans.findById(planID);
    if (!plan) throw new Error(`Dont Have planID ${planID}`);
    plan = await plan.update({
      driverID: 0,
      updatedAt: moment.utc(),
    });

    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        plan,
      },
    });
  } catch (err) {
    next(err);
  }
};

const planner = async (req, res, next) => {
  try {
    const { date } = req.query;

    const MRP = new MasterRoutePlans(date);
    const ordersForPlans = await Orders.getOrders({ date: moment.utc(date).format(dateFormat), fullPlace: true });
    await MRP.setAllOrder(ordersForPlans);
    await MRP.planning();
    const { plans } = MRP;
    await Plans.updatePlan(plans, date);

    const ordersInPlans = [];
    plans.forEach((t) => {
      if (!t.orders) return;
      t.orders.forEach((order) => {
        ordersInPlans.push(order);
      });
    });
    // plans = plans.map((plan) => {
    //   const newPlan = plan;
    //   newPlan.orders = plan.orders.map(order => _.omit(order, ['timeline']));
    //   newPlan.orders = plan.orders.map(order => orderTimeSlot(order));

    //   newPlan.ordersID = _.join(_.uniq(_.sortBy(plan.orders, ['dropDate'])
    //     .map(order => `${order.orderCode}`)));

    //   newPlan.orders = undefined;
    //   return newPlan;
    // });

    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        totalOrdersInPlans: ordersInPlans.length,
        totalPlans: plans.length,
        plans,
      },
    });
  } catch (err) {
    next(err);
  }
};

const mrp = async (req, res, next) => {
  try {
    const { date } = req.query;
    const MRP = new MasterRoutePlans(date);
    const ordersForPlans = await Orders.getOrders({ date: moment.utc(date).format(dateFormat), fullPlace: true });
    await MRP.setAllOrder(ordersForPlans);
    await MRP.planning();

    const {
      plans,
      allOrders,
      orders,
    } = MRP;
    let orderInPlan = 0;
    plans.forEach((plan) => {
      orderInPlan += plan.orders.length;
    });
    console.log(plans.length, allOrders.length, orders.length, orderInPlan);

    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: plans,
    });
  } catch (err) {
    next(err);
  }
};

const mergeplan = async (req, res, next) => {
  try {
    const { planID, date } = req.body;
    const plans = await Plans.findAll({
      where: {
        planID,
      },
    });
    let orders = [];
    plans.forEach((plan) => {
      plan.json.orders.forEach(o => orders.push(o));
    });
    const where = {
      orderID: orders.map(o => o.orderID),
    };

    const MRP = new MasterRoutePlans(date);
    const allOrders = await Orders.getOrders({ date: moment.utc(date).format(dateFormat), fullPlace: true });
    orders = await Orders.getOrdersForPlan(where);
    MRP.merging = true;
    await MRP.setAllOrder(allOrders);
    await MRP.setOrders(orders);
    await MRP.planning();

    await MRP.plans.forEach(async (plan) => {
      const newPlan = await Plans.create({
        json: plan,
        driverID: 0,
        planDate: date,
      });
      return newPlan;
    });
    if (MRP.plans.length > 0) {
      plans.forEach((plan) => {
        plan.update({ statusPlan: 0 });
      });
    }
    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: MRP.plans,
    });
  } catch (err) {
    next(err);
  }
};

const shiftOrder = async (req, res, next) => {
  try {
    const { ordersID, planIDGift, planIDTake } = req.body;
    console.log('ordersID', ordersID);
    console.log('planIDGift', planIDGift);
    console.log('planIDTake', planIDTake);

    const planGift = await Plans.findById(planIDGift);
    const planTake = await Plans.findById(planIDTake);
    const date = planTake.planDate;
    const allOrders = await Orders.getOrders({ date: moment.utc(date).format(dateFormat), fullPlace: true });

    // ////// PLAN GIFT ///////
    let ordersIDGift = planGift.json.orders.map(order => order.orderID);
    ordersIDGift = _.pullAll(ordersIDGift, ordersID);
    const ordersGift = await Orders.getOrdersForPlan({
      orderID: ordersIDGift,
    });
    if (ordersIDGift.length > 0) {
      const MRPGift = new MasterRoutePlans(date);
      MRPGift.merging = true;
      await MRPGift.setAllOrder(allOrders);
      await MRPGift.setOrders(ordersGift);
      await MRPGift.planning();
      if (MRPGift.plans.length > 0) {
        await MRPGift.plans.forEach(async (plan) => {
          const newPlan = await Plans.create({
            json: plan,
            driverID: 0,
            planDate: date,
          });
          return newPlan;
        });
      }
      planGift.update({ statusPlan: 0 });
    } else {
      planGift.update({ statusPlan: 0 });
    }
    // ////////////////////////
    // ////// PLAN TAKE ///////
    let orders = planTake.json.orders;
    const MRPTake = new MasterRoutePlans(date);
    MRPTake.merging = true;
    await MRPTake.setAllOrder(allOrders);
    orders = await Orders.getOrdersForPlan({
      orderID: orders.map(o => o.orderID).concat(ordersID),
    });
    await MRPTake.setOrders(orders);
    await MRPTake.planning();
    if (MRPTake.plans.length > 0) {
      await MRPTake.plans.forEach(async (plan) => {
        const newPlan = await Plans.create({
          json: plan,
          driverID: 0,
          planDate: date,
        });
        return newPlan;
      });
      planTake.update({ statusPlan: 0 });
    }
    // ///////////////////////////
    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: MRPTake.plans,
    });
  } catch (err) {
    next(err);
  }
};

const getPlans = async (req, res, next) => {
  try {
    const { plansID } = req.body;
    const plans = await Plans.findAll({
      where: {
        planID: {
          $in: plansID,
        },
      },
    });
    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        total: plans.length,
        plans,
      },
    });
  } catch (err) {
    next(err);
  }
};

const orderChangePlan = async (req, res, next) => {
  try {
    const { orderID, planID } = req.body;
    const orderInPlan = await PlanOrders.find({ where: { orderID } });
    const plan = await Plans.find({ where: { planID } });
    if (!_.isEmpty(orderInPlan) && !_.isEmpty(plan)) {
      orderInPlan.update({ planID });
    } else {
      if (!orderInPlan) throw new Error('not have this order in plan');
      if (!planID) throw new Error('not have orderInPlan');
    }
    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        orderInPlan,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  mrp,
  mergeplan,
  shiftOrder,
  get,
  getPlans,

  orderChangePlan,

  planner,
  addDriverToPlan,
  removeDriverFromPlan,
};
