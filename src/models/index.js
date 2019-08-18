'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(`${__dirname  }/../config/config.json`)[env];
const db = {};

config.logging = false;
config.operatorsAliases = false;

config.define = {
  charset: 'utf8',
  collate: 'utf8_general_ci',
};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config,
  );
}

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
    );
  })
  .forEach((file) => {
    const model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.Users = require('./users')(sequelize, Sequelize);
db.UserAuthentications = require('./user_authentications')(
  sequelize,
  Sequelize,
);
db.Roles = require('./roles')(sequelize, Sequelize);

db.Orders = require('./orders')(sequelize, Sequelize);
db.OrderStatuses = require('./order_statuses')(sequelize, Sequelize);
db.Places = require('./places')(sequelize, Sequelize);
db.PlaceTypes = require('./place_types')(sequelize, Sequelize);
db.Drivers = require('./drivers')(sequelize, Sequelize);
db.DriverAuthentications = require('./driver_authentications')(sequelize, Sequelize);
db.Cars = require('./cars')(sequelize, Sequelize);
db.DriverBankings = require('./driver_bankings')(sequelize, Sequelize);
db.DriverRankings = require('./driver_rankings')(sequelize, Sequelize);
db.Banks = require('./banks')(sequelize, Sequelize);
db.Companies = require('./companies')(sequelize, Sequelize);
db.Plans = require('./plans')(sequelize, Sequelize);
db.PlanOrders = require('./plan_orders')(sequelize, Sequelize);
db.PlanLocations = require('./plan_locations')(sequelize, Sequelize);
db.Routes = require('./routes')(sequelize, Sequelize);
db.GGRoutes = require('./gg_routes')(sequelize, Sequelize);
db.HistoricRoutes = require('./historic_routes')(sequelize, Sequelize);
db.Schedules = require('./schedules')(sequelize, Sequelize);
db.Consolidations = require("./consolidations")(sequelize, Sequelize);
db.ConsolidationDetails = require("./consolidation_details")(sequelize, Sequelize);

db.Plans.hasMany(db.PlanLocations);

db.PlanLocations.belongsTo(db.Places, {
  foreignKey: 'placeId',
  targetKey: 'placeId',
  as: 'place',
});
db.PlanLocations.belongsTo(db.Orders);
db.PlanLocations.belongsTo(db.Plans);

db.Plans.belongsToMany(db.Orders, {
  through: db.PlanOrders,
  as: 'order',
});
db.Orders.belongsToMany(db.Plans, {
  through: db.PlanOrders,
  as: 'plan',
});
db.Plans.hasMany(db.PlanOrders);
db.Plans.belongsTo(db.Drivers);

db.Orders.belongsTo(db.Places, {
  foreignKey: 'originPlaceId',
  targetKey: 'placeId',
  as: 'originPlace',
});

db.GGRoutes.belongsTo(db.Routes, {
  foreignKey: "routeId",
  targetKey: "id",
  as: "route"
});


db.GGRoutes.belongsTo(db.Schedules, {
  foreignKey: "scheduleId",
  targetKey: "id",
  as: "schedule"
});

db.HistoricRoutes.belongsTo(db.Routes, {
  foreignKey: "routeId",
  targetKey: "id",
  as: "route"
});
db.HistoricRoutes.belongsTo(db.Schedules, {
  foreignKey: "scheduleId",
  targetKey: "id",
  as: "schedule"
});
db.HistoricRoutes.belongsTo(db.Drivers, {
  foreignKey: "driverId",
  targetKey: "id",
  as: "driver"
});

db.Orders.belongsTo(db.Places, {
  foreignKey: 'destinationPlaceId',
  targetKey: 'placeId',
  as: 'destinationPlace',
});
db.Orders.belongsTo(db.OrderStatuses, {
  foreignKey: 'status',
  as: 'statusData',
});

db.Places.belongsTo(db.PlaceTypes, {
  foreignKey: 'typeId',
  as: 'type',
});


db.Routes.belongsTo(db.Places, {
  foreignKey: "oriPlaceId",
  targetKey: "placeId",
  as: "originPlace"
});

db.Routes.belongsTo(db.Places, {
  foreignKey: "desPlaceId",
  targetKey: "placeId",
  as: "destinationPlace"
});

db.Users.belongsTo(db.Roles);

db.Drivers.belongsTo(db.Cars);
db.Drivers.hasMany(db.DriverBankings);
db.Drivers.belongsTo(db.DriverRankings, { foreignKey: 'rankingId' });

db.Cars.belongsTo(db.Companies);
db.Cars.belongsTo(db.Users, { foreignKey: 'updatedBy', as: 'updateBy' });
db.Cars.belongsTo(db.Users, { foreignKey: 'createdBy', as: 'createBy' });

db.Consolidations.belongsTo(db.Plans, {
  foreignKey: "fromPlanId",
  targetKey: "id",
  as: "consolidateFromPlan"
});


db.Consolidations.belongsTo(db.Plans, {
  foreignKey: "toPlanId",
  targetKey: "id",
  as: "consolidateToPlan"
});

db.Consolidations.belongsTo(db.Places, {
  foreignKey: 'placeId',
  targetKey: 'placeId',
  as: 'place',
});

db.ConsolidationDetails.belongsTo(db.Orders);
db.ConsolidationDetails.hasMany(db.Consolidations);

db.DriverBankings.belongsTo(db.Banks, { foreignKey: 'bankId' });

db.PlanComments = require('./plan_comments')(sequelize, Sequelize);

db.PlanComments.belongsTo(db.Plans);

db.PlanComments.belongsTo(db.Users, {
  foreignKey: 'updatedBy',
  as: 'updateBy',
});
db.PlanComments.belongsTo(db.Users, {
  foreignKey: 'createdBy',
  as: 'createBy',
});

db.NotificationTypes = require('./notification_types')(sequelize, Sequelize);

db.NotificationFilters = require('./notification_filters')(
  sequelize,
  Sequelize,
);

db.NotificationFilters.belongsTo(db.NotificationTypes, {
  foreignKey: 'notificationId',
});
db.NotificationFilters.belongsTo(db.Users, { foreignKey: 'userId' });

module.exports = db;
