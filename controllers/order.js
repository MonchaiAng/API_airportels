// const mongoose = require('mongoose')
const _ = require('lodash');
const sequelize = require('sequelize');
const moment = require('moment');

// const { googleAPI } = require('../config');
const {
  datetimeFormat,
  dateFormat,
  sqlDatetimeFormat,
  getJsDateFromExcel,
} = require('../lib');

const {
  Orders,
  Types,
  OrderDrivers,
  EstimateTimes,
  PlanOrders,
} = require('../models');
const OrderStatus = require('../models/mongoDB/orderStatus');

const mongoDB = require('../lib/mongoDB');

// ไม่ขนส่งกระเป๋าที่ต้องไปส่งที่ airport แต่ยังไม่ถึงเวลารับกระเป๋า
// เพราะฝากกระเป๋าที่ airport ไม่ได้
// แต่ยกเว้นถ้าเกินวันนั้นไป 3 ชั่วโมง
const ordersNoDepositAtAirport = (orders, date) => {
  return orders.filter((order) => {
    if (order.pickupType === 'airport') {
      if (moment.utc(order.pickupDate, datetimeFormat).isAfter(moment.utc(date, dateFormat).endOf('day').add(3, 'hours'))) {
        return false;
      } else {
        return true;
      }
    } else {
      return true;
    }
  });
};

// API API API API API API API API API API API API API API API API API API API //
// API API API API API API API API API API API API API API API API API API API //
// API API API API API API API API API API API API API API API API API API API //

const get = async (req, res, next) => {
  try {
    const { query } = req;
    if (req.params.orderID) query.orderID = req.params.orderID;
    const orders = await Orders.getOrders(query);
    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        total: orders && orders.length,
        orders,
      },
    });
  } catch (err) {
    next(err);
  }
};

const post = async (req, res, next) => {
  try {
    const {
      orderCode,
      dropType, // name
      pickupType, // name
      luggage,
    } = req.body;
    let {
      dropLoc, // placeId
      pickupLoc, // placeId
      dropDate,
      pickupDate,

      airbnb, // ?????
    } = req.body;
    // dropDate = await moment.utc(getJsDateFromExcel(dropDate)).add(-24, 'hours').format(sqlDatetimeFormat);
    // pickupDate = await moment.utc(getJsDateFromExcel(pickupDate)).add(-24, 'hours').format(sqlDatetimeFormat);
    dropDate = await moment.utc(dropDate, datetimeFormat).add(-24, 'hours').format(sqlDatetimeFormat);
    pickupDate = await moment.utc(pickupDate, datetimeFormat).add(-24, 'hours').format(sqlDatetimeFormat);
    const luggages = [
      {
        luggageID: 8,
        amount: luggage || 1,
      },
    ];
    airbnb = airbnb || '';
    // const airbnb = '';
    if (dropLoc === 'home') airbnb = 'out';
    if (pickupLoc === 'home') airbnb = 'in';

    let dropTypeID = '3';
    let pickupTypeID = '3';

    if (dropType === 'airport') dropTypeID = '1';
    if (pickupType === 'airport') pickupTypeID = '1';
    if (dropType === 'mall') dropTypeID = '2';
    if (pickupType === 'mall') pickupTypeID = '2';
    if (dropType === 'hotel' || dropType === 'hotelc') dropTypeID = '3';
    if (pickupType === 'hotel' || pickupType === 'hotelc') pickupTypeID = '3';

    const suwannaphum = 'ChIJTydCFXdnHTERB3oVT1UZDRI';
    const donmuang = 'ChIJA8tiM2GC4jAR11SlhoI5uxg';
    const centralworld = 'ChIJ4VX0ws-e4jARBGaQ2IACrcQ';
    const mbk = 'ChIJT-EGk9-e4jAReCrRIVpZgN0';
    const terminal = 'ChIJaWxpoOOe4jAR-FQulIK4zHA';
    const hotelcTheLine = 'ChIJj40mBrae4jARIDGc2_EcORY';
    const hotelc2 = 'ChIJI4ffGo-Y4jARFo-OT7ccz24';

    if (dropLoc.length < 20) dropLoc = hotelcTheLine;
    if (pickupLoc.length < 20) pickupLoc = hotelc2;
    if (`${dropType}_${dropLoc}` === 'airport_1') dropLoc = suwannaphum;
    if (`${pickupType}_${pickupLoc}` === 'airport_1') pickupLoc = suwannaphum;
    if (`${dropType}_${dropLoc}` === 'airport_2') dropLoc = donmuang;
    if (`${pickupType}_${pickupLoc}` === 'airport_2') pickupLoc = donmuang;
    if (`${dropType}_${dropLoc}` === 'mall_1') dropLoc = mbk;
    if (`${pickupType}_${pickupLoc}` === 'mall_1') pickupLoc = mbk;
    if (`${dropType}_${dropLoc}` === 'mall_2') dropLoc = terminal;
    if (`${pickupType}_${pickupLoc}` === 'mall_2') pickupLoc = terminal;
    if (`${dropType}_${dropLoc}` === 'mall_3') dropLoc = centralworld;
    if (`${pickupType}_${pickupLoc}` === 'mall_3') pickupLoc = centralworld;

    const order = await Orders.insert({
      orderCode,
      customerID: 1,
      dropType,
      dropLoc,

      dropDate,
      pickupType,
      pickupLoc,

      pickupDate,
      orderType: 1,
      airbnb,
      status: 1,
      dropTypeID,
      pickupTypeID,
      luggages,
    });
    res.io.emit('newOrder', order);

    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
    });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const order = await Orders.findById(id);
    if (_.isEmpty(order)) throw new Error(`Don't have orderID : ${id}`);
    await order.update(data);
    res.io.emit('newOrder', order);

    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
    });
  } catch (err) {
    next(err);
  }
};

