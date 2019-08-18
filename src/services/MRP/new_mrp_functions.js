const _ = require("lodash");
const moment = require("moment");
const sequelize = require("sequelize");
const {Orders, Drivers, Cars, Places, PlaceTypes, Plans, PlanLocations} = require("../../models");
const io = require("../../socket");
const { getDistanceMatrix } = require("../../helpers/googleMap");
const {timeZoneDiff, testDiffDay} = require("../../config");
const {Op} = sequelize;

const calculatingOrders = null;

const getDuration = async ({
    origin,
    destination,
    arrivalTime,
    departureTime,
  }) => {
    let duration = 0;
    if (origin.latitude !== destination.latitude || origin.longitude !== destination.longitude) {
      const distance = await getDistanceMatrix({
        origin,
        destination,
        arrivalTime,
        departureTime,
      });
      if (distance.data) {
        duration = distance.data.duration.value;
        if (distance.data.duration_in_traffic != null) {
          duration += distance.data.duration_in_traffic.value;
        }
      } else {
        console.log('ERROR GET DURATION', distance, origin, destination);
        return 3000;
      }
      return duration;
    }
    return duration;
  };

  async function startProcess() {
    console.log('Processing . . .');
    io.emit('MRP', { message: 'PROCESSING', isProcessing: true });
    this.calculatingOrders = await getCalculatingOrders();
    this.calculatingOrders = [...this.calculatingOrders.filter(order => order.originPlace.type.type !== 'AIRPORT')];
    this.spotList = this.calculatingOrders.map((order) => {
      order.type = 'ORI';
      order.placeId = order.originPlace.placeId;
      order.latitude = order.originPlace.latitude;
      order.longitude = order.originPlace.longitude;
      order.time = moment(order.dropTime).toDate();
      order.placeType = order.originPlace.type.type;
      order.collectingTime = null;
      order.transportationTime = null;
      order.status = 'COLLECTING';
      order.placeName = order.originPlace.name;
      order.realArrivingTime = moment(order.arrivingTime).toDate();

      return _.pick(order, ['id', 'type', 'arrivingTime',
        'code', 'numberOfLuggage', 'placeId',
        'time', 'latitude', 'longitude',
        'collectingTime', 'transportationTime',
        'placeType', 'status', 'realArrivingTime', 'placeName']);
    });
    this.tempOrderList = [...this.spotList];

    this.processFirstRun();
  }

