
module.exports = {
  get: async (req, res, next) => {
    try {
      const notifications = [
        {
          id: 1,
          order: '00001',
          message: 'คุณได้รับเงินโอนเรียบร้อยแล้ว',
          type: 'pickup',
        },
        {
          id: 2,
          order: '00002',
          message: 'คุณได้รับเงินโอนเรียบร้อยแล้ว',
          type: 'pickup',
        },
        {
          id: 3,
          order: '00003',
          message: 'คุณได้รับเงินโอนเรียบร้อยแล้ว',
          type: 'dropoff',
        },
        {
          id: 4,
          order: '00004',
          message: 'คุณได้รับเงินโอนเรียบร้อยแล้ว',
          type: 'dropoff',
        },
        {
          id: 5,
          order: '00005',
          message: 'คุณได้รับเงินโอนเรียบร้อยแล้ว',
          type: 'transfer',
        },
        {
          id: 6,
          order: '00006',
          message: 'คุณได้รับเงินโอนเรียบร้อยแล้ว',
          type: 'transfer',
        },
      ];
      res.status(200).json({
        status: 200,
        message: `${req.method} ${req.path} SUCCESS`,
        data: {
          notifications,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
