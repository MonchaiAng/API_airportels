const _ = require('lodash');
const axios = require('axios');

const {
  // googleAPI,
  googleAPITest,
} = require('../config');
const { Locations, Types } = require('../models');

const urlGoogleMapAPI = 'https://maps.googleapis.com/maps/api';
const pickDataList = ['address_components', 'geometry', 'id', 'name', 'place_id', 'types', 'url', 'utc_offset', 'vicinity', 'website', 'formatted_address'];

const fetchGooglePlace = async (placeID) => {
  const res = await axios(`${urlGoogleMapAPI}/place/details/json?placeid=${placeID}&key=${googleAPITest}&fields=formatted_address,name,geometry`);
  if (res.data.result) {
    const json = _.pick(res.data.result, pickDataList);
    if (!_.isEmpty(json)) {
      const place = {
        locationID: placeID,
        name: res.data.result.name,
        display: res.data.result.formatted_address,
        lat: res.data.result.geometry.location.lat,
      };
      console.log(placeID, place);
      return place;
    } else {
      console.log(`${placeID} is don't have`);
      return false;
    }
  }
};

const get = async (req, res, next) => {
  try {
    const { id } = req.params;
    const where = {};
    if (id) where.locationID = id;
    const locations = await Locations.findAll({
      where,
      include: [
        { model: Types },
      ],
    });
    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        total: locations.length,
        locations,
      },
    });
  } catch (err) {
    next(err);
  }
};

const post = async (req, res, next) => {
  try {
    const data = req.body;
    if (!data.locationID) throw new Error('please request locationID is placeID of google map');
    const haveLocation = await Locations.findById(data.locationID);
    if (haveLocation) throw new Error(`this location ${data.locationID} is haved`);
    const placeData = await fetchGooglePlace(data.locationID);
    if (!placeData) throw new Error(`this location ${data.locationID} dont have on google map`);
    data.lat = placeData.lat;
    data.lng = placeData.lng;
    const location = await Locations.create(data);

    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        location,
      },
    });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const location = await Locations.findById(id);
    if (_.isEmpty(location)) throw new Error(`Don't have locationID : ${id}`);

    await location.update(data);

    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        location,
      },
    });
  } catch (err) {
    next(err);
  }
};

const del = async (req, res, next) => {
  try {
    const { id } = req.params;

    const location = await Locations.findById(id);
    if (_.isEmpty(location)) throw new Error(`Don't have locationID : ${id}`);

    await location.destroy();

    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        location,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  get,
  post,
  update,
  del,
};
