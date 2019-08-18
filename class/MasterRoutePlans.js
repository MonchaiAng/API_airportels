const moment = require('moment');
const _ = require('lodash');
const distance = require('google-distance');
const color = require('colors-cli');
const { map, find } = require('p-iteration');

const {
  // googleAPI,
  googleAPITest,
  develop,
} = require('../config');

distance.apiKey = googleAPITest;

const {
  Velocities,
  EstimateTimes,
} = require('../models');
const Distances = require('../models/mongoDB/distances');
const {
  dateFormat,
  datetimeFormat,
    calculateDistanceKm,
  getTimeOnDay,
} = require('../lib');
const { fetchAndInsertPlaceData } = require('../controllers/locations');

const {
  scheduleTime2nd,
  scheduleTime3rd,
  scheduleTime4th,
  maxMainCar,
  serviceTime,
  serviceTimeSameLoc,
  consolidatePlaceID,
  orderCodeCheckCase,
} = require('../MRPConfig');

const devLog = (order, message) => {
  if (develop && order.orderCode === orderCodeCheckCase
  // && order.dropPlace.name === 'T21'
  ) console.log(color.red_bt(message));
};
const devLogPlan = (ordersDeliver) => {
  if (develop) {
    ordersDeliver.forEach((order) => {
      console.log(
        order.orderCode === orderCodeCheckCase ? color.green_bt(order.orderCode) : order.orderCode,
        order.airbnb ? color.red_bt(order.airbnb) : '',
        order.dropLocTrue, `${order.dropLocConsolidate ? `(${order.dropLocConsolidate})` : ''}`, '->',
        order.pickupLocTrue, `${order.pickupLocConsolidate ? `(${order.pickupLocConsolidate})` : ''}`,
        color.green_bt(moment.utc(order.dropDate, datetimeFormat).format(datetimeFormat)),
        color.yellow_bt(moment.utc(order.driverPickupDate, datetimeFormat).format(datetimeFormat)),
        color.blue_bt(moment.utc(order.driverDropDate, datetimeFormat).format(datetimeFormat)),
        color.red_bt(moment.utc(order.pickupDate, datetimeFormat).format(datetimeFormat)),
      );
    });
  }
};
const insertPlaceOfOrder = (order) => {
  if (_.isEmpty(order.dropPlace.locationID)) {
    fetchAndInsertPlaceData(order.dropType, order.dropLoc);
  }
  if (_.isEmpty(order.pickupPlace.locationID)) {
    fetchAndInsertPlaceData(order.pickupType, order.pickupLoc);
  }
};
const selectQuarter = (originTime, velocitiesType) => {
  originTime = moment.utc(originTime, datetimeFormat).add(10, 'minutes');
  const day = moment.utc(originTime, datetimeFormat).format('YYYY-MM-DD');
  if (originTime >= moment.utc(`${day} 08:00`, 'YYYY-MM-DD HH:mm') && originTime < moment.utc(`${day} 11:00`, 'YYYY-MM-DD HH:mm')) {
    return velocitiesType.q1;
  } else if (originTime >= moment.utc(`${day} 11:00`, 'YYYY-MM-DD HH:mm') && originTime < moment.utc(`${day} 14:00`, 'YYYY-MM-DD HH:mm')) {
    return velocitiesType.q2;
  } else if (originTime >= moment.utc(`${day} 14:00`, 'YYYY-MM-DD HH:mm') && originTime < moment.utc(`${day} 17:00`, 'YYYY-MM-DD HH:mm')) {
    return velocitiesType.q3;
  } else if (originTime >= moment.utc(`${day} 17:00`, 'YYYY-MM-DD HH:mm') && originTime < moment.utc(`${day} 20:00`, 'YYYY-MM-DD HH:mm')) {
    return velocitiesType.q4;
  } else if (originTime >= moment.utc(`${day} 20:00`, 'YYYY-MM-DD HH:mm') && originTime < moment.utc(`${day} 23:00`, 'YYYY-MM-DD HH:mm')) {
    return velocitiesType.q5;
  } else {
    return velocitiesType.q1;
  }
};

const numFloor5 = (num) => {
  const x = num % 10;
  if (x === 1) return num + 4;
  if (x === 2) return num + 3;
  if (x === 3) return num + 2;
  if (x === 4) return num + 1;
  if (x === 5) return num + 0;
  if (x === 6) return num + 4;
  if (x === 7) return num + 3;
  if (x === 8) return num + 2;
  if (x === 9) return num + 1;
  return num;
};

// condition case
const customerBeforeCritical = (order, fastCritical) => {
  if (order.pickupPlace.name === 'T21' && moment.utc(order.dropDate, datetimeFormat) <= moment.utc(fastCritical, datetimeFormat).add(45, 'minutes')) return true;
  if (moment.utc(order.dropDate, datetimeFormat) <= moment.utc(fastCritical, datetimeFormat)) {
    return true;
  }
  devLog(order, `customerBeforeCritical ${moment.utc(order.dropDate, datetimeFormat)} <= ${moment.utc(fastCritical, datetimeFormat)} 
    ${moment.utc(order.dropDate, datetimeFormat) <= moment.utc(fastCritical, datetimeFormat)}`);
};
const driverBeforeCritical = (order) => {
  if (order.pickupPlace.name === 'T21' && moment.utc(order.driverPickupDate, datetimeFormat) <= moment.utc(order.critical, datetimeFormat).add(45, 'minutes')) return true;
  if (moment.utc(order.driverPickupDate, datetimeFormat) <= moment.utc(order.critical, datetimeFormat)) {
    return true;
  }
  devLog(order, `driverBeforeCritical ${order.orderCode} ${moment.utc(order.driverPickupDate, datetimeFormat)} ${moment.utc(order.critical, datetimeFormat)}`);
};
const driverBeforeCricalService = (order, fastCritical) => {
  if (order.dropPlace.name === 'T21' && moment.utc(order.driverPickupDate, datetimeFormat) <= moment.utc(fastCritical, datetimeFormat).add(30, 'minutes')) return true;
  if (order.pickupPlace.name === 'T21' && moment.utc(order.driverPickupDate, datetimeFormat) <= moment.utc(fastCritical, datetimeFormat).add(45, 'minutes')) return true;
  if (moment.utc(order.driverPickupDate, datetimeFormat) <= moment.utc(fastCritical, datetimeFormat)) {
    return true;
  }
  devLog(order, `driverBeforeCricalService ${order.orderCode} ${moment.utc(order.driverPickupDate, datetimeFormat)} ${moment.utc(fastCritical, datetimeFormat).add(45, 'minutes')}`);
};
const driverGoOnThreeHours = (order) => {
  if (order.dropPlace.type.name === 'mall') return true;
  if (moment.utc(order.driverPickupDate, datetimeFormat) <= moment.utc(order.dropDate, datetimeFormat).add(3, 'hours')) {
    return true;
  }
  devLog(order, `driverGoOnThreeHours ${order.orderCode}`);
};
const driverDontGoDropToSamePickupLoc = (order, ordersDeliver) => {
  const orders = ordersDeliver.filter(orderDeliver => orderDeliver.dropPlace.locationID === order.pickupPlace.locationID);
  if (orders.length === 0) {
    return true;
  }
  devLog(order, `driverDontGoDropToSamePickupLoc ${order.orderCode}`);
};
const driverDropAtOneAirport = (order, ordersDeliver) => {
  const orderDropAtAirport = ordersDeliver.find(o => o.pickupPlace.type.name === 'airport');
  if (order.pickupPlace.type.name !== 'airport') return true;
  if (order.dropPlace.type.name === 'airport' && order.pickupPlace.type.name === 'airport') return true;
  if (orderDropAtAirport) {
    if (order.pickupPlace.locationID === orderDropAtAirport.pickupPlace.locationID) {
      return true;
    }
  }
  devLog(order, `driverDropMoreAirport ${order.orderCode} ${order.pickupPlace.type.name}`);
};
const planNoOverLoad = (order, ordersDeliver, capacity) => {
  if (_.sumBy(ordersDeliver, 'luggage') + order.luggage <= capacity) {
    return true;
  }
  devLog(order, `planNoOverLoad ${order.orderCode} ${_.sumBy(ordersDeliver, 'luggage')} ${order.luggage}`);
};
const isDontGoPickupAtMallAfterHotel = (order, ordersDeliver) => {
  const lastOrder = ordersDeliver[ordersDeliver.length - 1];
  if (lastOrder.dropPlace.type.name === 'airport') {
    return true;
  } else if (lastOrder.dropPlace.type.name === 'hotel' && order.dropPlace.type.name !== 'mall') {
    return true;
  } else if (lastOrder.dropPlace.type.name === 'mall' && order.dropPlace.type.name !== 'hotel') {
    return true;
  }
  devLog(order, `isDontGoPickupAtMallAfterHotel ${order.dropPlace.type.name} ${lastOrder.dropPlace.type.name}`);
};
const isDontGoDropAtOtherAfterAirport = (order, ordersDeliver) => {
  const lastOrder = ordersDeliver[ordersDeliver.length - 1];
  if (lastOrder.pickupPlace.type.name !== 'airport') return true;
  if (lastOrder.pickupPlace.type.name === 'airport' && order.pickupPlace.type.name === 'airport') {
    return true;
  }
  devLog(order, `isDontGoDropAtOtherAfterAirport ${order.pickupPlace.type.name} ${lastOrder.pickupPlace.type.name}`);
};
const isDriverPickupOnlyOneType = (order, ordersDeliver) => {
  const orderOtherDropType = ordersDeliver.find(o => o.dropPlace.type.name !== order.dropPlace.type.name);
  if (!orderOtherDropType) {
    return true;
  }
  devLog(order, `isDriverPickupOnlyOneType ${order.pickupPlace.type.name}`);
};
const isDriverPickupAnyWithoutAirport = (order, lastOrder) => {
  if (lastOrder.dropPlace.type.name !== 'airport' && order.dropPlace.type.name === 'airport') {
    devLog(order, `isDriverPickupAnyWithoutAirport ${lastOrder.orderCode} ${lastOrder.dropPlace.type.name} ${order.orderCode} ${order.dropPlace.type.name}`);
    return true;
  }
};
const isAirBnBOutAndLate = (order) => {
  if (order.airbnb === 'out') {
    if (order.dropPlace.type.name === 'hotel' && moment.utc(order.dropDate, datetimeFormat).add(30, 'minutes') < moment.utc(order.driverPickupDate, datetimeFormat)) {
      devLog(order, `isAirBnBOutAndLate ${order.dropPlace.type.name}`);
      return true;
    }
  }
};

