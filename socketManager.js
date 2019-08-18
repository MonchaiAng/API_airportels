// const mongoose = require(`mongoose`);
const { getOrders } = require('./controllers/order');

// const mongooseObject = mongoose.Types.ObjectId;
// const isObjectId = id => mongooseObject.isValid(id);


module.exports = async (client) => {
  const orders = await getOrders({});

  client.emit('orders', orders);

  client.on('orderStatus', (order) => {
    client.emit('orderStatus', order);
  });

  // res.io.emit('newOrder', order)
};
