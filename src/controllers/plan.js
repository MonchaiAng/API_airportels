const moment = require('moment');
const { Op } = require('sequelize');
const { Drivers, Plans, Orders, Places, PlaceTypes, PlanLocations } = require('../models');
const {
  IRP,
  getCalculatigOrders,
  getDriverToPlan,
  findClosestOrder,
  calculateCriticalTime,
} = require('../services/MRP');

const { getOrdersFromAirportels, insertOrdersFromAirportels } = require('../services/order');
const { testDiffDay } = require('../config/index');

const dailyPlanData = [
  {
    planID: 1,
    id: 1,
    capacity: 4,
    ordersData: [
      {
        orderID: 11,
        order: {
          criticalTime: '2018-11-24T12:30:00.000Z',
          dropDate: '2018-11-24T10:00:00.000Z',
          dropTime: '2018-11-24T10:00:00.000Z',
          dropLocationData: {
            name: 'The Manhattan Sukhumvit Bangkok',
          },
          dropPlace: {
            name: 'The Manhattan Sukhumvit Bangkok',
          },
          estimatetime: {
            estimate: '2018-11-24T10:00:00.000Z',
            timeleft: '2018-11-24T11:35:00.000Z',
          },
          orderCode: 'LUG181122745',
          orderType: 0,
          pickupDate: '2018-11-24T14:00:00.000Z',
          pickupLocationData: {
            name: 'Chatrium Residence Sathon Bangkok',
          },
          pickupPlace: {
            name: 'Chatrium Residence Sathon Bangkok',
          },
          pickupTime: '2018-11-24T14:00:00.000Z',
          planID: 21,
        },
      },
      {
        orderID: 20,
        order: {
          criticalTime: '2018-11-24T12:30:00.000Z',
          dropDate: '2018-11-24T10:00:00.000Z',
          dropTime: '2018-11-24T10:00:00.000Z',
          dropLocationData: {
            name: 'The Manhattan Sukhumvit Bangkok',
          },
          dropPlace: {
            name: 'The Manhattan Sukhumvit Bangkok',
          },
          estimatetime: {
            estimate: '2018-11-24T10:00:00.000Z',
            timeleft: '2018-11-24T11:35:00.000Z',
          },
          orderCode: 'LUG181122745',
          orderType: 0,
          pickupDate: '2018-11-24T14:00:00.000Z',
          pickupLocationData: {
            name: 'Chatrium Residence Sathon Bangkok',
          },
          pickupPlace: {
            name: 'Chatrium Residence Sathon Bangkok',
          },
          pickupTime: '2018-11-24T14:00:00.000Z',
          planID: 21,
        },
      },
    ],
  },
  {
    planID: 2,
    id: 2,
    capacity: 4,
    ordersData: [
      {
        orderID: 12,
        order: {
          criticalTime: '2018-11-24T12:30:00.000Z',
          dropDate: '2018-11-24T10:00:00.000Z',
          dropTime: '2018-11-24T10:00:00.000Z',
          dropLocationData: {
            name: 'The Manhattan Sukhumvit Bangkok',
          },
          dropPlace: {
            name: 'The Manhattan Sukhumvit Bangkok',
          },
          estimatetime: {
            estimate: '2018-11-24T10:00:00.000Z',
            timeleft: '2018-11-24T11:35:00.000Z',
          },
          orderCode: 'LUG181122745',
          orderType: 0,
          pickupDate: '2018-11-24T14:00:00.000Z',
          pickupLocationData: {
            name: 'Chatrium Residence Sathon Bangkok',
          },
          pickupPlace: {
            name: 'Chatrium Residence Sathon Bangkok',
          },
          pickupTime: '2018-11-24T14:00:00.000Z',
          planID: 21,
        },
      },
      {
        orderID: 21,
        order: {
          criticalTime: '2018-11-24T12:30:00.000Z',
          dropDate: '2018-11-24T10:00:00.000Z',
          dropTime: '2018-11-24T10:00:00.000Z',
          dropLocationData: {
            name: 'The Manhattan Sukhumvit Bangkok',
          },
          dropPlace: {
            name: 'The Manhattan Sukhumvit Bangkok',
          },
          estimatetime: {
            estimate: '2018-11-24T10:00:00.000Z',
            timeleft: '2018-11-24T11:35:00.000Z',
          },
          orderCode: 'LUG181122745',
          orderType: 0,
          pickupDate: '2018-11-24T14:00:00.000Z',
          pickupLocationData: {
            name: 'Chatrium Residence Sathon Bangkok',
          },
          pickupPlace: {
            name: 'Chatrium Residence Sathon Bangkok',
          },
          pickupTime: '2018-11-24T14:00:00.000Z',
          planID: 21,
        },
      },
    ],
  },
];

module.exports = {
  get: async (req, res, next) => {
    try {
      const { date } = req.query;
      const plans = await Plans.findAll({
        where: {
          createdAt: {
            [Op.gte]: moment(date, 'YYYY-MM-DD').startOf('day'),
            [Op.lte]: moment(date, 'YYYY-MM-DD').endOf('day'),
          },
        },
        include: [
          {
            model: Orders,
            as: 'order',
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
            ],
          },
          { model: Drivers },
          {
            model: PlanLocations,
            include: [{ model: Orders }, { model: Places, as: 'place' }],
          },
        ],
      });
      res.status(200).json({
        status: 200,
        data: {
          plans,
        },
      });
    } catch (err) {
      next(err);
    }
  },
  generate: async (req, res, next) => {
    try {
      const { user } = req;
      const { type, driverId, latitude, longitude, emergency, time } = req.body;

      //await insertOrdersFromAirportels(moment().add(testDiffDay, 'days'), user);
      let driver = null;
      if (driverId) driver = await getDriverToPlan(driverId);
      const irp = new IRP();
      irp.initailStart({
        type,
        driver,
        driverLocation: { latitude, longitude },
        emergency,
        time,
      })
      await irp.startProcess();

      res.status(200).json({
        status: 200,
        data: {
          irp,
        },
        message: 'Generated',
      });
    } catch (err) {
      next(err);
    }
  },
};
