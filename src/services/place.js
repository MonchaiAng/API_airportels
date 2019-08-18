const { Places } = require('../models');
const { getLocationData } = require('../helpers/googleMap');

const convertPlaceType = (type) => {
  if (['airport'].includes(type)) return 1;
  else if (['hotel', 'hotelc', 'home'].includes(type)) return 2;
  else if (['mall'].includes(type)) return 3;
  else return 2;
};

const insertPlace = async (placeId, type) => {
  if (placeId) {
    const samePlace = await Places.findOne({ where: { placeId } });
    if (samePlace) return;

    const placeData = await getLocationData(placeId);
    if (!placeData) return;
    
    const place = await Places.create({
      placeId,
      typeId: convertPlaceType(type),
      latitude: placeData.geometry.location.lat,
      longitude: placeData.geometry.location.lng,
      name: placeData.name,
      address: placeData.formatted_address,
    });
    return place;
  }
};

module.exports = {
  insertPlace,
};
