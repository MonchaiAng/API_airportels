const { Types } = require('../models');

const getTypes = async (req, res, next) => {
  try {
    const { categoryID } = req.params;
    const types = await Types.findAll({ where: { categoryID } });
    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        types,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTypes,
};
