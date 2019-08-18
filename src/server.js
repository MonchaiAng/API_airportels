const path = require('path');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const moment = require('moment');
const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const rfs = require('rotating-file-stream');
const socket = require('./socket');

const Router = require('./router/index');
// const cacheHelper = require('./helpers/cacheHelper');
// const apiSocketHelper = require('./helpers/apiSocketHelper');

dotenv.config({
  path: path.join(__dirname, '../.env'),
});

// const accessLogStream = rfs('access.log', {
//   interval: '1m', // rotate daily (m = minutes)
//   path: path.join(__dirname, '../log'),
//   compress: 'gzip',
// });

morgan.token('customLog', (req, _, arg) => (arg ? (req.customLog[arg] || null) : (typeof req.customLog !== 'object' ? req.customLog : null)));

const app = express();

app
  // .use(morgan('combined'))
  .use('/public', express.static(path.join(__dirname, '../public')))
  .use(cors())
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .use('/api/v1', Router);
const env = process.env.NODE_ENV || 'undefined';

const server = http.createServer(app).listen(process.env.PORT, process.env.HOST, async () => {
  console.clear();
  socket.initialize(server);
  // cacheHelper.initCache();
  console.log(`[${moment.utc().format('YYYY-MM-DD HH:mm:ss')}] START SERVER ON ${env.toUpperCase()} MODE AT PORT ${process.env.PORT}`);
});
