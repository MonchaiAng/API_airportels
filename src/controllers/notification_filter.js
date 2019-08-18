const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const { NotificationFilters, NotificationTypes, Users, Roles } = require('../models');

module.exports = {
  get: async (req, res, next) => {
    try {
      const notificationFilters = await NotificationFilters.findAll({
        attributes: ['id', 'isActive'],
        include: [
          {
            attributes: ['id', 'name'],
            model: NotificationTypes,
          },
        ],
        where: {
          userId: req.user.id,
        },
      });

      const userDetails = await Users.findAll({
        attributes: ['id', 'firstname', 'lastname'],
        include: [
          {
            attributes: ['name'],
            model: Roles,
          },
        ],
        where: {
          id: req.user.id,
        },
      });

      res.json({
        ok: true,
        data: {
          notificationFilters,
          userDetails,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { user } = req;
      const { id } = req.params;
      const data = req.body;

      const notificationId = await NotificationTypes.findById(id);
      if (!notificationId) throw new Error('This notification type is not exist');

      const notificationFilter = await NotificationFilters.findOne({
        where: {
          notificationId: id,
          userId: user.id,
        },
      });
      if (!notificationFilter) {
        await NotificationFilters.create({
          userId: user.id,
          notificationId: id,
          isActive: data.isActive,
        });
      } else {
        await notificationFilter.update(data);
      }

      res.json({
        ok: true,
        data: {
          notificationFilter,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
