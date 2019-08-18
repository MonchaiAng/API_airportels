const dailyOrderData = [
  {
    orderNo: 'LUG1109348',
    origin: 'Sukhumvit Hotel',
    destination: 'BKK (Drop at T21)',
    capacity: 3,
    dropoff: '08:30',
    driverPickup: '10:30',
    critical: '17:30',
    travel: '1hr 30 min',
    customerPickup: '19:00',
    driverID: 'driver01',
    driverName: 'Mr.Annop',
    delay: 0,
    fail: 0,
    refund: 0,
  },
  {
    orderNo: 'LUG1299084',
    origin: 'Novotel Bangkok',
    destination: 'BKK',
    capacity: 8,
    dropoff: '09:00',
    driverPickup: '14:00',
    critical: '18:00',
    travel: '1hr 20 min',
    customerPickup: '19:20',
    driverID: 'driver02',
    driverName: 'Atthapan Damrassiri',
    delay: 1,
    fail: 0,
    refund: 0,
  },
  {
    orderNo: 'LUG1109348',
    origin: 'Sukhumvit Hotel (Pick at T21)',
    destination: 'BKK',
    capacity: 3,
    dropoff: '08:30',
    driverPickup: '14:30',
    critical: '18:00',
    travel: '1hr',
    customerPickup: '19:00',
    driverID: 'driver02',
    driverName: 'Atthapan Damrassiri',
    delay: 0,
    fail: 1,
    refund: 200,
  },
];

const dailyDriverData = [
  {
    driverID: 'driver01',
    driverName: 'Mr.Annop',
    start: '10:30',
    finish: '19:00',
    total: '9.30',
  },
  {
    driverID: 'driver02',
    driverName: 'Atthapan Damrassiri',
    start: '14:00',
    finish: '19:00',
    total: '5',
  },
];

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
  getOrders: async (req, res, next) => {
    try {
      const { date } = req.query;
      res.status(200).json({
        data: {
          orders: dailyOrderData,
        },
      });
    } catch (err) {
      next(err);
    }
  },
  getDrivers: async (req, res, next) => {
    try {
      const { date } = req.query;
      res.status(200).json({
        data: {
          drivers: dailyDriverData,
        },
      });
    } catch (err) {
      next(err);
    }
  },
  getPlans: async (req, res, next) => {
    try {
      const { date } = req.query;
      res.status(200).json({
        data: {
          plans: dailyPlanData,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
