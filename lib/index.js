const moment = require('moment');
const distance = require('google-distance');
const _ = require('lodash');

const timeFormat = 'HH:mm:ss';
const datetimeFormat = 'YYYY-MM-DDTHH:mm:ss';
const dateFormat = 'YYYY-MM-DD';
const sqlDatetimeFormat = 'YYYY-MM-DDTHH:mm:ss.000Z';
const smartDateFormat = 'DD-MM-YYYY  hh:mm:ss A'; // 01-07-2018  11:45:00 AM

const numToTime = (num = '') => {
  const time = num.toString().split('.');
  const hour = time[0];
  let min = time[1] < 10 ? (time[1] * 10) * 60 / 100 : (time[1] * 60) / 100;
  if (!min) min = '00';
  return `${hour}:${min}`;
};

const toBoolean = (value) => {
  switch (value) {
    case true:
    case 'true':
    case 1:
    case '1':
    case 'on':
    case 'yes':
      return true;
    default:
      return false;
  }
};

const isBetween = (start = 0, now = 0, end = 0) => (now >= start && end > now);

const minBy = (datas = [], at = '') => _.minBy(datas, data => data[at])[at];
const maxBy = (datas = [], at = '') => _.maxBy(datas, data => data[at])[at];

const getDistance = async (
  origin = { lat: 0, lng: 0 },
  destination = { lat: 0, lng: 0 },
  callback = () => {},
) => {
  distance.get({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
  }, async (err, data) => {
    await callback(data);
  });
};

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const radlat1 = Math.PI * lat1 / 180;
  const radlat2 = Math.PI * lat2 / 180;
  const theta = lon1 - lon2;
  const radtheta = Math.PI * theta / 180;
  let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  if (dist > 1) {
    dist = 1;
  }
  dist = Math.acos(dist);
  dist = dist * 180 / Math.PI;
  dist = dist * 60 * 1.1515;
  dist *= 1.609344; // km
  return dist;
};

const timeSlot = (time = new Date()) => {
  let slot = 0;
  let timeAdd = 0;
  for (let i = 0; i < 100; i += 0.25) {
    if (slot !== 0) break;
    if (isBetween(
      moment('00:00:00', timeFormat).add(15 * timeAdd, 'minutes'),
      moment(time),
      moment('00:15:00', timeFormat).add(15 * timeAdd, 'minutes'),
    )) {
      slot = i;
    } else if (moment(time) < moment().startOf('days')) {
      slot = -1;
    } else if (moment(time) > moment().endOf('days')) {
      slot = 99;
    }
    timeAdd += 1;
  }
  // let fromTime = numToTime(slot)
  // let toTime = numToTime(slot+0.25)
  // return `${fromTime}-${toTime}`
  return slot;
};

const getJsDateFromExcel = excelDate => new Date((excelDate - (25567 + 1)) * 86400 * 1000);

const getTimeOnDay = (date, hourStr) => {
  const time = moment.utc(date, datetimeFormat).format(`YYYY-MM-DDT${hourStr}:00`);
  return moment.utc(time, datetimeFormat);
};

const nearestMinutes = (interval, someMoment) => {
  const roundedMinutes = Math.round(someMoment.clone().minute() / interval) * interval;
  return someMoment.clone().minute(roundedMinutes).second(0);
};

module.exports = {
  timeFormat,
  datetimeFormat,
  dateFormat,
  sqlDatetimeFormat,
  smartDateFormat,

  timeSlot,
  numToTime,
  minBy,
  maxBy,
  getDistance,
  getTimeOnDay,
  toBoolean,

  // TEST
  isBetween,
  getJsDateFromExcel,
  calculateDistanceKm,

  nearestMinutes,
};
