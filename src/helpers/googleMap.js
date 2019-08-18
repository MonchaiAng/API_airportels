const request = require('request');
const _ = require('lodash');
const moment = require('moment');
const axios = require('axios');
const { googleAPI } = require('../config/keys');
const { buildParams } = require('./index');
const {Places} = require("../models");

const googleUrl = 'https://maps.googleapis.com/maps/api';

const findFastestWay = (rows) => {
  const [row] = rows;
  return row.elements[0];
};

const getDistanceMatrix = async ({
  origin,
  destination,
  arrivalTime, // ไปถึงเมือ
  departureTime, // เริ่มวิ่งเมือ
}) => {
  const params = {
    origins: `${origin.latitude},${origin.longitude}`,
    destinations: `${destination.latitude},${destination.longitude}`,
    key: googleAPI,
  };
  if (arrivalTime) {
    params.arrival_time = +moment(arrivalTime);
  } else if (departureTime) {
    params.departure_time = +moment(departureTime);
  }
  const result = await new Promise((resolve) => {
    request.get(
      `${googleUrl}/distancematrix/json${buildParams(params)}`,
      (error, res, body) => {
        if (body) {
          body = JSON.parse(body);
          if (body.status === 'OK') {
            const { rows } = body;
            const fastestWay = findFastestWay(rows);
            resolve({ error, data: fastestWay });
          } else {
            error = {
              status: body.status,
              message: body.error_message,
            };
            console.log('ERROR', error);
            resolve({ error, data: null });
          }
        } else {
          console.log('ERROR', error);
          resolve({ error, data: null });
        }
      },
    );
  });
  return result;
};

const getLocationData = async (placeId) => {
  const placeIdDetails = await Places.findOne({
    where: {
      placeId: placeId
    }
  });
  //console.log("palceIdDetails", placeIdDetails);

  if(placeIdDetails){
    const data = {
      geometry: {
        location: {
          lat: placeIdDetails.latitude,
          lng: placeIdDetails.longitude
        }
      }
    };
    //console.log("Get latitude and longitude from database");
    return data;
  }else{
    if (placeId) {
      const params = {
        placeid: placeId,
        key: googleAPI,
        fields: 'formatted_address,name,geometry',
      };
      const res = await axios(`${googleUrl}/place/details/json${buildParams(params)}`);
      
      if (res.data.result) {
        const pickDataList = ['address_components', 'geometry', 'id', 'name', 'place_id', 'types', 'url', 'utc_offset', 'vicinity', 'website', 'formatted_address'];
        const data = _.pick(res.data.result, pickDataList);
        if (!_.isEmpty(data)) {
          return data;
        } else {
          console.log(`${placeId} is don't have location data`);
        }
      }
    }
  }
  
};

const getPlaceData = async (latlng) => {
  if (latlng) {
    const params = {
      latlng,
      key: googleAPI,
      fields: 'formatted_address,name,geometry',
    };
    const res = await axios(`${googleUrl}/geocode/json${buildParams(params)}`);
    if (res.data.results.length > 0) {
      const pickDataList = ['address_components', 'geometry', 'id', 'name', 'place_id', 'types', 'url', 'utc_offset', 'vicinity', 'website', 'formatted_address'];
      const data = _.pick(res.data.results[0], pickDataList);
      if (!_.isEmpty(data)) {
        //console.log('Success google place', data.geometry);
        return data;
      } else {
        //console.log(`${latlng} is don't have location data`);
      }
    }
  }
};

module.exports = {
  getDistanceMatrix,
  getLocationData,
  getPlaceData,
};
