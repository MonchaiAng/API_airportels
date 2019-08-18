const moment = require('moment');
const { Op } = require('sequelize');
const { Drivers, Plans, Orders, Places, PlaceTypes, PlanLocations} = require('../models');
const { timeZoneDiff } = require('../config');
const { getOrdersFromAirportels, insertOrdersFromAirportels } = require('../services/order');

module.exports = {
  get: async (req, res, next) => {
    try {
      const { user } = req;
      const { date } = req.query;

      // await insertOrdersFromAirportels(date, user);

      const orders = await Orders.findAll({
        include: [
          {
            model: Places,
            as: 'originPlace',
            include: [{ model: PlaceTypes, as: 'type' }],
          },
          {
            model: Places,
            as: 'destinationPlace',
            include: [{ model: PlaceTypes, as: 'type' }],
          },
          {
            model: Plans,
            as: 'plan',
          },
        ],
        where: {
          status: 1, // Waiting,
          // originPlaceId: { [Op.ne]: null },
          // destinationPlaceId: { [Op.ne]: null },
          dropTime: {
            [Op.lte]: moment(date, 'YYYY-MM-DD')
              .add(timeZoneDiff, 'hours')
              .endOf('day'),
          },
          pickupTime: {
            [Op.gte]: moment(date, 'YYYY-MM-DD')
              .add(timeZoneDiff, 'hours')
              .startOf('day'),
          },
        },
      });
      res.status(200).json({
        status: 200,
        data: {
          orders,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { user } = req;
      const data = req.body;

      data.updatedBy = user.id;

      const order = await Orders.findById(id);

      if (!order) {
        throw new Error('This order does not exist.');
      }

      if (data.type === 'DES') {
        data.destinationPlaceId = data.placeId;
      } else if (data.type === 'ORI') {
        data.originPlaceId = data.placeId;
      } else {
        throw new Error("This order's type does not define");
      }

      const updatedOrder = await order.update(data);
      res.json({
        ok: true,
        data: {
          order: updatedOrder,
        },
      });
    } catch (err) {
      next(err);
    }
  },
  updateStatus: async (req, res, next) => {
    try {
      await Orders.update({
        status: 1,
      }, {
        where: {
          status: {
            [Op.in]: [2, 3, 4],
          },
        },
      });
      await PlanLocations.destroy({
        where: {

        },
        truncate: true,
      });
      await Plans.destroy({
        where: {

        },
      });
      res.json({
        ok: true,
        data: {
          message: "successfully update all order's status to waiting and delete all of location planned.",
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
