const { Companies } = require('../models');

module.exports = {
  get: async (req, res, next) => {
    try {
      const { id } = req.params;
      const where = {};
      if (id) where.id = id;
      const companies = await Companies.findAll({
        where,
      });
      res.status(200).json({
        data: {
          companies,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