const getStatus = async (req, res, next) => {
  try {
    const { orderID } = req.params;
    if (_.isEmpty(orderID)) throw new Error('Please Request ID');
    const order = await OrderStatus.findOne({ orderID });
    if (order) {
      res.json({
        ok: true,
        message: `${req.method} ${req.path} SUCCESS`,
        data: {
          order: order.toObject(),
        },
      });
    } else {
      throw new Error('is empthy order id');
    }
  } catch (err) {
    next(err);
  }
};

const getAllStatus = async (req, res, next) => {
  try {
    const { date } = req.query;
    let query = {};
    if (date) query = { pickupDate: new RegExp(moment(date, dateFormat).format(dateFormat), 'i') };
    const ordersStatus = await OrderStatus.find(query);
    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        ordersStatus,
        total: ordersStatus.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

const addOrderDriver = async (req, res, next) => {
  try {
    const { driverID, orderID } = req.body;
    if (!driverID) throw new Error('Please Request driverID');
    else if (_.isEmpty(orderID)) throw new Error('Please Request orders');
    else if (Array.isArray(orderID)) throw new Error('orders is not array');

    const orderDrivers = await OrderDrivers.create({ orderID, driverID, status: 1 });
    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        orderDrivers,
      },
    });
  } catch (err) {
    next(err);
  }
};

const escalateOrderStatus = async (req, res, next) => {
  try {
    const { orderID } = req.params;
    const orderStatus = await OrderStatus.findOne({ orderID });
    let { status } = orderStatus;
    const resultsStatus = await Types.findAll({
      where: {
        categoryID: 4,
      },
      order: sequelize.col('value'),
    });
    const statusNames = resultsStatus.map(value => value.dataValues.display);
    let statusIndex = _.indexOf(statusNames, status);
    if (statusIndex < statusNames.length - 1) {
      statusIndex += 1;
    } else {
      statusIndex = 0;
    }
    status = statusNames[statusIndex];
    const order = await mongoDB.update('orderStatus', { status }, { orderID });
    res.io.emit('orderStatus', order);
    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        order,
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateEstimate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estimate, timeleft } = req.body;
    const order = await Orders.findById(id);
    EstimateTimes.updateOrderEstimate(order, estimate, timeleft);
    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
    });
  } catch (err) {
    next(err);
  }
};

const changePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { planID } = req.body;
    const planorder = await PlanOrders.find({
      where: {
        orderID: id,
      },
      include: {
        model: Orders,
      },
    });
    if (!planorder) throw new Error(`Not have order ${id}`);
    if (planorder) {
      await planorder.update({
        planID,
      });
    }
    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  // /// API /////
  get,
  post,
  update,

  getStatus,
  getAllStatus,
  addOrderDriver,
  escalateOrderStatus,
  updateEstimate,
  changePlan,

  // /// FUNCTION //////
  ordersNoDepositAtAirport,
};
