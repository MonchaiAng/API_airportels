const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const { Places } = require('../models');

module.exports = {
  get: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { query } = req;

      const where = {};

      if (id) {
        where.id = id;
      }

      const place = await Places.findAll({
        attributes: [
          'id',
          'placeId',
          'typeId',
          'latitude',
          'longitude',
          'name',
          'address',
          'createdAt',
          'updatedAt',
        ],
        where,
      });

      res.json({
        ok: true,
        data: {
          place,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  post: async (req, res, next) => {
    try {
      const data = req.body;
      const hasPlace = await Places.findOne({
        where: {
          placeId: data.placeId,
        },
      });
      if (hasPlace) {
        res.json({
          ok: true,
          data: { place: hasPlace },
        });
      } else {
        const place = await Places.create(data);
        res.json({
          ok: true,
          data: {
            place,
          },
        });
      }
    } catch (err) {
      next(err);
    }
  },
};
