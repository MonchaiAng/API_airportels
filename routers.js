const express = require('express');

const router = express.Router();
const path = require('path');

const multer = require('multer');

const user = require('./controllers/user');
const order = require('./controllers/order');
const driver = require('./controllers/driver');
const car = require('./controllers/car');
const timeline = require('./controllers/timeline');
const test = require('./controllers/test');
const type = require('./controllers/type');
const locations = require('./controllers/locations');
const velocity = require('./controllers/velocity');

const { rolesPermission } = require('./config');

const uploadimage = require('./lib/uploadImage');

const checkRoles = permission => (req, res, next) => {
  if (!req.user) throw new Error('no user');
  if (!rolesPermission.roles[req.user.roleID]) throw new Error('no permission');
  if (rolesPermission.roles[req.user.roleID].permissions.includes(permission)) {
    next();
  } else {
    throw new Error('fail permission');
  }
};

router
  .get('/', (req, res) => res.sendFile('index.html', { root: path.join(__dirname, './') }))
  .get('/test', (req, res) => res.sendFile('test.html', { root: path.join(__dirname, './') }));

router
  .post('/users/login/web', user.loginweb) // DOING
  .post('/users/register', user.register) // DOING
// PLANNER
  .get('/mrp', checkRoles(1), timeline.mrp) // DOING
  .get('/planner', checkRoles(2), timeline.planner) // DOING
  .get('/timelines', checkRoles(1), timeline.get) // DONE

  .post('/plans', checkRoles(2), timeline.getPlans)
  .put('/plans/adddriver', checkRoles(2), timeline.addDriverToPlan)
  .put('/plans/removedriver', checkRoles(2), timeline.removeDriverFromPlan)
  .patch('/plans/orderchangeplan', checkRoles(2), timeline.orderChangePlan)

// Plan Orders
  .patch('/orders/:id/changeplan', checkRoles(2), order.changePlan)

// Order Driver
  .post('/orders/driver', checkRoles(2), order.addOrderDriver)

// Order Status
  .get('/orders/:orderID/status', checkRoles(1), order.getStatus) // TESTING
  .get('/orders/status', checkRoles(1), order.getAllStatus) // TESTING
  .patch('/orders/:orderID/status', checkRoles(6), order.escalateOrderStatus) // TESTING

// Order Estimate
  .patch('/orders/:id/estimate', checkRoles(2), order.updateEstimate)

// Orders
  .get('/orders/:orderID?', checkRoles(1), order.get) // DONE
  .post('/orders', checkRoles(1), order.post) // TESTING
  .patch('/orders/:id', checkRoles(1), order.update) // TESTING

// Driver Location
  .get('/drivers/:driverID/locations', checkRoles(1), driver.getLocations)
  .post('/drivers/:driverID/location', checkRoles(6), driver.addLocation)
  .put('/drivers/:driverID/pickup', checkRoles(6), driver.pickupOrder)
  .put('/drivers/:driverID/drop', checkRoles(6), driver.dropOrder)

// Drivers
  .get('/drivers/:id?', checkRoles(1), driver.get) // DONE
  .post('/drivers', uploadimage, checkRoles(4), driver.post) // DONE
  .patch('/drivers/:id?', uploadimage, checkRoles(4), driver.update) // DONE
  .patch('/drivers/:id/activate', checkRoles(4), driver.activate) // DONE
  .delete('/drivers/:id?', checkRoles(99), driver.del) // DONE

// Cars
  .get('/cars/:id?', checkRoles(1), car.get) // DONE
  .post('/cars', uploadimage, checkRoles(4), car.post) // DONE
  .patch('/cars/:id?', uploadimage, checkRoles(4), car.update) // DONE
  .delete('/cars/:id?', checkRoles(99), car.del) // DONE

// Type of Location
  .get('/types/category/:categoryID', checkRoles(0), type.getTypes) // TESTING

// Locations
  .get('/locations/:id?', checkRoles(1), locations.get) // DONE
  .post('/locations', checkRoles(4), locations.post) // DONE
  .patch('/locations/:id?', checkRoles(4), locations.update) // DONE
  .delete('/locations/:id?', checkRoles(4), locations.del) // DONE

// Locations
  .get('/velocities', checkRoles(4), velocity.get) // DOING
  .patch('/velocities', checkRoles(4), velocity.update) // DOING

// TEST
  .post('/uploadroute', multer({
    storage: multer.diskStorage({
      destination: (req, res, next) => {
        next(null, path.join(__dirname, './public/uploads'));
      },
      filename: (req, file, next) => {
        next(null, file.originalname);
      },
    }),
  }).single('exel'), test.uploadroute) // DONE
  .post('/ordermockup', test.ordermockup) // DONE
  .delete('/clearorders', test.clearorders); // DONE


module.exports = router;
