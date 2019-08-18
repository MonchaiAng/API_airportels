
const Sequelize = require('sequelize');
const sequelize = require('./connect');

const Velocities = sequelize.define('velocities', {
  velocityID: {
    type: Sequelize.STRING, // month_day_type
    primaryKey: true,
  },
  month: {
    type: Sequelize.INTEGER,
    validate: {
      isIn: {
        args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]],
        msg: 'Month should be 1 - 12',
      },
    },
    allowNull: false,
  },
  day: {
    type: Sequelize.INTEGER,
    validate: {
      isIn: {
        args: [[1, 2, 3, 4, 5, 6, 7]],
        msg: 'Day should be 1 - 7',
      },
    },
    allowNull: false,
  },
  type: {
    type: Sequelize.STRING,
    validate: {
      isIn: {
        args: [['intown', 'long']],
        msg: 'type should be intown or long',
      },
    },
    allowNull: false,
  },
  q1: {
    type: Sequelize.INTEGER,
    validate: {
      isInt: 'q1 should be Integer',
    },
    defaultValue: 23,
  },
  q2: {
    type: Sequelize.INTEGER,
    validate: {
      isInt: 'q2 should be Integer',
    },
    defaultValue: 23,
  },
  q3: {
    type: Sequelize.INTEGER,
    validate: {
      isInt: 'q3 should be Integer',
    },
    defaultValue: 23,
  },
  q4: {
    type: Sequelize.INTEGER,
    validate: {
      isInt: 'q4 should be Integer',
    },
    defaultValue: 23,
  },
  q5: {
    type: Sequelize.INTEGER,
    validate: {
      isInt: 'q5 should be Integer',
    },
    defaultValue: 23,
  },
  updatedAt: {
    type: Sequelize.DATE,
  },
});

module.exports = Velocities;
