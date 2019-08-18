const config = {
  development: {
    hostWeb: 'http://localhost:5555',
    timeZoneDiff: 7,
  },
  production: {
    hostWeb: 'http://128.199.204.164:8880',
    timeZoneDiff: 0,
  },
};

module.exports = {
  hostWeb: 'http://localhost:5555',
  timeZoneDiff: 7,
  testDiffDay: -75,
  ...config[process.env.NODE_ENV],
};
