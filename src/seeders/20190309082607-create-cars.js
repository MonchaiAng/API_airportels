'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("cars", [
      {
        id: 1,
        image: "car_1.jpg",
        carLicensePlate: "CAR 1",
        brand: "Toyota",
        model: "All new Altis 2018",
        engine: "1.8G",
        carCapacity: 40,
        companyId: 1,
        isActive: true,
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW"),
        createdBy: 1,
        updatedBy: 1
      },
      {
        id: 2,
        image: "car_1.jpg",
        carLicensePlate: "CAR 2",
        brand: "Toyota",
        model: "All new Altis 2018",
        engine: "1.8G",
        carCapacity: 40,
        companyId: 1,
        isActive: true,
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW"),
        createdBy: 1,
        updatedBy: 1
      },
      {
        id: 3,
        image: "car_1.jpg",
        carLicensePlate: "CAR 3",
        brand: "Toyota",
        model: "All new Altis 2018",
        engine: "1.8G",
        carCapacity: 40,
        companyId: 1,
        isActive: true,
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW"),
        createdBy: 1,
        updatedBy: 1
      },
      {
        id: 4,
        image: "car_1.jpg",
        carLicensePlate: "CAR 4",
        brand: "Toyota",
        model: "All new Altis 2018",
        engine: "1.8G",
        carCapacity: 40,
        companyId: 1,
        isActive: true,
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW"),
        createdBy: 1,
        updatedBy: 1
      },
      {
        id: 5,
        image: "car_1.jpg",
        carLicensePlate: "CAR 5",
        brand: "Toyota",
        model: "All new Altis 2018",
        engine: "1.8G",
        carCapacity: 40,
        companyId: 1,
        isActive: true,
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW"),
        createdBy: 1,
        updatedBy: 1
      },
    ]);
  },

  down: queryInterface => queryInterface.bulkDelete("cars", null, {})
};