// error case
const driverDropBeforeCritical = (order) => {
  if (moment.utc(order.driverDropDate, datetimeFormat) < moment.utc(order.critical, datetimeFormat)) {
    return true;
  }
  devLog(order, `driverDropBeforeCritical ${order.orderCode} ${order.pickupPlace.type.name}`);
};
const driverDropBeforeCustomerPickup = (order) => {
  if (order.pickupPlace.name === 'T21' && moment.utc(order.driverDropDate, datetimeFormat) <= moment.utc(order.pickupDate, datetimeFormat)) return true;
  if (moment.utc(order.driverDropDate, datetimeFormat) <= moment.utc(order.pickupDate, datetimeFormat).add(-30, 'minutes')) {
    return true;
  }
  console.log(`driver drop after customer pickup ${order.orderCode} ${order.pickupPlace.name} ${order.pickupPlace.name !== 'T21'} ${moment.utc(order.driverDropDate, datetimeFormat) <= moment.utc(order.pickupDate, datetimeFormat).add(-30, 'minutes')} ${moment.utc(order.driverDropDate, datetimeFormat)} ${moment.utc(order.pickupDate, datetimeFormat).add(-30, 'minutes')}`);
};
const driverPickBeforeDrop = (order) => {
  if (moment.utc(order.driverPickupDate, datetimeFormat) < moment.utc(order.driverDropDate, datetimeFormat)) {
    return true;
  }
  console.log(`driverPickBeforeDrop ${order.orderCode} ${order.pickupPlace.type.name} xxx ${moment.utc(order.driverPickupDate, datetimeFormat)} ${moment.utc(order.driverDropDate, datetimeFormat)}`);
};

// IN SIDE DRIVERPICKUPDATE
const findOrderFastDriverPickupDate = (ordersDeliver) => {
  return ordersDeliver.reduce((prevOrder, currOrder) => { // _.minBy(ordersDeliver, 'driverPickupDate')
    return prevOrder.driverPickupDate < currOrder.driverPickupDate ? prevOrder : currOrder;
  });
};
const customerBeforeFastDriverPickup = (order, orderFirstDriverPickup) => moment.utc(order.dropDate) < moment.utc(orderFirstDriverPickup.driverPickupDate);

const driverDropAirbnb = async (order) => {
  if (order.airbnb && order.airbnb === 'in') {
    console.log(color.red_bt(`${order.orderCode} AIRBNB IN PROCESS DROP${moment.utc(order.pickupDate).format(datetimeFormat)}`));
    const oldTime = moment.utc(order.driverDropDate, datetimeFormat);
    const newTime = moment.utc(order.pickupDate, datetimeFormat).add(-30, 'minutes');
    const differentTime = newTime.diff(oldTime, 'minutes');
    order.driverPickupDate = moment.utc(order.driverPickupDate, datetimeFormat).add(differentTime, 'minutes').format(datetimeFormat);
    order.driverDropDate = newTime.format(datetimeFormat);
    console.log(color.red_bt('AIRBNB IN PROCESSED'));
    console.log(color.red_bt(oldTime.format(datetimeFormat)));
    console.log(color.red_bt(newTime.format(datetimeFormat)));
    console.log(color.red_bt(differentTime));
    console.log(color.red_bt(order.driverPickupDate));
    console.log(color.red_bt(order.driverDropDate));
    console.log(color.red_bt('AIRBNB IN PROCESSED'));
  }
  return order;
};

//---------------------------------------------------------------------------------------------------------

