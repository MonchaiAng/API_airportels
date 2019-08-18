const _ = require('lodash');
const xlsx = require('node-xlsx');
const fs = require('fs');
const moment = require('moment');
const path = require('path');

const { sqlDatetimeFormat, getJsDateFromExcel } = require('../lib');
const Order = require('../controllers/order');

const {
  Orders,
  OrderLuggages,
  EstimateTimes,
  Plans,
  PlanOrders,
} = require('../models');

// const urlGoogleMapAPI = 'https://maps.googleapis.com/maps/api';

const OrderStatus = require('../models/mongoDB/orderStatus');

const uploadroute = async (req, res, next) => {
  try {
    const obj = xlsx.parse(fs.readFileSync(path.join(__dirname, `../public/uploads/${req.file.filename}`)));
    const { data } = obj[0];

    for (let i = 0; i < data.length; i += 1) {
      const col = data[i];
      if (i > 0) {
        const orderCode = col[0];
        const dropType = col[1];
        let dropLoc = col[2]; // place id
        // const method = col[3];
        const pickupType = col[5];
        let pickupLoc = col[6];
        const dropDate = await moment.utc(getJsDateFromExcel(col[8])).add(-24, 'hours').format(sqlDatetimeFormat);
        const pickupDate = await moment.utc(getJsDateFromExcel(col[9])).add(-24, 'hours').format(sqlDatetimeFormat);
        const luggages = [
          {
            luggageID: 8,
            amount: col[11] || 1,
          },
        ];
        const airbnb = col[12] ? col[12] : '';

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
        if (`${dropType}_${col[2]}` === 'airport_1') dropLoc = suwannaphum;
        if (`${pickupType}_${col[6]}` === 'airport_1') pickupLoc = suwannaphum;
        if (`${dropType}_${col[2]}` === 'airport_2') dropLoc = donmuang;
        if (`${pickupType}_${col[6]}` === 'airport_2') pickupLoc = donmuang;
        if (`${dropType}_${col[2]}` === 'mall_1') dropLoc = mbk;
        if (`${pickupType}_${col[6]}` === 'mall_1') pickupLoc = mbk;
        if (`${dropType}_${col[2]}` === 'mall_2') dropLoc = terminal;
        if (`${pickupType}_${col[6]}` === 'mall_2') pickupLoc = terminal;
        if (`${dropType}_${col[2]}` === 'mall_3') dropLoc = centralworld;
        if (`${pickupType}_${col[6]}` === 'mall_3') pickupLoc = centralworld;

        if (dropType === 'hotelc') {
          dropLoc = {
            lat: col[2],
            lng: col[3],
          };
        }
        if (pickupType === 'hotelc') {
          pickupLoc = {
            lat: col[6],
            lng: col[7],
          };
        }
        await Orders.insert({
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
      }
    }

    return res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const ordermockup = async (req, res, next) => {
  try {
    let {
      customerID, dropLoc, dropDate, pickupLoc, pickupDate,
      luggages, orderType, status, dropLocType, pickupLocType,
    } = req.body;
    for (let i = 0; i < 10; i += 1) {
      const randomStart = _.random(8, 13);
      const randomMinute = _.random(10, 59);

      customerID = 1;
      dropLoc = _.random(1, 2);
      dropDate = `${moment().format('YYYY-MM-DD')} ${randomStart}:${randomMinute}:00`;
      pickupLoc = _.random(3, 5);
      pickupDate = `${moment().format('YYYY-MM-DD')} ${randomStart + _.random(3, 8)}:${randomMinute}:00`;

      luggages = _.range(_.random(1, 3)).map(() => ({
        luggageID: _.random(8, 10),
        amount: _.random(1, 3),
      }));
      orderType = 1;
      status = 1;

      dropLocType = 1;
      pickupLocType = 2;
      const templateID = +(`${dropLocType}${pickupLocType}`);

      const orderData = {
        customerID,
        dropLoc,
        dropDate,
        pickupLoc,
        pickupDate,
        luggages,
        orderType,
        status,
        templateID,
      };
      const order = await Order.insertOrder(orderData);
      res.io.emit('newOrder', order);
    }

    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
    });
  } catch (err) {
    next(err);
  }
};

const clearorders = async (req, res, next) => {
  try {
    // mysqlDB.query('TRUNCATE TABLE orders');
    Orders.destroy({ truncate: true });
    OrderLuggages.destroy({ truncate: true });
    Plans.destroy({ truncate: true });
    EstimateTimes.destroy({ truncate: true });
    PlanOrders.destroy({ truncate: true });
    // Locations.destroy({ truncate: true });
    OrderStatus.remove({});

    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadroute,
  ordermockup,
  clearorders,
};
