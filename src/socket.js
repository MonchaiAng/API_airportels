const SocketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const { Drivers, Users } = require('./models');
const { SECRET_DRIVER, SECRET_ADMIN } = require('./config/secret');

const getUser = async (user, role) => {
  if (role === 'ADMIN') {
    return Users.findOne({
      where: {
        id: user.id,
      },
    });
  } else {
    return Drivers.findOne({
      where: {
        id: user.id,
      },
    });
  }
};

const getTimeToLive = exp => moment.duration(moment.utc(exp * 1000).diff(moment.utc()));

const authorization = async (socket, next) => {
  try {
    const { token } = socket.handshake.query;
    let user = null;
    let role = '';
    try {
      user = await jwt.verify(token, SECRET_DRIVER);
      if (user) role = 'DRIVER';
    } catch (err) {};

    if (!user) {
      try {
        user = await jwt.verify(token, SECRET_ADMIN);
        if (user) role = 'ADMIN';
      } catch (err) {};
    }
    // user = await getUser(user, role);
    // const timeToLive = getTimeToLive(user.exp);
    // setTimeout(() => {
    //   socket.disconnect();
    // }, timeToLive.asMilliseconds());
    next(user, role);
  } catch (err) {
    socket.disconnect();
  }
};

const delay = 60 * 3;
const DriverLocation = () => ({
  drivers: [],
  update({ driverId, latitude, longitude }) {
    const foundDriver = this.drivers.find(driver => driver.driverId === driverId);
    if (foundDriver) {
      foundDriver.latitude = latitude;
      foundDriver.longitude = longitude;
    } else {
      this.drivers = [...this.drivers, { driverId, latitude, longitude }];
    }
  },
  updateDataBase() {
    setInterval(() => {
      Drivers.bulkCreate(this.drivers, { updateOnDuplicate: true }).then((drivers) => {
        console.log('updated drivers', drivers);
      });
    }, delay);
  },
});

// const driverLocation = DriverLocation();
// driverLocation.updateDataBase();

module.exports = {
  io: null,
  socket: null,
  initialize(server) {
    this.io = SocketIO(server, { origins: '*:*' });
    this.io.on('connection', async (socket) => {
      authorization(socket, (user, role) => { // role enum['DRIVER', 'ADMIN']
        this.socket = socket;
        if (role === 'DRIVER') {
          socket.on(`driver.location/${user.id}`, ({ latitude, longitude }) => {

            // await Drivers.update({
            //   latitude: latitude,
            //   longitude: longitude
            // },{where: {id: user.id}});

            if (role === 'ADMIN') {
              // driverLocation.update({ latitude, longitude });
              this.emit(`driver.location/${user.id}`, { latitude, longitude });
            }
          });
        }
      });
    });
  },
  emit(event, payload) {
    if (this.socket) {
      console.log('Socket', event, payload);
      this.socket.emit(event, payload);
    }
  },
};

const event = [
  'driver.notification.newjob/${driverId}', // /${driverId}
  'driver.location/${driverId}', // /${driverId}
  '',
];

// driver.notification.newjob/${driverId}
  // {
  //   order_id: String(), // planId
  //   started_at: new Date(), // startTime
  // }

// driver.location
  // {
  //   latitude,
  //   longitude
  // }
