const fs = require('fs');
const { getTokenFromRequest } = require('../helpers');
const { UserAuthentications } = require('../models');

const handleDestroyToken = async (err, req) => {
  if (err.name === 'UnauthorizedError') {
    const token = getTokenFromRequest(req);
    await UserAuthentications.destroy({
      where: {
        token,
      },
    });
  }
};

const handleDestroyImage = (req) => {
  if (req.file) {
    fs.unlinkSync(req.file.path);
  }
  if (req.files) {
    if (req.files.length > 0) {
      req.files.forEach((file) => {
        fs.unlinkSync(file.path);
      });
    }
  }
};

const errorResponse = (err, req, res, next) => {
  console.log(err.name);
  console.log(err.message);
  handleDestroyImage(req);
  handleDestroyToken(err, req);
  res.status(err.status || 400).send({
    error: {
      name: err.name,
      message: err.message,
    },
    message: err.message,
  });
  next();
};


module.exports = {
  errorResponse,
};
