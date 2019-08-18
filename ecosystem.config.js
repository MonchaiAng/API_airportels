module.exports = {
  apps: [{
    name: 'Airportels Production',
    script: './src/server.js',
    watch: true,
    env: {
      NODE_ENV: 'development',
    },
    env_production: {
      NODE_ENV: 'production',
    },
  }],
};
