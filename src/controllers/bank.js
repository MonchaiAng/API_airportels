const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const JWT = require('jsonwebtoken');

const { Banks } = require('../models');

module.exports = {
  get: async (req, res, next) => {
    try {
      const banks = await Banks.findAll({});
      res.json({
        ok: true,
        data: {
          total: banks.length,
          banks,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