module.exports = class MasterRoutePlans {
  constructor(date) {
    this.date = date;
    this.plans = [];
    this.allOrders = [];
    this.orders = [];
    this.velocities = [];
    this.maxLuggage = 40;

    this.distances = [];
    this.needDistance = [];

    this.merging = false;
    this.driverWatingTime = 15;
    // reset date
    this.orderFastCritical = {};
    this.ordersDeliver = [];
  }

  async setAllOrder(allOrders) {
    this.allOrders = await allOrders;
  }

  async setOrders(orders) {
    this.orders = await orders;
  }

  async planning() {
    if (this.merging) this.driverWatingTime = 120;
    await this.setVelocities();
    await this.getAllDistance();
    if (this.orders.length === 0) this.orders = this.allOrders; // set all distance
    await this.orders.forEach(order => insertPlaceOfOrder(order)); // fetch for pull locations
    this.orderWithTrueLoc();

    this.orders = this.orders.map((order) => {
      order.dropDate = moment.utc(order.dropDate, datetimeFormat).format(datetimeFormat);
      order.critical = moment.utc(order.critical, datetimeFormat).format(datetimeFormat);
      order.pickupDate = moment.utc(order.pickupDate, datetimeFormat).format(datetimeFormat);
      return order;
    });
    await this.planningRecursive(); // (MAIN Process)

    await this.mergeSchedulePlans();
    await this.fetchAllNeedDistance();

    while (this.needDistance.length !== 0) { // reprocess planning while have nedd distance
      this.plans = [];
      this.orders = [];
      this.velocities = [];
      this.distances = [];
      this.needDistance = [];
      this.orderFastCritical = {};
      this.ordersDeliver = [];
      await this.planning();
    }
    

    this.plans = await map(this.plans, async (plan) => { // map data for api
      plan.orders = await map(plan.orders, async (order) => {
        // await EstimateTimes.updateOrderEstimate(order, moment.utc(order.driverPickupDate, datetimeFormat).format(datetimeFormat), moment.utc(order.driverDropDate, datetimeFormat).format(datetimeFormat));
        return _.pick(order, [
          'orderID',
          'orderCode',
          'customerID',
          'dropLoc',
          'pickupLoc',
          'dropDate',
          'pickupDate',
          'driverPickupDate',
          'driverDropDate',
          'critical',
          'timeline',
          'airbnb',
          'luggage',
          'dropType',
          'pickupType',

          'dropLocTrue',
          'pickupLocTrue',
          'criticalTrue',
          'dropDateTrue',
          'pickupDateTrue',
          'dropLocConsolidate',
          'pickupLocConsolidate',
        ]);
      });
      return plan;
    });
    return this.plans;
  }

  async setVelocities() { // set velocities of day
    if (!this.date) this.date = moment.utc().format(dateFormat);
    const velocities = await Velocities.findAll({
      where: {
        month: moment.utc(this.date).format('M'),
        day: moment.utc(this.date).format('E'),
      },
    });
    this.velocities = await velocities.map(v => v.dataValues);
  }

  async getAllDistance() { // get distance if needding
    let allLocations = [];
    this.allOrders.forEach((order) => {
      allLocations.push(_.pick(order.dropPlace, ['lat', 'lng']));
      allLocations.push(_.pick(order.pickupPlace, ['lat', 'lng']));
    });
    allLocations = _.uniqWith(allLocations, _.isEqual);
    let distances = await Distances.find({
      $or: [
        {
          origin: {
            $in: allLocations,
          },
        },
        {
          destination: {
            $in: allLocations,
          },
        },
      ],
    });
    distances = _.map(distances, d => _.pick(d, ['origin', 'destination', 'distance']));
    this.distances = distances;
  }

  async fetchAllNeedDistance() { // fetch need distance
    this.needDistance = _.uniqWith(this.needDistance, _.isEqual);
    this.needDistance.forEach((dis) => {
      console.log('NEED DISTANCE', dis.origin.lat, dis.origin.lng, dis.destination.lat, dis.destination.lng);
      distance.get({
        origin: `${dis.origin.lat},${dis.origin.lng}`,
        destination: `${dis.destination.lat},${dis.destination.lng}`,
      }, async (err, data) => {
        if (data) {
          await Distances.create({
            origin: dis.origin,
            destination: dis.destination,
            distance: data.distanceValue,
          });
        }
        if (err) console.log(err.message);
      });
    });
  }

  async planningRecursive() { // (MAIN Process) จัดทำ plans ทั้งหมด
    if (this.orders.length <= 0) {
      console.log('ENDING PLAN');
      return false;
    } else {
      this.orders = _.orderBy(this.orders, ['pickupLoc', 'dropType'], ['asc', 'asc']); // sort จัดเรียงสถานที่
      await this.findOrderFastestCritical();
      if (_.isEmpty(this.orderFastCritical)) {
        console.log('ERROR!!! DO NOT HAVE FAST');
        return false;
      } else {
        await this.orderStartDriverPickup();
        this.ordersDeliver.push(this.orderFastCritical); // ย้าย orderFastCritical เข้า plan
        this.orders = _.pullAll(this.orders, [this.orderFastCritical]);
        this.orders = await this.ordersWithDurationFromOrigin(this.orderFastCritical); // แปะระยะทางจากจุดเริ่ม
      }
      // this.orders = _.sortBy(this.orders, ['pickupLoc', 'dropDate', 'durationFromOrigin']); // เรียงและจัดกลุ่มสถานที่ๆต้องไปส่ง และเวลาที่ใกล้ที่สุดก่อน
      if (develop) {
        console.log('PLAN :', this.plans.length + 1);
        console.log('order fast critical', this.orderFastCritical.orderCode, this.orderFastCritical.driverPickupDate);
      }
      await this.switchOrderToDeliverRecursive(); // (MAIN Process) push orders to plan and make driverPickupDate of order
      const mainCar = this.isMainCar(); // don't move me
      await this.reversProcessBeforePlans(); // (reverse Process) plan reverse keep before plan
      await this.ordersWithDriverDropDate(0); // (MAIN Process) make driverDropDate of order
      // กรอง Error
      this.ordersDeliver = this.ordersDeliver.filter((order) => {
        if (order === _.minBy(this.ordersDeliver, 'critical')) { // order fast critical should no error
          return true;
        } else if (
          driverPickBeforeDrop(order)
          && driverDropBeforeCustomerPickup(order)
        ) {
          return true;
        } else {
          console.log(color.red_bt('ORDER ERROR CASE'));
          this.orders.push(order); // เอา order ที่ถูกคัดออกกลับไปใน orders เพื่อนำมา plan ใหม่
          return false;
        }
      });
      this.orders = _.pullAll(this.orders, this.ordersDeliver); // ย้าย ordersDeliver ทั้งหมด เข้าplan

      if (this.ordersDeliver.length > 0) {
        this.ordersDeliver = _.orderBy(this.ordersDeliver, ['driverPickupDate', 'driverDropDate']);
        // this.ordersDeliver = await map(this.ordersDeliver, async (order) => {
        //   await EstimateTimes.updateOrderEstimate(order, order.driverPickupDate, order.driverDropDate);
        //   return order;
        // });
        const plan = {
          capacity: _.sumBy(this.ordersDeliver, 'luggage'),
          totalOrders: this.ordersDeliver.length,
          route: this.makeRoutePlan(),
          driverStart: _.minBy(this.ordersDeliver, 'driverPickupDate').driverPickupDate,
          driverEnd: _.minBy(this.ordersDeliver, 'driverDropDate').driverDropDate,
          schedule: await this.numberSchedule(),
          mainCar,
          orders: this.ordersDeliver,
        };
        devLogPlan(this.ordersDeliver);
        this.ordersDeliver = []; // clear for new plan
        this.orderFastCritical = {}; // clear for new plan
        this.plans.push(plan);
      }
      await this.planningRecursive(); // (MAIN Process)
    }
  }

  // (reverse process) merge before plan if this plan can haddle orders from before plan
  async reversProcessBeforePlans() {
    const plansCanMerge = await find(this.plans, async (plan) => {
      const lastOrder1stPlan = _.maxBy(plan.orders, 'driverPickupDate');
      const firstOrder2ndPlan = _.minBy(this.ordersDeliver, 'driverPickupDate');
      const lastOrder2ndPlan = _.maxBy(this.ordersDeliver, 'driverPickupDate');
      const lastLoc1stPlan = _.maxBy(plan.orders, 'driverPickupDate').pickupPlace.name;
      const lastLoc2ndPlan = _.maxBy(this.ordersDeliver, 'driverPickupDate').pickupPlace.name;
      const fastCritical1stPlan = _.minBy(plan.orders, 'critical');
      const fastCritical2ndPlan = _.minBy(this.ordersDeliver, 'critical');
      const distanceTime = await this.distanceTimeOriginToDestination(lastOrder1stPlan.dropPlace, firstOrder2ndPlan.dropPlace, firstOrder2ndPlan.driverPickupDate);
      const newTime = moment.utc(firstOrder2ndPlan.driverPickupDate, datetimeFormat).add(-(serviceTime + distanceTime), 'minutes').format(datetimeFormat);
      const diffTime = moment.utc(firstOrder2ndPlan.driverPickupDate, datetimeFormat).diff(moment.utc(newTime, datetimeFormat), 'seconds');
      const lastOrder1stPlanNewTime = moment.utc(lastOrder1stPlan.driverPickupDate, datetimeFormat).add(diffTime, 'seconds').format(datetimeFormat);
      if (
        moment.utc(lastOrder1stPlanNewTime, datetimeFormat) <= moment.utc(fastCritical1stPlan.critical, datetimeFormat)
        && moment.utc(lastOrder1stPlanNewTime, datetimeFormat) <= moment.utc(firstOrder2ndPlan.driverPickupDate, datetimeFormat)
        && lastLoc1stPlan === 'T21' && lastLoc2ndPlan === 'T21'
        && moment.utc(firstOrder2ndPlan.driverPickupDate, datetimeFormat) < getTimeOnDay(this.date, scheduleTime3rd)
        && moment.utc(fastCritical1stPlan.critical, datetimeFormat) >= moment.utc(fastCritical2ndPlan.critical, datetimeFormat)
      ) {
        plan.orders = plan.orders.map((order) => {
          order.driverPickupDate = moment.utc(order.driverPickupDate, datetimeFormat).add(diffTime, 'seconds').format(datetimeFormat);
          order.driverDropDate = undefined;
          return order;
        });
        this.ordersDeliver = this.ordersDeliver.concat(plan.orders);
        this.plans = this.plans.filter(p => p !== plan);
        return true;
      }
    });
  }

  async numberSchedule() {
    const driverEnd = _.minBy(this.ordersDeliver, 'driverDropDate').driverDropDate;
    let schedule = 99;
    if (
      moment.utc(driverEnd, datetimeFormat) <= getTimeOnDay(this.date, scheduleTime2nd)
    ) {
      schedule = 1;
    } else if (
      moment.utc(driverEnd, datetimeFormat) <= getTimeOnDay(this.date, scheduleTime3rd && _.minBy(this.ordersDeliver, 'driverDropDate').pickupPlace.name === 'T21')
    ) {
      schedule = 2;
    } else if (
      moment.utc(driverEnd, datetimeFormat) <= getTimeOnDay(this.date, scheduleTime4th)
    ) {
      schedule = 3;
    } else if (
      moment.utc(driverEnd, datetimeFormat) > getTimeOnDay(this.date, scheduleTime4th)
    ) {
      schedule = 4;
    }
    return schedule;
  }

  async mergeSchedulePlans() {
    // reverse merge 1st schedule
    this.plans = _.orderBy(this.plans, ['schedule', 'totalOrders'], ['asc', 'desc']);
    const plansMainCar = [];

    this.plans.forEach((plan) => {
      const fixWasteTime = false;
      const orderAirbnbOut = plan.orders.find(o => o.airbnb === 'out');
      if (fixWasteTime && !orderAirbnbOut) {
        if (this.isOrdersGoToSchedule2nd(plan.orders)) { // plus driver time to 12:55
          const lastDriverDrop = moment.utc(_.maxBy(plan.orders, 'driverDropDate').driverDropDate, datetimeFormat);
          let diffTime = getTimeOnDay(this.date, scheduleTime2nd).add(-5 * 60, 'seconds').diff(lastDriverDrop, 'seconds');
          if (diffTime >= 180 * 60) diffTime = 180 * 60;
          plan.orders = plan.orders.map((order) => {
            order.driverPickupDate = moment.utc(order.driverPickupDate, datetimeFormat).add(diffTime, 'seconds').format(datetimeFormat);
            order.driverDropDate = moment.utc(order.driverDropDate, datetimeFormat).add(diffTime, 'seconds').format(datetimeFormat);
            return order;
          });
        }
        if (this.isOrdersGoToSchedule4th(plan.orders)) { // plus driver time to 15:55
          const lastDriverDrop = moment.utc(_.maxBy(plan.orders, 'driverDropDate').driverDropDate, datetimeFormat);
          let diffTime = getTimeOnDay(this.date, scheduleTime4th).add(-5 * 60, 'seconds').diff(lastDriverDrop, 'seconds');
          if (diffTime >= 180 * 60) diffTime = 180 * 60;
          plan.orders = plan.orders.map((order) => {
            order.driverPickupDate = moment.utc(order.driverPickupDate, datetimeFormat).add(diffTime, 'seconds').format(datetimeFormat);
            order.driverDropDate = moment.utc(order.driverDropDate, datetimeFormat).add(diffTime, 'seconds').format(datetimeFormat);
            return order;
          });
        }
      }
    });

    // merge schedule
    this.plans.forEach((plan) => {
      const lastPlan = plansMainCar.find((p) => {
        const orderFirst = _.minBy(plan.orders, 'driverPickupDate');
        const orderFinal = _.maxBy(plan.orders, 'driverDropDate');
        const orderLast = _.maxBy(p.orders, 'driverDropDate');
        const lastDate = moment.utc(orderLast.driverDropDate, datetimeFormat);
        const firstDate = moment.utc(orderFirst.driverPickupDate, datetimeFormat);
        const differentTime = firstDate.diff(lastDate, 'minutes');

        // const orderDropAirport = p.orders.find(o => o.dropPlace.type.name === 'airport');
        const orderPickupAirport = p.orders.find(o => o.pickupPlace.type.name === 'airport');
        let carIsMain = '';
        // if (orderDropAirport) {
        //   carIsMain = orderDropAirport.dropPlace.name;
        // }
        if (orderPickupAirport) {
          carIsMain = orderPickupAirport.pickupPlace.name;
        }

        let carIsMain2 = '';
        // if (orderFinal.dropPlace.type.name === 'airport') carIsMain2 = orderFirst.dropPlace.name;
        if (orderFinal.pickupPlace.type.name === 'airport') carIsMain2 = orderFinal.pickupPlace.name;

        if (true
          // && (carIsMain === carIsMain2)
          && orderFirst.dropPlace.locationID === orderLast.pickupPlace.locationID
          && lastDate <= firstDate
          && (differentTime <= 90 && differentTime > 0)
        ) {
          // if (carIsMain && carIsMain2 && carIsMain === carIsMain2) {
          //   return true;
          // }
          // if (!carIsMain || !carIsMain2) {
          //   return true;
          // }
          return true;
        }
        return false;
      });

      if (lastPlan) {
        let mergeOrders = lastPlan.orders.concat(plan.orders);
        // marge order if consolidate order in same plan
        // mergeOrders = mergeOrders.reduce((orders, order) => {
        //   if (!orders) orders = [order];
        //   const orderSameID = orders.find(o => o.orderCode === order.orderCode);
        //   const indexOrderSameID = orders.find(o => o.orderCode === order.orderCode);
        //   if (orderSameID) {
        //     const mergedOrder = moment.utc(orderSameID.dropDate, datetimeFormat) < moment.utc(order.dropDate, datetimeFormat) ? orderSameID : order;
        //     const ordersDropFirstAirport = mergeOrders.filter(o => o.pickupPlace.type.name === 'airport' && order.pickupPlace.name === o.pickupPlace.name);
        //     if (ordersDropFirstAirport.length > 0) {
        //       mergedOrder.driverDropDate = _.minBy(ordersDropFirstAirport, 'driverDropDate').driverDropDate;
        //     } else {
        //       mergedOrder.driverDropDate = order.driverDropDate;
        //     }
        //     mergedOrder.pickupLoc = order.pickupLoc;
        //     mergedOrder.pickupPlace = order.pickupPlace;
        //     // mergedOrder.dropLocConsolidate = undefined;
        //     mergedOrder.pickupLocConsolidate = undefined;
        //     orders[indexOrderSameID] = mergedOrder;
        //     return orders;
        //   } else {
        //     return orders.concat(order);
        //   }
        // }, []); // end merge order
        lastPlan.orders = mergeOrders; // lastPlan.orders.concat(plan.orders);
        lastPlan.capacity = _.sumBy(lastPlan.orders, 'luggage');
        lastPlan.totalOrders = lastPlan.orders.length;
        // lastPlan.route = this.makeRoutePlan(),
        lastPlan.driverStart = _.minBy(lastPlan.orders, 'driverPickupDate').driverPickupDate;
      } else {
        plansMainCar.push(plan);
      }
    });

    if (develop) {
      plansMainCar.forEach((plan, i) => {
        console.log('MERGED PLAN :', i + 1);
        devLogPlan(plan.orders);
      });
    }
    this.plans = plansMainCar;
  }

  async switchOrderToDeliverRecursive() { // (MAIN process) เลือก order ที่เหมาะสมเข้าใน ordersDeliver เพื่อจัดทำ plan
    const lastOrder = _.maxBy(this.ordersDeliver, 'driverPickupDate');
    devLog(this.orderFastCritical, `ORDER FAST CRI ${this.orderFastCritical.driverPickupDate}`);
    this.orders = await this.ordersWithDurationFromOrigin(lastOrder); // แปะระยะทางจากจุดเริ่ม
    this.orders = _.orderBy(this.orders, ['durationFromOrigin', 'dropDate', 'critical', 'dropType'], ['asc', 'asc', 'asc', 'asc']);
    // if (develop) console.log(`ORDER DELIVER ${this.ordersDeliver.map(o => o.orderCode)}`);
    // if (develop) console.log(`ORDER ~> ${lastOrder.orderCode} ${this.orders.map(o => `${o.orderCode} ${o.durationFromOrigin}`)[0]}`);

    const orderNext = await find(this.orders, async (order) => { // investigate order
      order = await this.orderWithDriverPickupDate(order); // make driverPickupDate of order
      devLog(order, `ORDER TIME : ${moment.utc(order.dropDate, datetimeFormat)} ${moment.utc(order.pickupDate, datetimeFormat)} ${moment.utc(order.driverPickupDate, datetimeFormat)}`);
      if (this.merging) {
        // return true;
      }
      if (!planNoOverLoad(order, this.ordersDeliver, this.maxLuggage)) return false;
      if (!driverDropAtOneAirport(order, this.ordersDeliver)) return false;

      if (lastOrder.dropDate === order.dropDate && lastOrder.dropPlace.name === order.dropPlace.name && !order.airbnb) return true;

      if (!driverGoOnThreeHours(order)) return false;
      if (isDriverPickupAnyWithoutAirport(order, lastOrder)) return false;
      if (!this.isDriverPickupAtOneAirport(order)) return false;

      if (!this.isSchedule1stSlot(order)) return false;
      if (!this.isCanScheduleConsolidateT21(order)) return false;
      if (!this.isCanScheduleConsolidateAirport(order)) return false;
      if (!this.isMainCar1stSchedule(order)) return false;

      if (isAirBnBOutAndLate(order)) return false;

      if (!customerBeforeCritical(order, _.minBy(this.ordersDeliver, 'critical').critical)) return false;
      if (!driverBeforeCritical(order)) return false;
      if (!driverBeforeCricalService(order, _.minBy(this.ordersDeliver, 'critical').critical)) return false; // xxx
      if (!driverDontGoDropToSamePickupLoc(order, this.ordersDeliver)) return false;
      if (!isDontGoDropAtOtherAfterAirport(order, this.ordersDeliver)) return false;

      if (this.isDriverAfterCustomer(order)) {
        if (moment.utc(order.driverPickupDate, datetimeFormat) <= moment.utc(order.dropDate, datetimeFormat)) {
          devLog(order, `driver waiting customer ${moment.utc(order.dropDate, datetimeFormat)}`);
          const diffTime = moment.utc(order.dropDate, datetimeFormat).diff(moment.utc(order.driverPickupDate, datetimeFormat), 'seconds');
          if (diffTime > 0) {
            // console.log('diffTime', this.ordersDeliver.map(o => o.orderCode), order.orderCode, moment.utc(order.driverPickupDate, datetimeFormat).format(datetimeFormat), diffTime / 60);
            // this.ordersDeliver = this.ordersDeliver.map((o) => {
            //   o.driverPickupDate = moment.utc(o.driverPickupDate, datetimeFormat).add(diffTime, 'seconds').format(datetimeFormat);
            //   return o;
            // });
          }
          order.driverPickupDate = moment.utc(order.dropDate, datetimeFormat).format(datetimeFormat);
        }
      } else {
        devLog(order, `driver before customer ${moment.utc(order.driverPickupDate, datetimeFormat)} ${moment.utc(order.dropDate, datetimeFormat)}`);
        return false;
      }
      return true;
    });

    if (orderNext) {
      this.ordersDeliver.push(orderNext);
      this.orders = _.pull(this.orders, orderNext);
      await this.switchOrderToDeliverRecursive(); // (Main Process)
    } else {
      return false;
    }
  }

  isDriverAfterCustomer(order) {
    if (moment.utc(order.driverPickupDate, datetimeFormat).add(this.driverWatingTime, 'minutes') >= moment.utc(order.dropDate, datetimeFormat)) {
      return true;
    }
    devLog(order, `driver before Customer ${order.orderCode} ${moment.utc(order.dropDate).format(datetimeFormat)} ${order.driverPickupDate}`);
  } // ??? รถควรจะมารอไหม

  isSchedule1stSlot(order) { // จัดการ order ที่ต้องไปฝาก T21
    const ordersDropConsolidate = this.ordersDeliver.filter(orderDeliver => orderDeliver.pickupPlace.locationID === consolidatePlaceID); // หาว่ามี order ที่ต้องไป T21
    const lastOrdersDropConsolidate = _.maxBy(ordersDropConsolidate, 'driverPickupDate'); // หาเวลาสุดท้ายที่ต้องไปรับก่อนไป T21

    const ordersSpeedDropT21 = ordersDropConsolidate.find(orderDeliver => moment.utc(orderDeliver.pickupDate, datetimeFormat) < getTimeOnDay(this.date, '15:45')); // หา order ที่ต้องส่งลูกค้าก่อน 15:45
    const ordersBeforeFirstT21 = ordersDropConsolidate.find(orderDeliver => moment.utc(orderDeliver.driverPickupDate, datetimeFormat) < getTimeOnDay(this.date, '12:00')); // หา order ที่ต้องส่งลูกค้าก่อน 15:45
    if (lastOrdersDropConsolidate && moment.utc(lastOrdersDropConsolidate.driverPickupDate, datetimeFormat) < getTimeOnDay(this.date, '12:00')) { // ถ้ามีต้องไปรับของก่อนไป T21 ก่อน 12:00
      if (
        moment.utc(order.driverPickupDate, datetimeFormat) <= getTimeOnDay(this.date, '12:00')
        && order.pickupPlace.name === lastOrdersDropConsolidate.pickupPlace.name // ถ้า order นี้ต้องไปรับของก่อน 12:00
      ) {
        devLog(order, `is schedule 1st slot 000 ${order.driverPickupDate} ${order.pickupPlace.name}`);
        return true;
      } else if (!ordersSpeedDropT21) { // ถ้าไม่มีต้องส่งก่อน 15:45 ให้รับไปด้วย
        devLog(order, `is slow to conso T21 13:00 ~> 16:00 ${order.driverPickupDate}`);
        return true;
      }
      devLog(order, `is not schedule 1st slot 111 ${order.driverPickupDate} ${order.pickupPlace.name}`);
    } else {
      const mainCar = this.plans.filter(plan => plan.mainCar).length;
      if (mainCar < maxMainCar) { // ถ้าเป็น maincar ให้ไปส่งที่ T21 ตอนรอบบ่าย ถ้าไม่ใช่ maincar ให้รับ order ได้เรื่อยๆถึงเย็น
        if (ordersBeforeFirstT21) {
          devLog(order, `is have order pickup before 1st conso ${order.driverPickupDate}`);
          return false;
        }
      }
      return true;
    }
    devLog(order, `is not schedule 1st slot ดฟสหำ ${order.driverPickupDate} ${order.pickupPlace.name}`);
    return false;
  }

  isCanScheduleConsolidateT21(order) { // order ที่ไปส่ง T21
    const ordersConsolidation = this.ordersDeliver.filter(o => o.dropPlace.name === 'T21');
    const orderConsolidationLastDriverPickup = _.maxBy(ordersConsolidation, 'driverPickupDate');
    if (orderConsolidationLastDriverPickup) {
      if (
        moment.utc(orderConsolidationLastDriverPickup.driverPickupDate, datetimeFormat) <= getTimeOnDay(this.date, scheduleTime2nd)
        // && moment.utc(order.driverPickupDate, datetimeFormat) > getTimeOnDay(this.date, scheduleTime2nd)
        && moment.utc(order.dropDate, datetimeFormat) > getTimeOnDay(this.date, scheduleTime2nd)
      ) {
        devLog(order, `isCanScheduleConsolidateT21 13:00 ${moment.utc(orderConsolidationLastDriverPickup.driverPickupDate, datetimeFormat).format(datetimeFormat)}`);
        return false;
      } else if (
        moment.utc(orderConsolidationLastDriverPickup.driverPickupDate, datetimeFormat) <= getTimeOnDay(this.date, scheduleTime4th)
        // && moment.utc(order.driverPickupDate, datetimeFormat) > getTimeOnDay(this.date, scheduleTime4th)
        && moment.utc(order.dropDate, datetimeFormat) > getTimeOnDay(this.date, scheduleTime4th)
      ) {
        devLog(order, `isCanScheduleConsolidateT21 16:00 ${moment.utc(orderConsolidationLastDriverPickup.driverPickupDate, datetimeFormat).format(datetimeFormat)}`);
        return false;
      } else {
        // devLog(order, `xxxxx ${moment.utc(orderConsolidationLastDriverPickup.driverPickupDate, datetimeFormat)} ${moment.utc(order.driverPickupDate, datetimeFormat)}`)
        return true;
      }
    } else {
      return true;
    }
  }

  isCanScheduleConsolidateAirport(order) {
    const ordersConsolidation = this.ordersDeliver.filter(o => o.dropPlace.type.name === 'airport');
    const orderConsolidationLastDriverPickup = _.maxBy(ordersConsolidation, 'driverPickupDate');
    if (orderConsolidationLastDriverPickup) {
      if (
        moment.utc(orderConsolidationLastDriverPickup.driverPickupDate, datetimeFormat) <= getTimeOnDay(this.date, '15:00')
        && moment.utc(order.driverPickupDate, datetimeFormat) > getTimeOnDay(this.date, '15:00')
      ) {
        devLog(order, `isCanScheduleConsolidateAirport 15:00 ${moment.utc(orderConsolidationLastDriverPickup.driverPickupDate, datetimeFormat).format(datetimeFormat)}`);
        return false;
      } else if (
        moment.utc(orderConsolidationLastDriverPickup.driverPickupDate, datetimeFormat) <= getTimeOnDay(this.date, '15:00')
        && moment.utc(order.driverPickupDate, datetimeFormat) > getTimeOnDay(this.date, '15:00')
      ) {
        devLog(order, `isCanScheduleConsolidateAirport 16:00 ${moment.utc(orderConsolidationLastDriverPickup.driverPickupDate, datetimeFormat).format(datetimeFormat)}`);
        return false;
      } else {
        return true;
      }
    } else {
      return true;
    }
  }

  isSchedule2ndSlot(order) {
    if (
      order.dropPlace.name === 'T21'
      && order.pickupPlace.type.name === 'airport'
      && moment.utc(order.dropDate, datetimeFormat) <= getTimeOnDay(this.date, scheduleTime2nd)
      && moment.utc(order.pickupDate, datetimeFormat) >= getTimeOnDay(this.date, scheduleTime3rd)
    ) {
      return true;
    }
  }

  isSchedule3rdSlot(order) {
    // if (order.dropPlace.type.name === 'airport') devLog(order, `${order.orderCode} SCHEDULE 3 ${order.dropPlace.type.name} ${order.pickupPlace.type.name} ${moment.utc(order.dropDate, datetimeFormat)} ${moment.utc(order.pickupDate, datetimeFormat)}`);
    if (
      order.dropPlace.type.name === 'airport'
      && order.pickupPlace.type.name === 'mall'
      && moment.utc(order.dropDate, datetimeFormat) <= getTimeOnDay(this.date, scheduleTime3rd)
      && moment.utc(order.pickupDate, datetimeFormat) >= getTimeOnDay(this.date, '15:45')
    ) {
      return true;
    }
  }

  isSchedule4thSlot(order) {
    if (
      order.dropPlace.name === 'T21'
      && order.pickupPlace.type.name === 'airport'
      && moment.utc(order.dropDate, datetimeFormat) <= getTimeOnDay(this.date, scheduleTime4th)
      && moment.utc(order.dropDate, datetimeFormat) > getTimeOnDay(this.date, scheduleTime2nd)
      && moment.utc(order.pickupDate, datetimeFormat) >= getTimeOnDay(this.date, scheduleTime4th)
    ) {
      return true;
    }
  }

  isSchedule5thSlot(order) {
    if (
      order.dropPlace.type.name === 'airport'
      && moment.utc(order.dropDate, datetimeFormat) <= getTimeOnDay(this.date, '17:30')
      && moment.utc(order.critical, datetimeFormat) >= getTimeOnDay(this.date, '17:30')
    ) {
      devLog(order, `isSchedule5thSlot ${moment.utc(order.dropDate, datetimeFormat)} ${moment.utc(order.critical, datetimeFormat)}`);
      return true;
    }
  }

  isOrdersGoToSchedule2nd(orders) {
    const lastDriverDrop = moment.utc(_.maxBy(orders, 'driverDropDate').driverDropDate, datetimeFormat);
    if (_.maxBy(orders, 'driverDropDate').pickupPlace.name !== 'T21') return false;
    if (lastDriverDrop <= getTimeOnDay(this.date, scheduleTime2nd)) return true;
  }

  isOrdersGoToSchedule4th(orders) {
    const lastDriverDrop = moment.utc(_.maxBy(orders, 'driverDropDate').driverDropDate, datetimeFormat);
    if (_.maxBy(orders, 'driverDropDate').pickupPlace.name !== 'T21') return false;
    if (lastDriverDrop < getTimeOnDay(this.date, scheduleTime2nd)) return false;
    if (lastDriverDrop <= getTimeOnDay(this.date, scheduleTime4th)) return true;
  }

  isMainCar1stSchedule(order) {
    if (this.plans.filter(o => o.mainCar).length < maxMainCar) { // maincar t21
      const orderForMainCar = this.orders.find(o => o.pickupPlace.name === 'T21' && moment.utc(o.pickupPlace, datetimeFormat) < getTimeOnDay(this.date, scheduleTime2nd));
      if (orderForMainCar && order.pickupPlace.name !== 'T21') return false;
    }
    return true;
  }

  isLastCar(order) {
    if (order.dropPlace.name === 'T21' && order.pickupPlace.type.name === 'airport' && order.dropDate > getTimeOnDay(this.date, scheduleTime4th)) {
      return true;
    }
  }

  isMainCar() { // เชคว่ากลุ่ม orders นี้ อยู่ใน schedule แรกไหม
    const lastOrder = _.maxBy(this.ordersDeliver, 'driverPickupDate');
    const lastPickup = moment.utc(lastOrder.driverPickupDate, datetimeFormat);
    const diffTime = getTimeOnDay(this.date, scheduleTime2nd).diff(lastPickup, 'minutes');
    const mainCar = this.plans.filter(plan => plan.mainCar).length;
    if (diffTime <= 180 && diffTime >= 0 && mainCar < maxMainCar && lastOrder.pickupPlace.name === 'T21') {
      console.log(color.blue_bt(`MAIN CAR ${mainCar + 1}`));
      // this.mainCar += 1;
      return true;
    }
  }

  isDriverPickupAtOneAirport(order) {
    if (this.ordersDeliver.find(o => order.dropPlace.type.name === 'airport' && o.dropPlace.type.name === 'airport' && o.dropPlace.name !== order.dropPlace.name)) {
      return false;
    }
    return true;
  }

  makeRoutePlan() {
    const routePickupPlace = _(this.ordersDeliver)
      .map(value => ({ driverPickupDate: moment.utc(value.driverPickupDate).format(datetimeFormat), loc: value.dropPlace.name }))
      .groupBy('driverPickupDate')
      .mapValues(value => value[0].loc)
      .value();
    const routeDropPlace = _(this.ordersDeliver)
      .map(value => ({ driverDropDate: moment.utc(value.driverDropDate).format(datetimeFormat), loc: value.pickupPlace.name }))
      .groupBy('driverDropDate')
      .mapValues(value => value[0].loc)
      .value();
    return _.assign(routePickupPlace, routeDropPlace);
  }

  // looking for the order fastes criticaltime in a day
  async findOrderFastestCritical() {
    this.orders = _.orderBy(this.orders, ['dropDate', 'critical']);
    this.orderFastCritical = this.orders.reduce((resultOrder, order) => {
      if (moment.utc(order.critical) > moment.utc(this.date).startOf('day')
      // && moment.utc(order.critical) < moment.utc(this.date).endOf('day')
      ) {
        if (_.isEmpty(resultOrder)) return order;
        if (order.critical < resultOrder.critical) return order;
        if (order.critical === resultOrder.critical) {
          if (order.dropDate < resultOrder.dropDate) {
            return order;
          }
        }
      }
      return resultOrder;
    }, {});

    if (this.plans.filter(plan => plan.mainCar).length < maxMainCar) {
      // console.log('this.plans.filter(plan => plan.mainCar).length ', this.plans.filter(plan => plan.mainCar).length);
      let orders1stSchedule = this.orders.filter(o => o.pickupPlace.name === 'T21' && moment.utc(o.dropDate, datetimeFormat) <= getTimeOnDay(this.date, '12:00'));
      orders1stSchedule = _.orderBy(orders1stSchedule, ['dropDate'], ['desc']);
      if (orders1stSchedule.length > 0) {
        // console.log('orders1stSchedule.length', orders1stSchedule.length);
        orders1stSchedule.forEach((order) => {
          if (order.pickupPlace.name === 'T21'
            // && order.pickupDate < this.orderFastCritical.pickupDate
            // && order.dropDate < this.orderFastCritical.dropDate
            && moment.utc(order.dropDate, datetimeFormat) <= getTimeOnDay(this.date, '12:00')
          ) {
            // console.log(`${order.orderCode} ${moment.utc(order.dropDate, datetimeFormat).format(datetimeFormat)}`);
            let handle = true;
            if (this.isSchedule3rdSlot(order)) handle = false;

            if (handle) this.orderFastCritical = order;
          }
        });
      }
    }
  }

  // order ที่คนขับต้องมารับกระเป๋าใบแรก
  async orderStartDriverPickup() {
    let timeOrderStart = moment.utc(this.orderFastCritical.dropDate).format(datetimeFormat);
    if (moment.utc(this.orderFastCritical.dropDate) < getTimeOnDay(this.date, '9:00')) {
      timeOrderStart = getTimeOnDay(this.date, '9:00').format(datetimeFormat);
    }
    this.orderFastCritical.driverPickupDate = timeOrderStart;
    if (this.isLastCar(this.orderFastCritical)) {
      this.orderFastCritical.driverPickupDate = getTimeOnDay(this.date, '19:00').format(datetimeFormat);
    }
    if (this.isSchedule2ndSlot(this.orderFastCritical)) {
      this.orderFastCritical.driverPickupDate = getTimeOnDay(this.date, scheduleTime2nd).format(datetimeFormat);
    }
    if (this.isSchedule3rdSlot(this.orderFastCritical)) {
      this.orderFastCritical.driverPickupDate = getTimeOnDay(this.date, scheduleTime3rd).format(datetimeFormat);
    }
    if (this.isSchedule4thSlot(this.orderFastCritical)) {
      this.orderFastCritical.driverPickupDate = getTimeOnDay(this.date, scheduleTime4th).format(datetimeFormat);
    }
    if (this.isSchedule5thSlot(this.orderFastCritical)) {
      this.orderFastCritical.driverPickupDate = getTimeOnDay(this.date, '17:30').format(datetimeFormat);
    }
    if (this.orderFastCritical.airbnb && this.orderFastCritical.airbnb === 'in') {
      this.orderFastCritical.driverPickupDate = moment.utc(this.orderFastCritical.critical).format(datetimeFormat);
    }
  }

  // หาระยะทางที่ใกล้ที่สุดที่ต้องไป จากจุดเริ่ม
  async ordersWithDurationFromOrigin(order) {
    const ordersWithDuration = await map(this.orders, async (o) => {
      const orderOrigin = order;
      const orderDestination = o;
      o.durationFromOrigin = await this.distanceTimeOriginToDestination(orderOrigin.dropPlace, orderDestination.dropPlace, orderOrigin.dropDate);
      return o;
    });
    return ordersWithDuration;
  }

  async distanceTimeOriginToDestination(originPlace, destinationPlace, originTime) {
    const origin = {
      lat: +_.get(originPlace, 'lat'),
      lng: +_.get(originPlace, 'lng'),
    };
    const destination = {
      lat: +_.get(destinationPlace, 'lat'),
      lng: +_.get(destinationPlace, 'lng'),
    };
    if (origin.lat === destination.lat && origin.lng === destination.lng) return 0;

    let distanceTime = 15; // default distanceTime
    let velocity = 23; // default
    if (originPlace.type.name === 'airport' || destinationPlace.type.name === 'airport') {
      const valocityLong = this.velocities.find(v => v.type === 'long');
      velocity = selectQuarter(originTime, valocityLong);
    } else {
      const valocityIntown = this.velocities.find(v => v.type === 'intown');
      velocity = selectQuarter(originTime, valocityIntown);
    }

    const km = calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
    distanceTime = Math.round(((km * 1.5) / velocity) * 60);
    // console.log(velocity, distanceTime, Math.round(km * 3));

    const distanceTrue = this.distances.find((d) => {
      if (d.origin.lat === origin.lat && d.origin.lng === origin.lng && d.destination.lat === destination.lat && d.destination.lng === destination.lng) {
        return true;
      }
      return false;
    });
    if (distanceTrue) {
      distanceTime = Math.round(((distanceTrue.distance / 1000) / velocity) * 60);
    } else {
      // console.log('distance not found', origin, destination);
      this.needDistance.push({ origin, destination });
      // distance.get({
      //   origin: `${origin.lat},${origin.lng}`,
      //   destination: `${destination.lat},${destination.lng}`,
      // }, async (err, data) => {
      //   if (data) {
      //     await Distances.create({
      //       origin,
      //       destination,
      //       distance: data.distanceValue,
      //     });
      //     distanceTime = await Math.round(((data.distanceValue / 1000) / velocity) * 60);
      //     await console.log('TRUE distanceTime', distanceTime);
      //     return distanceTime;
      //   }
      //   if (err) console.log(err.message);
      // });
    }

    // console.log(distanceTime, origin, destination);
    // console.log(`distanceTimeOriginToDestination ${originPlace.name} ${destinationPlace.name} ${distanceTime}`);
    distanceTime = numFloor5(distanceTime);
    return distanceTime;
  }

  // กำหนดเวลาการเดินทางที่คนขับต้องไปรับของ
  async orderWithDriverPickupDate(order) {
    // reset driver Pickup&Drop for new process
    // this.ordersDeliver = this.ordersDeliver.map((o) => {
    //   if (o.driverPickupDate) o.driverPickupDate = moment.utc(o.driverPickupDate, datetimeFormat);
    //   return o;
    // });
    order.driverPickupDate = undefined;
    order.driverDropDate = undefined;
    this.ordersDeliver = _.orderBy(this.ordersDeliver, ['driverPickupDate'], ['asc']);
    const orderOrigin = _.maxBy(this.ordersDeliver, 'driverPickupDate'); // ต้นทางที่ไปรับมาล่าสุด
    // const orderOrigin = _.last(this.ordersDeliver); // ต้นทางที่ไปรับมาล่าสุด
    const orderDestination = order; // ปลายทางที่กำลังจะรับของ
    const distanceTime = await this.distanceTimeOriginToDestination(orderOrigin.dropPlace, orderDestination.dropPlace, orderOrigin.driverPickupDate);
    let service = serviceTime;
    if (orderOrigin.dropPlace.locationID === orderDestination.dropPlace.locationID) service = 0;
    // กำหนดเวลาไปรับของขิ้นถัดไป
    // const orderLastDriverPickupDate = _.maxBy(ordersDeliver, 'driverPickupDate');
    let lastTime = orderOrigin.driverPickupDate;

    if (orderOrigin.dropDate > orderOrigin.driverPickupDate) {
      lastTime = orderOrigin.dropDate;
    }
    let driverPickupDate = moment.utc(lastTime, datetimeFormat)
      .add(service + distanceTime, 'minutes').format(datetimeFormat);

    // devLog(order, `111111 ${driverPickupDate} ${distanceTime}`);

    // devLog(order, `distanceTime111 ${distanceTime} ${orderOrigin.driverPickupDate} ~> ${driverPickupDate}`);
    // ถ้า order นี้ สามารถไปรับก่อน firstOrder ให้ไปรับมาก่อน
    // const orderFirstDriverPickup = findOrderFastDriverPickupDate(this.ordersDeliver);
    // if (customerBeforeFastDriverPickup(order, orderFirstDriverPickup)) {
    //   driverPickupDate = moment.utc(orderFirstDriverPickup.driverPickupDate, datetimeFormat)
    //     .add(-(service + distanceTime), 'minutes').format(datetimeFormat);
    // }
    // devLog(order, `distanceTime222 ${distanceTime} ${orderOrigin.driverPickupDate} ~> ${driverPickupDate}`);

    // ค้นหา orderDeliver ที่คนขับสามารถไปรับที่เดียวกัน ถ้ามีให้ไปรับของเวลาเดียวกัน
    const ordersSameDropLoc = this.ordersDeliver.filter(orderDeliver => order.dropPlace.locationID === orderDeliver.dropPlace.locationID);
    // devLog(order, `${this.ordersDeliver.map(o => `${o.orderCode} ${order.dropPlace.locationID} ${o.dropPlace.locationID}`)}`);
    if (ordersSameDropLoc.length > 0) {
      // await devLog(order, `ordersSameDropLoc ${ordersSameDropLoc[0].driverPickupDate}`);
      if (moment.utc(ordersSameDropLoc[0].driverPickupDate, datetimeFormat) >= moment.utc(order.dropDate, datetimeFormat)) {
        const orderLastPickup = _.last(this.ordersDeliver.filter(orderDeliver => order.dropPlace !== orderDeliver.dropPlace));
        let distanceTimeNext = 0;
        if (orderLastPickup) {
          distanceTimeNext = await this.distanceTimeOriginToDestination(orderLastPickup.dropPlace, order.dropPlace, orderLastPickup.driverPickupDate);
        }
        driverPickupDate = moment.utc(ordersSameDropLoc[0].driverPickupDate, datetimeFormat)
          .add(distanceTimeNext, 'minutes')
          .format(datetimeFormat);
      }
    }
    if (this.isLastCar(order)) {
      // driverPickupDate = moment.utc(this.orderFastCritical.critical, datetimeFormat).format(datetimeFormat);
      driverPickupDate = getTimeOnDay(this.date, '19:00').format(datetimeFormat);
    }
    if (this.isSchedule3rdSlot(order)) {
      driverPickupDate = getTimeOnDay(this.date, scheduleTime3rd).format(datetimeFormat);
    }
    if (this.isSchedule5thSlot(order)) {
      driverPickupDate = getTimeOnDay(this.date, '17:30').format(datetimeFormat);
    }
    order.driverPickupDate = driverPickupDate;
    if (orderOrigin.orderCode === 'LUG181123475' && orderDestination.orderCode === 'LUG18111051') console.log('XXXXXXXXXXX', orderOrigin.dropPlace.name, orderDestination.dropPlace.name, distanceTime, order.driverPickupDate);
    devLog(order, `Driver Drive TIME ${orderOrigin.dropPlace.name} ~> ${orderDestination.dropPlace.name} ${distanceTime} ${orderOrigin.driverPickupDate} ~> ${driverPickupDate}`);
    return order;
  }

  // กำหนดเวลาส่งของ
  async ordersWithDriverDropDate(index) {
    // this.ordersDeliver = _.sortBy(this.ordersDeliver, ['pickupType', 'critical'], 'desc');
    // await forEach(this.ordersDeliver, async (order) => {
    if (this.ordersDeliver.length === index) return false;
    let order = this.ordersDeliver[index];
    if (!_.maxBy(this.ordersDeliver, 'driverDropDate')) { // ยังไม่มีเวลาของที่ต้องไปส่งชิ้นแรก
      order = await this.driverDropFromLastPickupToFirstDrop(order);
    } else { // มีที่ต้องไปส่งแล้ว
      order = await this.driverDropFromLastDropToNextDrop(order);
    }
    order = await this.orderDriverDropAtSamePickupLoc(order);
    order = await driverDropAirbnb(order);
    // return order;
    await this.ordersWithDriverDropDate(index + 1);
    // });
    // this.ordersDeliver = await ordersDeliver;
  }

  // หาระยะทางจากที่ไปรับสุดท้าย ถึง order นี้
  async driverDropFromLastPickupToFirstDrop(order) {
    const orderOrigin = _.maxBy(this.ordersDeliver, 'driverPickupDate');
    const orderDestination = order;
    const distanceTime = await this.distanceTimeOriginToDestination(orderOrigin.dropPlace, orderDestination.pickupPlace, orderOrigin.driverPickupDate);
    devLog(order, `ERGEWGEWGEWRGEWGWERGERGERGWEGGWERG ${orderOrigin.dropPlace.name} ${orderOrigin.pickupPlace.name} ${distanceTime}`);
    order.driverDropDate = moment.utc(orderOrigin.driverPickupDate, datetimeFormat)
      .add(serviceTime + distanceTime, 'minutes').format(datetimeFormat);
    return order;
  }

  // หาระยะทางที่ต้องไปส่งอันถัดไป
  async driverDropFromLastDropToNextDrop(order) {
    const orderOrigin = _.maxBy(this.ordersDeliver, 'driverDropDate');
    const orderDestination = order;
    const distanceTime = await this.distanceTimeOriginToDestination(orderOrigin.pickupPlace, orderDestination.pickupPlace, orderOrigin.driverDropDate);

    const orderSamePickupLoc = _.minBy(this.ordersDeliver.filter(o => o.pickupPlace.locationID === order.pickupPlace.locationID), 'driverDropDate');
    if (orderSamePickupLoc) {
      order.driverDropDate = moment.utc(orderSamePickupLoc.driverDropDate, datetimeFormat)
        .add(serviceTimeSameLoc, 'minutes').format(datetimeFormat);
    } else {
      order.driverDropDate = moment.utc(orderOrigin.driverDropDate, datetimeFormat)
        .add(serviceTime + distanceTime, 'minutes').format(datetimeFormat);
    }
    return order;
  }

  // ไปส่งที่ๆกำลังรับของพอดี
  async orderDriverDropAtSamePickupLoc(order) {
    const orderDropLocSamePickupLoc = this.ordersDeliver.find(o => o.dropPlace.locationID === order.pickupPlace.locationID);
    if (orderDropLocSamePickupLoc) order.driverDropDate = orderDropLocSamePickupLoc.driverPickupDate;
    return order;
  }

  orderWithTrueLoc() { // map true data of consolidate orders
    this.orders.forEach((order) => {
      order.dropLoc = order.dropPlace.name;
      order.pickupLoc = order.pickupPlace.name;
      order.dropDateTrue = order.dropDate;
      order.pickupDateTrue = order.pickupDate;
      order.criticalTrue = order.critical;
      order.dropLocTrue = order.dropLoc;
      order.pickupLocTrue = order.pickupLoc;
      const orderDropConsolidate = this.allOrders.find(o => o.orderCode === order.orderCode && o.dropPlace.name !== order.dropPlace.name);
      if (orderDropConsolidate) {
        if (order.dropDate < orderDropConsolidate.dropDate) {
          order.dropLocTrue = order.dropPlace.name;
        } else if (order.dropDate > orderDropConsolidate.dropDate) {
          order.dropLocConsolidate = order.dropPlace.name;

          order.dropLocTrue = orderDropConsolidate.dropPlace.name;
          order.dropDateTrue = orderDropConsolidate.dropDate;
        }
      }
      const orderPickupConsolidate = this.allOrders.find(o => o.orderCode === order.orderCode && o.pickupPlace.name !== order.pickupPlace.name);
      if (orderPickupConsolidate) {
        if (order.pickupDate < orderPickupConsolidate.pickupDate) {
          order.pickupLocConsolidate = order.pickupPlace.name;

          order.pickupLocTrue = orderPickupConsolidate.pickupPlace.name;
          order.pickupDateTrue = orderPickupConsolidate.pickupDate;
          order.criticalTrue = orderPickupConsolidate.critical;
        } else if (order.pickupDate > orderPickupConsolidate.pickupDate) {
          order.pickupLocTrue = order.pickupPlace.name;
        }
      }
    });
  }
};
