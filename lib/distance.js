
const request = require('request');
const { googleAPITest } = require('../config');

const googleDistanceMatrix = 'https://maps.googleapis.com/maps/api/distancematrix';

const findFastestWay = (rows) => {
  const [row] = rows;
  return row.elements[0];
};

const getDistance = async (origin, destination, departureTime = 'now') => {
  const params = new URLSearchParams();
  params.append('origins', `${origin.lat},${origin.lng}`);
  params.append('destinations', `${destination.lat},${destination.lng}`);
  params.append('departure_time', departureTime);
  params.append('key', googleAPITest);
  const result = await new Promise((resolve) => {
    request.get(`${googleDistanceMatrix}/json?${params.toString()}`, (error, res, body) => {
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
        resolve({ error, data: null });
      }
    });
  });
  return result;
};

module.exports = {
  getDistance,
};
