"use strict";
const { location } = require("../mockupData/places");
//console.log(location);
module.exports = {
  up: (queryInterface, Sequelize) => {
    const places = location.map( lct => {
      return {
        id: lct.id,
        placeId: lct.placeId,
        latitude: lct.latitude,
        longitude: lct.longitude,
        name: lct.name,
        address: lct.address,
        typeId: lct.typeId,
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW")
      }
    });
    return queryInterface.bulkInsert("places", places);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("places", null, {});
  }
};
