const Joi = require('joi');

const validateBody = schema => (req, res, next) => {
  if (!JSON.parse(JSON.stringify(req.body))) {
    throw new Error('BODY ERROR');
  }
  const { error, value } = Joi.validate(req.body, schema);
  if (error) {
    res.status(422).json({
      error: error.details,
      message: error.details.map(e => `${e.message}`).join(', '),
    });
  } else {
    next();
  }
};

module.exports = validateBody;
