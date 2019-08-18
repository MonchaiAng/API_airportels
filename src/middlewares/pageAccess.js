const pageAccess = (req, res, next) => {
  try {
    console.log('pageAccess');
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  pageAccess,
};
