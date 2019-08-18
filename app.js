const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ip = require('ip');
const color = require('colors-cli');
const path = require('path');
const jwt = require('express-jwt');
const moment = require('moment');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const router = require('./routers');
const { datetimeFormat } = require('./lib');

const {
  mongoDBUri,
  port,
  secret,
} = require('./config');

mongoose.connect(mongoDBUri);
const db = mongoose.connection;
db.once('open', () => console.log(`connected mongodb ${mongoDBUri}`));

const allowCrossDomain = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Methods',
    'GET,HEAD,OPTIONS,POST,PUT,PATCH,DELETE',
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CIC-Content-Type',
  );
  next();
};

const auth0 = jwt({ secret }).unless({
  path: [
    '/users/login/web',
    '/users/register',
    '/test',
    '/',

    '/uploadroute',
    '/ordermockup',
    '/clearorders',
    new RegExp('/public.*/', 'i'),
  ],
});


const resIO = (req, res, next) => {
  res.io = io;
  next();
};
const handleError = (err, req, res, next) => {
  console.log(color.red(err.message));
  res.status(400).json({
    ok: false,
    message: err.message,
    next,
  });
};
io.on('connection', require('./socketManager'));

app
  .use('/public', express.static(path.join(__dirname, 'public')))
  .use(bodyParser.json())
  .use(allowCrossDomain)
  .use(resIO)
  .use((req, res, next) => {
    console.log(
      color.cyan_bt(req.method),
      req.originalUrl,
      color.cyan(moment().format(datetimeFormat)),
    );
    next();
  })
  .use('/', auth0, router)
  .use(handleError);

server.listen(port, () => {
  console.log(__dirname, '/public');
  console.log(`connected port ${port} is port`);
  console.log(`ip address ${ip.address()}`);
});
