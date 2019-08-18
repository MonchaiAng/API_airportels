
const moment = require('moment');
const _ = require('lodash');
const Sequelize = require('sequelize');
const sequelize = require('./connect');

const Templates = require('./templates');
const OrderDrivers = require('./orderDrivers');
const OrderLuggages = require('./orderLuggages');
const Locations = require('./locations');
const EstimateTimes = require('./estimateTimes');
const Types = require('./types');
const Consolidations = require('./consolidations');

const OrderStatus = require('./mongoDB/orderStatus');

const {
  dateFormat,
  datetimeFormat,
  toBoolean,
  sqlDatetimeFormat,
  nearestMinutes,
  getTimeOnDay,
} = require('../lib');
const { scheduleTime2nd, scheduleTime4th } = require('../MRPConfig');

const Orders = sequelize.define('orders', {
  orderID: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderCode: Sequelize.STRING,
  customerID: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
  },
  dropLocation: Sequelize.STRING,
  pickupLocation: Sequelize.STRING,
  dropTime: Sequelize.DATE,
  pickupTime: Sequelize.DATE,

  dropType: Sequelize.STRING,
  dropLoc: Sequelize.STRING,
  dropDate: Sequelize.DATE,
  pickupType: Sequelize.STRING,
  pickupLoc: Sequelize.STRING,
  pickupDate: Sequelize.DATE,
  orderType: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
  },
  airbnb: Sequelize.STRING,
  status: Sequelize.INTEGER,
  templateID: Sequelize.INTEGER,
});
Orders.belongsTo(Templates, { foreignKey: 'templateID' });
Orders.belongsTo(EstimateTimes, { foreignKey: 'orderID' });
Orders.belongsTo(Locations, { foreignKey: 'dropLoc', as: 'dropPlace' });
Orders.belongsTo(Locations, { foreignKey: 'pickupLoc', as: 'pickupPlace' });

Orders.belongsTo(Locations, { foreignKey: 'dropLocation', as: 'dropLocationData' });
Orders.belongsTo(Locations, { foreignKey: 'pickupLocation', as: 'pickupLocationData' });

Orders.hasMany(OrderDrivers, { foreignKey: 'orderID', as: 'drivers' });
Orders.hasMany(OrderLuggages, { foreignKey: 'orderID', as: 'luggages' });

Orders.attributes = [
  'orderID',
  'orderCode',
  'customerID',

  // 'dropLocation',
  // 'pickupLocation',
  'dropTime',
  'pickupTime',

  'dropType',
  'pickupType',
  // [sequelize.col('dropLoc'), 'dropPlaceID'],
  // [sequelize.col('pickupLoc'), 'pickupPlaceID'],
  // [sequelize.fn('CONCAT', sequelize.col('dropType'), '_', sequelize.col('dropLoc')), 'dropLoc'],
  // [sequelize.fn('CONCAT', sequelize.col('pickupType'), '_', sequelize.col('pickupLoc')), 'pickupLoc'],
  'dropLoc',
  'pickupLoc',
  'dropDate',
  'pickupDate',
  [sequelize.literal('SUBTIME(pickupDate, traveling)'), 'critical'],
  [sequelize.literal('SUBTIME(pickupTime, traveling)'), 'criticalTime'],
  'orderType',
  'airbnb',
  'status',
  // [sequelize.literal('SELECT SUM(orderluggages.amount) as total FROM orderluggages WHERE orderluggages.orderID = orders.orderID'), 'luggage'],
];

Orders.include = [
  { model: Templates },
  { model: OrderDrivers, as: 'drivers' },
  {
    model: OrderLuggages,
    as: 'luggages',
  },
  {
    model: Locations,
    as: 'dropLocationData',
    include: [{ model: Types }],
  },
  {
    model: Locations,
    as: 'pickupLocationData',
    include: [{ model: Types }],
  },
  {
    model: Locations,
    as: 'dropPlace',
    include: [{ model: Types }],
  },
  {
    model: Locations,
    as: 'pickupPlace',
    include: [{ model: Types }],
  },
  {
    model: EstimateTimes,
  },
];

