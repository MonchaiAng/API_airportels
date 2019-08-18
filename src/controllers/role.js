const { Roles } = require('../models');

module.exports = {
  get: async (req, res, next) => {
    try {
      const { id } = req.params;
      const where = {};
      if (id) where.id = id;
      const roles = await Roles.findAll({
        where,
      });
      res.status(200).json({
        data: {
          roles,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
