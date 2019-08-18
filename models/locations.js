const _ = require('lodash');
const Sequelize = require('sequelize');
const axios = require('axios');
const sequelize = require('./connect');

const Types = require('./types');

const {
  // googleAPI,
  googleAPITest,
} = require('../config');

const urlGoogleMapAPI = 'https://maps.googleapis.com/maps/api';
const pickDataList = ['address_components', 'geometry', 'id', 'name', 'place_id', 'types', 'url', 'utc_offset', 'vicinity', 'website', 'formatted_address'];

const Locations = sequelize.define('locations', {
  locationID: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  name: Sequelize.TEXT,
  display: Sequelize.TEXT,
  lat: Sequelize.FLOAT,
  lng: Sequelize.FLOAT,
  phone: {
    type: Sequelize.TEXT, // many phone number (string array)
    get() {
      return _.split(this.getDataValue('phone'), ',');
    },
    set(val) {
      return this.setDataValue('phone', _.join(val));
    },
    allowNull: true,
    defaultValue: '',
  },
  email: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: '',
  },
  typeID: {
    type: Sequelize.INTEGER,
    validate: {
      isIn: {
        args: [[1, 2, 3, 4, 5]],
        msg: 'typeID should be 1, 2, 3, 4, 5',
      },
    },
  },
});
Locations.belongsTo(Types, { foreignKey: 'typeID' });


Locations.fetchAndInsertPlaceData = async (type, placeID) => {
  // console.log('iiii', i);
  let typeID = 3;
  if (type === 'airport') typeID = 1;
  if (type === 'mall') typeID = 2;
  if (type === 'hotel') typeID = 3;
  if (type === 'hotelc') typeID = 3;
  const location = await Locations.findById(placeID);
  if (!_.isEmpty(location)) {
    // console.log(`${placeID} is have`);
  } else {
    // console.log('PLACE : ', place);
    for (let i = 0; i < 10000; i += 1) {
      const res = await axios(`${urlGoogleMapAPI}/place/details/json?placeid=${placeID}&key=${googleAPITest}&fields=formatted_address,name,geometry`);
      console.log(placeID, i, type, typeID, res.data.status);
      if (res.data.result) {
        const json = _.pick(res.data.result, pickDataList);
        if (!_.isEmpty(json)) {
          const place = {
            locationID: placeID,
            name: res.data.result.name,
            display: res.data.result.formatted_address,
            lat: res.data.result.geometry.location.lat,
            lng: res.data.result.geometry.location.lng,
            typeID,
          };
          const response = await Locations.upsert(place);
          console.log(placeID, response);
        } else {
          console.log(`${placeID} is don't have`);
        }
        break;
      }
    }
  }
};

Locations.fetchAndInsertPlaceDataFromLatLng = async (lat, lng) => {
  console.log(lat, lng, Locations);
  const location = await Locations.findOne({
    where: {
      lat,
      lng,
    },
  });
  if (location) {
    return location.locationID;
  } else {
    const res = await axios(`${urlGoogleMapAPI}/geocode/json?latlng=${lat},${lng}&key=${googleAPITest}&fields=formatted_address,name,geometry`);
    if (res.data.results) {
      const placeData = res.data.results[0];
      console.log(placeData);
      const place = {
        locationID: placeData.place_id,
        name: placeData.formatted_address.substr(0, 20),
        display: placeData.formatted_address,
        lat: placeData.geometry.location.lat,
        lng: placeData.geometry.location.lng,
        typeID: 3,
      };
      await Locations.upsert(place);
      console.log('Insert Data', placeData.place_id);
      return placeData.place_id;
    } else {
      console.log('ERROR', res.data.status);
    }
  }
};

module.exports = Locations;
