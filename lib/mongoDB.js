const _ = require('lodash');

const update = async (model, data, where) => {
  // eslint-disable-next-line
  const Model = require(`../models/mongoDB/${model}`);
  const results = await Model.findOneAndUpdate(
    where,
    _.pickBy(data, _.identity),
    { upsert: true, new: true },
  );
  return results;
};

module.exports = {
  update,
};
