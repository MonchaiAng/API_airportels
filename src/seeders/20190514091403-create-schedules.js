'use strict';
const data = [
  
  {
    periodBegin: "06:00:01",
    periodEnd: "09:00:00",
    index: 1.0
  },
  {
    periodBegin: "09:00:01",
    periodEnd: "12:00:00",
    index: 1.1
  },{
    periodBegin: "12:00:01",
    periodEnd: "15:00:00",
    index: 1.2
  },
  {
    periodBegin: "15:00:01",
    periodEnd: "18:00:00",
    index: 1.3
  },
  {
    periodBegin: "18:00:01",
    periodEnd: "21:00:00",
    index: 1.4
  }
];

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(
      "schedules", data.map((d, index) => ({
        id: index + 1,
        periodBegin: d.periodBegin,
        periodEnd: d.periodEnd,
        index: d.index,
        createdAt: Sequelize.fn("NOW"),
        updatedAt: Sequelize.fn("NOW")
      }))
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("schedules", null, {});
  }
};