Orders.getOrders = async (query = {}) => {
  const where = {};
  if (query.orderID) where.orderID = query.orderID;
  if (query.orderCode) where.orderCode = query.orderCode;
  if (query.date) { // เลือกเฉพาะ order ที่ต้องส่งในวันที่เลือก
    where.dropDate = {
      // $gte: moment.utc(query.date, dateFormat).startOf('day'),
      $lte: moment.utc(query.date, dateFormat).endOf('day'),
    }; // customer มารับของตั้งแต่วันนี้ขึ้นไป
    where.pickupDate = {
      $gte: moment.utc(query.date, dateFormat).startOf('day'),
      // $lte: moment.utc(query.date, dateFormat).endOf('day').add(3, 'hours'),
    };
  }
  if (query.fullPlace) {
    if (toBoolean(query.fullPlace)) {
      where.$and = [
        {
          '$dropPlace.locationID$': { $ne: null },
        }, {
          '$pickupPlace.locationID$': { $ne: null },
        },
      ];
    } else {
      where.$or = [
        {
          '$dropPlace.locationID$': null,
        }, {
          '$pickupPlace.locationID$': null,
        },
      ];
    }
  }
  const orders = Orders.findAll({
    attributes: Orders.attributes,
    include: Orders.include,
    where,
  }).map((order) => {
    order = order.dataValues;
    order.luggage = _.sumBy(order.luggages, 'amount');
    return order;
  }).filter((order) => {
    if (query.date && order.airbnb) {
      if (moment.utc(order.pickupDate).format(dateFormat) !== moment.utc(query.date, dateFormat).format(dateFormat)) {
        return false;
      }
    }
    return true;
  });
  return orders;
};

Orders.getOrdersForPlan = async (where) => {
  where.$and = [
    {
      '$dropPlace.locationID$': { $ne: null },
    }, {
      '$pickupPlace.locationID$': { $ne: null },
    },
  ];
  return Orders.findAll({
    attributes: Orders.attributes,
    include: Orders.include,
    where,
  }).map((order) => {
    order = order.dataValues;
    order.luggage = _.sumBy(order.luggages, 'amount');
    return order;
  });
};

const insertOrderStatus = async (status, pickupDate, orderID) => {
  const orderStatus = await OrderStatus.findOne({ orderID });
  await orderStatus.update({
    status,
    pickupDate: await moment.utc(pickupDate).format(datetimeFormat),
  });
  return orderStatus;
};

