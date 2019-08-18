const mongoose = require('mongoose');

const { Schema } = mongoose;

const DistancesSchema = new Schema({
  distanceID: Number,
  origin: {
    lat: Number,
    lng: Number,
  },
  destination: {
    lat: Number,
    lng: Number,
  },
  distance: Number,
  createDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Distances', DistancesSchema);
