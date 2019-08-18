const { validationResult } = require('express-validator/check');

const validateBodyErrors = (req, res, next) => {
  if (!JSON.parse(JSON.stringify(req.body))) {
    throw new Error('BODY ERROR');
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      error: errors.array(),
      message: errors
        .array()
        .map(error => `${error.param} ${error.msg}`)
        .join(', '),
    });
  } else next();
};

module.exports = validateBodyErrors;