const insertOrdersConsolidate = async (order) => {
  const {
    orderCode,
    dropType,
    dropLoc,
    dropDate,
    pickupType,
    pickupLoc,
    pickupDate,
    airbnb,
    status,
    dropTypeID,
    pickupTypeID,
    luggages,
  } = order;

  const resultsStatus = await Types.findAll({
    where: {
      categoryID: 4,
    },
  });
  const templateID = `${dropTypeID}${pickupTypeID}`;

  const consolidations = await Consolidations.findAll({
    include: [
      {
        model: Locations,
        include: Types,
      },
    ],
  });
  const consolidatePlaceID = consolidations[0].locationID;
  const consolidateType = consolidations[0].location.type.name;
  const consolidateTypeID = consolidations[0].location.type.typeID;

  // const consolidatePlaceID = 'ChIJaWxpoOOe4jAR-FQulIK4zHA';
  // const consolidateType = 'mall';
  // const consolidateTypeID = '2';

  const date = moment.utc(order.dropDate, sqlDatetimeFormat).format(dateFormat);
  const newOrders = [];
  if (order.dropType === 'airport' && order.pickupType === 'airport') {
    if (moment.utc(order.dropDate, sqlDatetimeFormat) <= getTimeOnDay(date, '15:00') && moment.utc(order.pickupDate, sqlDatetimeFormat) >= getTimeOnDay(date, '18:00')) {
      const newOrderBefore = await Orders.create({
        orderCode: `${orderCode}`,

        dropType,
        dropLoc,
        dropDate,
        pickupType: consolidateType,
        pickupLoc: consolidatePlaceID,
        pickupDate: getTimeOnDay(date, scheduleTime4th).format(sqlDatetimeFormat),

        airbnb: airbnb === 'out' ? airbnb : '',
        status,
        templateID: `${dropTypeID}${consolidateTypeID}`,

        dropLocation: dropLoc,
        pickupLocation: pickupLoc,
        dropTime: dropDate,
        pickupTime: pickupDate,
      });
      await OrderLuggages.insert(luggages, newOrderBefore.orderID);
      await insertOrderStatus(resultsStatus[0].display, getTimeOnDay(date, scheduleTime4th).format(sqlDatetimeFormat), newOrderBefore.orderID);
      newOrders.push(newOrderBefore);
      const newOrderAfter = await Orders.create({
        orderCode: `${orderCode}`,

        dropType: consolidateType,
        dropLoc: consolidatePlaceID,
        dropDate: getTimeOnDay(date, scheduleTime4th).format(sqlDatetimeFormat),
        pickupType,
        pickupLoc,
        pickupDate,

        airbnb: airbnb === 'in' ? airbnb : '',
        status,
        templateID,

        dropLocation: dropLoc,
        pickupLocation: pickupLoc,
        dropTime: dropDate,
        pickupTime: pickupDate,
      });
      await OrderLuggages.insert(luggages, newOrderAfter.orderID);
      await insertOrderStatus(resultsStatus[0].display, pickupDate, newOrderAfter.orderID);
      newOrders.push(newOrderAfter);
    } else {
      const newOrder = await Orders.create({
        orderCode,

        dropType,
        dropLoc,
        dropDate,
        pickupType,
        pickupLoc,
        pickupDate,

        airbnb,
        status,
        templateID,

        dropLocation: dropLoc,
        pickupLocation: pickupLoc,
        dropTime: dropDate,
        pickupTime: pickupDate,
      });
      const { orderID } = newOrder;
      await OrderLuggages.insert(luggages, orderID);
      await insertOrderStatus(resultsStatus[0].display, pickupDate, orderID);
      newOrders.push(newOrder);
    }
  } else if (order.dropLoc !== consolidatePlaceID && order.pickupType === 'airport') {
    if (moment.utc(order.dropDate, sqlDatetimeFormat) <= getTimeOnDay(date, scheduleTime2nd) && moment.utc(order.pickupDate, sqlDatetimeFormat) < getTimeOnDay(date, '18:00')) {
      const newOrderBefore = await Orders.create({
        orderCode: `${orderCode}`,

        dropType,
        dropLoc,
        dropDate,
        pickupType: consolidateType,
        pickupLoc: consolidatePlaceID,
        pickupDate: getTimeOnDay(date, scheduleTime2nd).format(sqlDatetimeFormat),

        airbnb: airbnb === 'out' ? airbnb : '',
        status,
        templateID: `${dropTypeID}${consolidateTypeID}`,

        dropLocation: dropLoc,
        pickupLocation: pickupLoc,
        dropTime: dropDate,
        pickupTime: pickupDate,
      });
      await OrderLuggages.insert(luggages, newOrderBefore.orderID);
      await insertOrderStatus(resultsStatus[0].display, getTimeOnDay(date, scheduleTime2nd).format(sqlDatetimeFormat), newOrderBefore.orderID);
      newOrders.push(newOrderBefore);
      const newOrderAfter = await Orders.create({
        orderCode: `${orderCode}`,

        dropType: consolidateType,
        dropLoc: consolidatePlaceID,
        dropDate: getTimeOnDay(date, scheduleTime2nd).format(sqlDatetimeFormat),
        pickupType,
        pickupLoc,
        pickupDate,

        airbnb: airbnb === 'in' ? airbnb : '',
        status,
        templateID,

        dropLocation: dropLoc,
        pickupLocation: pickupLoc,
        dropTime: dropDate,
        pickupTime: pickupDate,
      });
      await OrderLuggages.insert(luggages, newOrderAfter.orderID);
      await insertOrderStatus(resultsStatus[0].display, pickupDate, newOrderAfter.orderID);
      newOrders.push(newOrderAfter);
    } else if (moment.utc(order.dropDate, sqlDatetimeFormat) <= getTimeOnDay(date, scheduleTime4th) && moment.utc(order.pickupDate, sqlDatetimeFormat) >= getTimeOnDay(date, '18:00')) {
      const newOrderBefore = await Orders.create({
        orderCode: `${orderCode}`,

        dropType,
        dropLoc,
        dropDate,
        pickupType: consolidateType,
        pickupLoc: consolidatePlaceID,
        pickupDate: getTimeOnDay(date, scheduleTime4th).format(sqlDatetimeFormat),

        airbnb: airbnb === 'out' ? airbnb : '',
        status,
        templateID: `${dropTypeID}${consolidateTypeID}`,

        dropLocation: dropLoc,
        pickupLocation: pickupLoc,
        dropTime: dropDate,
        pickupTime: pickupDate,
      });
      await OrderLuggages.insert(luggages, newOrderBefore.orderID);
      await insertOrderStatus(resultsStatus[0].display, getTimeOnDay(date, scheduleTime4th).format(sqlDatetimeFormat), newOrderBefore.orderID);
      newOrders.push(newOrderBefore);
      const newOrderAfter = await Orders.create({
        orderCode: `${orderCode}`,

        dropType: consolidateType,
        dropLoc: consolidatePlaceID,
        dropDate: getTimeOnDay(date, scheduleTime4th).format(sqlDatetimeFormat),
        pickupType,
        pickupLoc,
        pickupDate,

        airbnb: airbnb === 'in' ? airbnb : '',
        status,
        templateID,

        dropLocation: dropLoc,
        pickupLocation: pickupLoc,
        dropTime: dropDate,
        pickupTime: pickupDate,
      });
      await OrderLuggages.insert(luggages, newOrderAfter.orderID);
      await insertOrderStatus(resultsStatus[0].display, pickupDate, newOrderAfter.orderID);
      newOrders.push(newOrderAfter);
    } else {
      const newOrder = await Orders.create({
        orderCode,

        dropType,
        dropLoc,
        dropDate,
        pickupType,
        pickupLoc,
        pickupDate,

        airbnb,
        status,
        templateID,

        dropLocation: dropLoc,
        pickupLocation: pickupLoc,
        dropTime: dropDate,
        pickupTime: pickupDate,
      });
      const { orderID } = newOrder;
      await OrderLuggages.insert(luggages, orderID);
      await insertOrderStatus(resultsStatus[0].display, pickupDate, orderID);
      newOrders.push(newOrder);
    }
  } else if (order.dropType === 'airport' && order.pickupLoc !== consolidatePlaceID) {
    if (moment.utc(order.dropDate, sqlDatetimeFormat) <= getTimeOnDay(date, '15:00') && moment.utc(order.pickupDate, sqlDatetimeFormat) >= getTimeOnDay(date, '18:00')) {
      const newOrderBefore = await Orders.create({
        orderCode: `${orderCode}`,

        dropType,
        dropLoc,
        dropDate,
        pickupType: consolidateType,
        pickupLoc: consolidatePlaceID,
        pickupDate: getTimeOnDay(date, scheduleTime4th).format(sqlDatetimeFormat),

        airbnb: airbnb === 'out' ? airbnb : '',
        status,
        templateID: `${dropTypeID}${consolidateTypeID}`,

        dropLocation: dropLoc,
        pickupLocation: pickupLoc,
        dropTime: dropDate,
        pickupTime: pickupDate,
      });
      await OrderLuggages.insert(luggages, newOrderBefore.orderID);
      await insertOrderStatus(resultsStatus[0].display, getTimeOnDay(date, scheduleTime4th).format(sqlDatetimeFormat), newOrderBefore.orderID);
      newOrders.push(newOrderBefore);
      const newOrderAfter = await Orders.create({
        orderCode: `${orderCode}`,

        dropType: consolidateType,
        dropLoc: consolidatePlaceID,
        dropDate: getTimeOnDay(date, scheduleTime4th).format(sqlDatetimeFormat),
        pickupType,
        pickupLoc,
        pickupDate,

        airbnb: airbnb === 'in' ? airbnb : '',
        status,
        templateID,

        dropLocation: dropLoc,
        pickupLocation: pickupLoc,
        dropTime: dropDate,
        pickupTime: pickupDate,
      });
      await OrderLuggages.insert(luggages, newOrderAfter.orderID);
      await insertOrderStatus(resultsStatus[0].display, pickupDate, newOrderAfter.orderID);
      newOrders.push(newOrderAfter);
    } else {
      const newOrder = await Orders.create({
        orderCode,

        dropType,
        dropLoc,
        dropDate,
        pickupType,
        pickupLoc,
        pickupDate,

        airbnb,
        status,
        templateID,

        dropLocation: dropLoc,
        pickupLocation: pickupLoc,
        dropTime: dropDate,
        pickupTime: pickupDate,
      });
      const { orderID } = newOrder;
      await OrderLuggages.insert(luggages, orderID);
      await insertOrderStatus(resultsStatus[0].display, pickupDate, orderID);
      newOrders.push(newOrder);
    }
  } else {
    const newOrder = await Orders.create({
      orderCode,
      dropType,
      dropLoc,
      dropDate,
      pickupType,
      pickupLoc,
      pickupDate,
      airbnb,
      status,
      templateID,

      dropLocation: dropLoc,
      pickupLocation: pickupLoc,
      dropTime: dropDate,
      pickupTime: pickupDate,
    });
    const { orderID } = newOrder;
    await OrderLuggages.insert(luggages, orderID);
    await insertOrderStatus(resultsStatus[0].display, pickupDate, orderID);
    newOrders.push(newOrder);
  }
  return newOrders;
};

