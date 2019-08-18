const statisticData = [
  {
    service: 'Bangkok Delivery',
    totalOrders: 1,
    totalLuggages: 1,
    totalDrivers: 1,
    cost: 20,
    costPerLuggage: 20,
    costPerOrder: 20,
    onTime: 98,
    failure: 0,
    data: [
      {
        name: 'Hotel to Airport',
        ratio: 33.33,
        totalOrders: 1,
        totalLuggages: 1,
        totalDrivers: 1,
        cost: 20,
        costPerLuggage: 20,
        costPerOrder: 20,
        onTime: 98,
        failure: 0,
      },
      {
        name: 'Airport to Hotel',
        ratio: 33.33,
        totalOrders: 1,
        totalLuggages: 1,
        totalDrivers: 1,
        cost: 20,
        costPerLuggage: 20,
        costPerOrder: 20,
        onTime: 98,
        failure: 0,
      },
      {
        name: 'Airport to Airport',
        ratio: 33.33,
        totalOrders: 1,
        totalLuggages: 1,
        totalDrivers: 1,
        cost: 20,
        costPerLuggage: 20,
        costPerOrder: 20,
        onTime: 98,
        failure: 0,
      },
    ],
  },
  {
    service: 'Nationwide Delivery',
    totalOrders: 1,
    totalLuggages: 1,
    totalDrivers: 1,
    cost: 20,
    costPerLuggage: 20,
    costPerOrder: 20,
    onTime: 98,
    failure: 0,
    data: [
      {
        name: 'Hotel to Airport',
        ratio: 33.33,
        totalOrders: 1,
        totalLuggages: 1,
        totalDrivers: 1,
        cost: 20,
        costPerLuggage: 20,
        costPerOrder: 20,
        onTime: 98,
        failure: 0,
      },
      {
        name: 'Airport to Hotel',
        ratio: 33.33,
        totalOrders: 1,
        totalLuggages: 1,
        totalDrivers: 1,
        cost: 20,
        costPerLuggage: 20,
        costPerOrder: 20,
        onTime: 98,
        failure: 0,
      },
      {
        name: 'Airport to Airport',
        ratio: 33.33,
        totalOrders: 1,
        totalLuggages: 1,
        totalDrivers: 1,
        cost: 20,
        costPerLuggage: 20,
        costPerOrder: 20,
        onTime: 98,
        failure: 0,
      },
    ],
  },
  {
    service: 'Keycard Delivery',
    totalOrders: 1,
    totalLuggages: 1,
    totalDrivers: 1,
    cost: 20,
    costPerLuggage: 20,
    costPerOrder: 20,
    onTime: 98,
    failure: 0,
    data: [
      {
        name: 'Hotel to Airport',
        ratio: 33.33,
        totalOrders: 1,
        totalLuggages: 1,
        totalDrivers: 1,
        cost: 20,
        costPerLuggage: 20,
        costPerOrder: 20,
        onTime: 98,
        failure: 0,
      },
      {
        name: 'Airport to Hotel',
        ratio: 33.33,
        totalOrders: 1,
        totalLuggages: 1,
        totalDrivers: 1,
        cost: 20,
        costPerLuggage: 20,
        costPerOrder: 20,
        onTime: 98,
        failure: 0,
      },
      {
        name: 'Airport to Airport',
        ratio: 33.33,
        totalOrders: 1,
        totalLuggages: 1,
        totalDrivers: 1,
        cost: 20,
        costPerLuggage: 20,
        costPerOrder: 20,
        onTime: 98,
        failure: 0,
      },
    ],
  },
  {
    service: 'Pattaya Delivery',
    totalOrders: 1,
    totalLuggages: 1,
    totalDrivers: 1,
    cost: 20,
    costPerLuggage: 20,
    costPerOrder: 20,
    onTime: 98,
    failure: 0,
    data: [
      {
        name: 'Hotel to Airport',
        ratio: 33.33,
        totalOrders: 1,
        totalLuggages: 1,
        totalDrivers: 1,
        cost: 20,
        costPerLuggage: 20,
        costPerOrder: 20,
        onTime: 98,
        failure: 0,
      },
      {
        name: 'Airport to Hotel',
        ratio: 33.33,
        totalOrders: 1,
        totalLuggages: 1,
        totalDrivers: 1,
        cost: 20,
        costPerLuggage: 20,
        costPerOrder: 20,
        onTime: 98,
        failure: 0,
      },
      {
        name: 'Airport to Airport',
        ratio: 33.33,
        totalOrders: 1,
        totalLuggages: 1,
        totalDrivers: 1,
        cost: 20,
        costPerLuggage: 20,
        costPerOrder: 20,
        onTime: 98,
        failure: 0,
      },
    ],
  },
  {
    service: 'Phuket Delivery',
    totalOrders: 1,
    totalLuggages: 1,
    totalDrivers: 1,
    cost: 20,
    costPerLuggage: 20,
    costPerOrder: 20,
    onTime: 98,
    failure: 0,
    data: [
      {
        name: 'Hotel to Airport',
        ratio: 33.33,
        totalOrders: 1,
        totalLuggages: 1,
        totalDrivers: 1,
        cost: 20,
        costPerLuggage: 20,
        costPerOrder: 20,
        onTime: 98,
        failure: 0,
      },
      {
        name: 'Airport to Hotel',
        ratio: 33.33,
        totalOrders: 1,
        totalLuggages: 1,
        totalDrivers: 1,
        cost: 20,
        costPerLuggage: 20,
        costPerOrder: 20,
        onTime: 98,
        failure: 0,
      },
      {
        name: 'Airport to Airport',
        ratio: 33.33,
        totalOrders: 1,
        totalLuggages: 1,
        totalDrivers: 1,
        cost: 20,
        costPerLuggage: 20,
        costPerOrder: 20,
        onTime: 98,
        failure: 0,
      },
    ],
  },
];

module.exports = {
  get: async (req, res, next) => {
    try {
      const { start, end } = req.query;
      console.log(start, end);
      res.status(200).json({
        data: {
          statistics: statisticData,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
