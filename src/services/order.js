const moment = require('moment');
const _ = require('lodash');
const request = require('request-promise');

const { Orders, Places } = require('../models');
const { insertPlace } = require('./place');
const { getLocationData } = require('../helpers/googleMap');
const { timeZoneDiff } = require('../config');

const getOrdersFromAirportels = async (date) => {
  date = moment(date).format('YYYY-MM-DD');
  const res = await request.get(
    `https://postels.airportels.asia/umd/tempPull/${date}`,
  );
  return JSON.parse(res);
};

const insertOrdersFromAirportels = async (date, user) => {
  const { order } = await getOrdersFromAirportels(date);
  const newOrders = await Promise.all(
    order.map(async (order) => {
      await insertPlace(order.origin.place_id, order.origin.type);
      await insertPlace(order.destination.place_id, order.destination.type);
      if (order.origin.type === 'mall') {
        if (moment(order.origin.datetime) <= moment(order.origin.datetime).startOf('day').add(12, 'hours')) {
          order.origin.datetime = moment(order.origin.datetime).startOf('day').add(12, 'hours');
        } else if (moment(order.origin.datetime) > moment(order.origin.datetime).startOf('day').add(12, 'hours')
          && moment(order.origin.datetime) <= moment(order.origin.datetime).startOf('day').add(15, 'hours')) {
          order.origin.datetime = moment(order.origin.datetime).startOf('day').add(15, 'hours');
        }
      }
      const orderSameCode = await Orders.findOne({
        where: { code: order.order_id },
      });
      if (orderSameCode) return orderSameCode;
      const newOrder = await Orders.create({
        code: order.order_id,
        customerId: order.customer.id,
        customerFullname: order.customer.name,
        customerPhone: order.customer.contact.phone,
        customerEmail: order.customer.contact.email,
        dropTime: moment(order.origin.datetime).add(timeZoneDiff, 'hours'),
        pickupTime: moment(order.destination.datetime).add(timeZoneDiff, 'hours'),
        arrivingTime: moment(
          order.destination.datetime,
          'YYYY-MM-DD HH:mm:ss',
        ).add(timeZoneDiff, 'hours').add(-30, 'minutes'),
        originPlaceId: order.origin.place_id,
        destinationPlaceId: order.destination.place_id,
        numberOfLuggage: order.luggage_qty,
        status: 1,
        createdBy: user.id,
        updatedBy: user.id,
      });
      return newOrder;
    }),
  );
  return newOrders;
};

module.exports = {
  getOrdersFromAirportels,
  insertOrdersFromAirportels,
};