Orders.insert = async ({
  orderCode,
  dropType,
  dropDate,
  dropLoc,
  dropTypeID,
  pickupType,
  pickupDate,
  pickupLoc,
  pickupTypeID,
  luggages,
  airbnb,
  status,
}) => {
  if (dropType === 'hotelc' || dropType === 'home') {
    dropLoc = await Locations.fetchAndInsertPlaceDataFromLatLng(dropLoc.lat, dropLoc.lng);
  } else {
    await Locations.fetchAndInsertPlaceData(dropType, dropLoc);
  }
  if (pickupType === 'hotelc' || pickupType === 'home') {
    pickupLoc = await Locations.fetchAndInsertPlaceDataFromLatLng(pickupLoc.lat, pickupLoc.lng);
  } else {
    await Locations.fetchAndInsertPlaceData(pickupType, pickupLoc);
  }
  dropDate = nearestMinutes(5, moment(dropDate, sqlDatetimeFormat));
  pickupDate = nearestMinutes(5, moment(pickupDate, sqlDatetimeFormat));
  airbnb = _.lowerCase(airbnb);
  if (dropType === 'home') {
    airbnb = 'out';
  } else if (pickupType === 'home') {
    airbnb = 'in';
  }

  const orders = await Orders.findAll({
    where: {
      orderCode,
    },
  });
  if (orders.length === 0) {
    // const resultsStatus = await Types.findAll({
    //   where: {
    //     categoryID: 4,
    //   },
    // });
    // const templateID = `${dropTypeID}${pickupTypeID}`;
    // const newOrder = await Orders.create({
    //   orderCode,

    //   dropLocation: dropLoc,
    //   pickupLocation: pickupLoc,
    //   dropTime: dropDate,
    //   pickupTime: pickupDate,

    //   dropType,
    //   dropLoc,
    //   dropDate,
    //   pickupLoc,
    //   pickupDate,
    //   airbnb, // ***
    //   status,
    //   templateID,
    // });
    // const { orderID } = newOrder;
    // await OrderLuggages.insert(luggages, orderID);
    // await insertOrderStatus(resultsStatus[0].display, pickupDate, orderID);
    const newOrder = await insertOrdersConsolidate({
      orderCode,
      dropType,
      dropLoc,
      dropDate,
      pickupType,
      pickupLoc,
      pickupDate,
      airbnb,
      status,
      dropTypeID,
      pickupTypeID,
      luggages,
    });
    return newOrder;
  }
};


module.exports = Orders;
