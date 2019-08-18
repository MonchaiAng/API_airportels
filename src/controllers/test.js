const _ = require('lodash');
const xlsx = require('node-xlsx');
const fs = require('fs');
const moment = require('moment');
const path = require('path');

const { location } = require('../mockupData/places');
const { Orders } = require('../models');
const { timeZoneDiff } = require('../config');

Number.prototype.display_hours_minutes = function () {
  let date = new Date(this * 3600 /* sec per hr */ * 1000 /* msec per sec */);
  return `${('0' + date.getUTCHours()).slice(-2)  }:${  ('0' + date.getUTCMinutes()).slice(-2)}`;
};

module.exports = {
  importOrders: async (req, res, next) => {
    try {
      const sheet = xlsx.parse(
        fs.readFileSync(
          path.join(__dirname, `../../public/document/document/${req.file.filename}`),
        ),
      );
      const { data } = sheet[0];

      for (let i = 1; i <= data.length; i += 1) {
        const col = data[i];
        if (!col) continue;
        if (col.length === 0) continue;
        const orderCode = col[0];
        const originName = col[1];
        const destinationName = col[2];
        const numberOfLuggage = col[3];
        let dropTime = col[5];
        let pickupTime = col[6];
        dropTime = (dropTime * 24).display_hours_minutes();
        pickupTime = (pickupTime * 24).display_hours_minutes();

        dropTime = moment(dropTime, 'HH:mm:ss')
          .add(timeZoneDiff, 'hours')
          .format('HH:mm:ss');
        pickupTime = moment(pickupTime, 'HH:mm:ss')
          .add(timeZoneDiff, 'hours')
          .format('HH:mm:ss');

        // const originPlace = await getPlaceData({ name: originName });
        // const destinationPlace = await getPlaceData({ name: destinationName });
        // console.log('originPlace', originPlace);
        // console.log('destinationPlace', destinationPlace);
        // const originPlaceId = originPlace ? originPlace.placeid : null;
        // const destinationPlaceId = destinationPlace ? destinationPlace.placeid : null;
        const originPlaceId = location[originName] ? location[originName].placeId : null;
        const destinationPlaceId = location[destinationName] ? location[destinationName].placeId : null;

        const hasOrder = await Orders.findOne({
          where: { code: orderCode },
        });
        if (hasOrder) continue;

        const order = await Orders.create({
          code: orderCode,
          customerId: `CustomerTest${i}`,
          customerFullname: `CustomerTest${i}`,
          customerPhone: '08xxxxxxxx',
          customerEmail: `CustomerTest${i}@buzzfreeze.com`,
          dropTime: `${moment()
            .add(timeZoneDiff, 'hours')
            .format('YYYY-MM-DD')} ${dropTime}`,
          pickupTime: `${moment()
            .add(timeZoneDiff, 'hours')
            .format('YYYY-MM-DD')} ${pickupTime}`,
          arrivingTime: `${moment()
            .add(timeZoneDiff, 'hours')
            .format('YYYY-MM-DD')} ${moment(pickupTime, 'HH:mm')
            .add(-30, 'minutes')
            .format('HH:mm:ss')}`,
          originPlaceId,
          destinationPlaceId,
          numberOfLuggage,
          createdBy: 1,
          updatedBy: 1,
          status: 1,
        });
      }

      res.status(200).json({
        message: 'Import Orders',
      });
    } catch (err) {
      next(err);
    }
  },
  resetOrdersStatus: async (req, res, next) => {
    try {
      Orders.update({
        status: 1,
      });
      res.status(200).json({
        message: 'reseted',
      });
    } catch (err) {
      next(err);
    }
  },
};
