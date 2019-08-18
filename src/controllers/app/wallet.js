
module.exports = {
  get: async (req, res, next) => {
    try {
      const wallet = {
        id: '58BNZ09',
        name: 'Somchai Jandee',
        image: 'https://regmedia.co.uk/2018/02/07/driver_shutterstock.jpg',
        rating: 4,
        level: 'Premium',
        brand: 'Toyota',
        car_number: '4ก-4555',
        tel: '091-2345678',
        wallet_per_bill: 9000,
        online_status: true,
      };
      res.status(200).json({
        status: 200,
        message: `${req.method} ${req.path} SUCCESS`,
        data: {
          wallet,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
