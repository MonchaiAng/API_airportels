
const { Drivers, Plans, Orders, PlanLocations } = require('../../models');

const currentJob = {
  order: '00001',
  date: '29/01/2019',
  time: '09.00 น. - 10.00 น.',
  price: 400,
  hours: 28,
  distance: 300,
  pickup: 2,
  dropoff: 2,
  amount: 4,
  listPackage: [
    {
      package_id: 1,
      target: 'โรงแรมเอเชีย',
      address: 'เขตราชทวี',
      type: 'pickup',
      amount: 3,
      status: 'success',
      name: 'สมรักษ์ อยู่จันทร์',
      tel: '084-2134567',
    },
    {
      package_id: 2,
      target: 'โรงแรมเซ็นทราลา',
      address: 'เขตลาดพร้าว',
      type: 'pickdown',
      amount: 2,
      status: 'processing',
      name: 'สมรักษ์ อยู่จันทร์',
      tel: '084-2134567',
    },
  ],
};

const jobDetail = {
  order: '00001',
  date: '29/01/2019',
  time: '09.00 น. - 10.00 น.',
  price: 400,
  hours: 28,
  distance: 300,
  pickup: 2,
  dropoff: 2,
  amount: 4,
  listPackage: [
    {
      package_id: 1,
      target: 'โรงแรมเอเชีย',
      address: 'เขตราชทวี',
      type: 'pickup',
      amount: 3,
      status: 'success',
      name: 'สมรักษ์ อยู่จันทร์',
      tel: '084-2134567',
      image: [
        'default.png',
        'default.png',
        'default.png',
      ],
      remark: 'รอยขีด',
    },
    {
      package_id: 2,
      target: 'โรงแรมเซ็นทราลา',
      address: 'เขตลาดพร้าว',
      type: 'pickdown',
      amount: 2,
      status: 'processing',
      name: 'สมรักษ์ อยู่จันทร์',
      tel: '084-2134567',
      image: [
        'default.png',
        'default.png',
        'default.png',
      ],
      remark: 'รอยขีด',
    },
  ],
};

module.exports = {
  get: async (req, res, next) => {
    try {
      const { user: driver } = req;
      //check driver available?
      let data = {};
      const isWaiting = true; // find plans status WAITING
      if (isWaiting) {
        data = jobDetail;
      } else {
        // get current job status = "WORKING"
        // and locked location
        data = currentJob;
      }

      res.status(200).json({
        status: 200,
        message: `${req.method} ${req.path} SUCCESS`,
        data,
      });
    } catch (err) {
      next(err);
    }
  },
  pickup: async (req, res, next) => {
    try {
      const { orderId, detail } = req.body;
      console.log('OrderID', orderId);
      console.log('Detail', detail);
      if (req.files) {
        if (req.files.length > 0) {
          req.files.map(file => console.log(file.filename));
        }
      }

      res.status(200).json({
        status: 200,
        message: `${req.method} ${req.path} SUCCESS`,
      });
    } catch (err) {
      next(err);
    }
  },
  pickupLicense: async (req, res, next) => {
    try {
      const { orderId } = req.body;
      console.log('OrderID', orderId);
      if (req.file) {
        console.log(req.file.filename);
      }

      res.status(200).json({
        status: 200,
        message: `${req.method} ${req.path} SUCCESS`,
      });
    } catch (err) {
      next(err);
    }
  },
  dropoff: async (req, res, next) => {
    try {
      const { orderId, detail } = req.body;
      console.log('OrderID', orderId);
      console.log('Detail', detail);
      if (req.files) {
        if (req.files.length > 0) {
          req.files.map(file => console.log(file.filename));
        }
      }

      res.status(200).json({
        status: 200,
        message: `${req.method} ${req.path} SUCCESS`,
      });
    } catch (err) {
      next(err);
    }
  },
  dropoffLicense: async (req, res, next) => {
    try {
      const { orderId } = req.body;
      console.log('OrderID', orderId);
      if (req.file) {
        console.log(req.file.filename);
      }

      res.status(200).json({
        status: 200,
        message: `${req.method} ${req.path} SUCCESS`,
      });
    } catch (err) {
      next(err);
    }
  },

  online: async (req, res, next) => {
    try {
      const { user } = req;
      const driver = await Drivers.findOne({
        id: user.id,
      });
      if (!driver) throw new Error('Not found driver');
      await driver.update({
        isOnline: true,
      });
      res.status(200).json({
        status: 200,
        message: `${req.method} ${req.path} SUCCESS`,
      });
    } catch (err) {
      next(err);
    }
  },
  offline: async (req, res, next) => {
    try {
      const { user } = req;
      const driver = await Drivers.findOne({
        id: user.id,
      });
      if (!driver) throw new Error('Not found driver');
      await driver.update({
        isOnline: false,
      });
      res.status(200).json({
        status: 200,
        message: `${req.method} ${req.path} SUCCESS`,
      });
    } catch (err) {
      next(err);
    }
  },
  accept: async (req, res, next) => {
    try {
      const { user } = req;
      const plan = await Plans.findOne({
        where: {
          driverId: user.id,
          status: 'WAITING',
        },
      });
      if (plan) {
        await plan.update({
          status: 'WORKING',
        });
      }

      res.status(200).json({
        status: 200,
        message: `${req.method} ${req.path} SUCCESS`,
      });
    } catch (err) {
      next(err);
    }
  },
};
