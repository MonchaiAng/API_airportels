const mongoose = require('mongoose');

const { Schema } = mongoose;

const OrderStatusSchema = new Schema({
  orderID: Number,
  status: String,
  timeleft: String,
  estimate: String,
  lat: String,
  lng: String,
  pickupDate: String,
  createDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('OrderStatus', OrderStatusSchema);
