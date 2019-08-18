
const Sequelize = require('sequelize');
const sequelize = require('./connect');

const Drivers = require('./drivers');

const OrdersDrivers = sequelize.define('orderdrivers', {
  orderDriverID: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderID: Sequelize.INTEGER,
  driverID: Sequelize.INTEGER,
  carID: Sequelize.INTEGER,
  status: Sequelize.INTEGER,
  driverPickupDate: Sequelize.DATE, // เวลาที่วิ่งได้จริง
  driverDropDate: Sequelize.DATE, // เวลาที่วิ่งได้จริง
});
OrdersDrivers.belongsTo(Drivers, { foreignKey: 'driverID' });

OrdersDrivers.insertOrderDriver = async (plan = []) => {
  let drivers = await Drivers.findAll();
  drivers = drivers.map(driver => driver.dataValues.driverID);
  let index = 0;
  const status = 1;
  plan.forEach((p) => {
    if (drivers[index]) {
      p.orders.map(async (order) => {
        const orderdriver = {
          orderID: order.orderID,
          driverID: drivers[index],
          status,
        };
        await OrdersDrivers.create(orderdriver);
      });
    }
    index += 1;
  });
};

module.exports = OrdersDrivers;
