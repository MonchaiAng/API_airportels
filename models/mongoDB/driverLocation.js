const mongoose = require('mongoose');

const { Schema } = mongoose;

const DriverSchema = new Schema({
  driverID: Number,
  lat: String,
  lng: String,
  createDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('DriverLocation', DriverSchema);
