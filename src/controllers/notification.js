const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const { NotificationFilters } = require('../models');

module.exports = {
  get: async (req, res, next) => {
    try {
      const notifications = [
        {
          id: 1,
          name: 'Driver going to delay',
          data: [
            {
              critical: '12:00',
              planId: 1,
              driver: 1,
              createdAt: '2019-03-30',
            },
          ],
        },
        {
          id: 2,
          name: 'Order moved to new plan',
          data: [
            {
              previosPlanId: 1,
              previosDriver: 'Driver 1',
              newPlan: 2,
              newDriver: 'Driver 2',
              orderId: 1,
              createdAt: '2019-03-30',
            },
          ],
        },
        {
          id: 3,
          name: 'Consolidation suggestions',
          data: [
            {
              orderId: 1,
              planId: 2,
              luggage: 3,
              driverId: 'Driver 1',
              capacity: 3,
              planId: 1,
              luggage: 3,
              driver: 'Driver 2',
              capacity: 3,
              createdAt: '2019-03-30',
            },
          ],
        },
        {
          id: 4,
          name: 'Confirmed consolidation',
          data: [
            {
              orderId: 1,
              planId: 1,
              luggage: 3,
              driver: 'Driver 1',
              capacity: 3,
              planId: 2,
              luggage: 3,
              driver: 'Driver 3',
              capacity: 3,
              createdAt: '2019-03-30',
            },
          ],
        },
        {
          id: 5,
          name: 'Order Reach "Must Plan" Time',
          data: [
            {
              time: '09:00',
              orderId: 1,
              location: 'MBK',
              createdAt: '2019-03-30',
            },
          ],
        },
        {
          id: 6,
          name: 'Plans assigned to driver',
          data: [
            {
              planId: 1,
              driver: 'Driver 1',
              totalOrders: 3,
              luggage: 3,
              location: 'MBK',
              createdAt: '2019-03-30',
            },
          ],
        },
        {
          id: 7,
          name: 'Canceled tasks',
          data: [
            {
              time: '09:00',
              orderId: 1,
              location: 'MBK',
              createdAt: '2019-03-30',
            },
          ],
        },
        {
          id: 8,
          name: 'Order removed from plan',
          data: [
            {
              planId: 1,
              driver: 'Driver 1',
              orderId: 1,
              createdAt: '2019-03-30',
            },
          ],
        },
      ];
      res.json({
        ok: true,
        data: {
          notifications,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
