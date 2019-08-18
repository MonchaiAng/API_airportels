const _ = require('lodash');
const moment = require('moment');
const { Op } = require('sequelize');
const {
  Plans, PlanOrders, Orders, Places, PlaceTypes, OrderStatuses, Drivers, Cars, PlanLocations,
} = require('../../models');


const Consolidation = (planId) => {
  console.log('CONSTRUCTOR CONSOLIDATION');
  return {
    plans: [],
    async start() {
      console.log('START');
      const orders = await getDriverPlanByPlanId(planId);
      const sortedOrders = await sortOrderDESByType(orders);
      const orderADESAirport = await getRealArrivingTimeOfOrderADESAirport(sortedOrders);
      const orderBeforeADESAirport = await getNCLBeforeOrderADESAirport(sortedOrders);
      const allPlans = await getAllPlans('2019-04-05T09:00:00.000Z');
      const driversSameRouteList = await getDriversSameRouteList(allPlans, orderADESAirport.placeId);

      console.log(sortedOrders);
      console.log('AIRPORT DESTINATION:', orderADESAirport.placeId);
      console.log('Order A DES(AIRPORT):', orderADESAirport);
      console.log('Order Before A DES(AIRPORT):', orderBeforeADESAirport);
      // console.log("all plans:", allPlans);
      console.log('Plan same route :', driversSameRouteList.length, 'order(s)');
      const planList = driversSameRouteList.map(plan => ({ planId: plan.dataValues.id, driverId: plan.dataValues.driverId }));
      console.log('Plan List: ', planList);
      console.log(`plan id ${planList[0].planId }:`, await calculateNumberOfLuggage(planList[0].planId, planList[0].driverId));
    },
  };
};

// console.log(conso);

const getPlansAreDelivering = async () => {
  const plans = await Plans({ // ต้องหา plans ที่มี order เวลาปัจจุบันอยู่ระหว่างการขนส่ง (collectingTime กับ embarkingTime)
    include: [
      {
        model: PlanOrders,
      },
    ],
  });
  return plans.toJson();
};

const driverID = 1;
const carCapacity = 25;

const getRealArrivingTimeOfOrderADESAirport = async (plan) => {
  const orderZ = { ...plan[plan.length - 1] };

  const orderADESAirport = {
    ...plan.find(order => order.placeId === orderZ.placeId
                                                  && order.type === 'DES'
                                                  && order.placeType === 'AIRPORT'
                                                  && order.status === 'DELIVERING'),
  };
  return orderADESAirport;
};

const getNCLBeforeOrderADESAirport = async (plan) => {
  let orderBeforeOrderADESAirportList = [...plan.filter(order => order.status === 'DELIVERING'
                                                                  && order.placeType !== 'AIRPORT')];
  orderBeforeOrderADESAirportList = _.orderBy(orderBeforeOrderADESAirportList, ['collectingTime'], ['ASC']);

  const orderBeforeOrderADESAirport = orderBeforeOrderADESAirportList[orderBeforeOrderADESAirportList.length - 1];

  if (orderBeforeOrderADESAirportList.length > 0) {
    return { ...orderBeforeOrderADESAirport };
  } else {
    return null;
  }
};

const sortOrderDESByType = async (plan) => {
  const irpORI = [...plan.filter(order => order.type === 'ORI')];
  const irpDES = [...plan.filter(order => order.type === 'DES')];
  const irpDESDelivered = [...irpDES.filter(order => order.status === 'DELIVERED')]; // also des
  let irpDESDelivering = [...irpDES.filter(order => order.status === 'DELIVERING')]; // also des
  irpDESDelivering = _.orderBy(irpDESDelivering, ['arrivingTime'], ['ASC']);
  const tempIRP = [
    ...irpORI,
    ...irpDESDelivered,
    ...irpDESDelivering.filter(order => order.placeType !== 'AIRPORT'),
    ...irpDESDelivering.filter(order => order.placeType === 'AIRPORT'),
  ];
  return tempIRP;
};

const getDriverPlanByPlanId = async (planID) => {
  const plan = await Plans.findOne({
    where: {
      id: planID,
    },
    include: [
      {
        model: PlanLocations,
        include: [
          {
            model: Orders,
            as: 'order',
            include: [{
              model: OrderStatuses,
              as: 'statusData',
            }],
          },
          {
            model: Places,
            as: 'place',
            include: [{
              model: PlaceTypes,
              as: 'type',
            }],
          },
        ],
      }],
  });


  const orders = mapOrderLocations(plan.plan_locations);

  return orders;
};

const getdriverCarCapicity = async (driverId) => {
  const driverDetails = await Drivers.findOne({
    where: {
      id: driverId,
    },
    include: [{
      model: Cars,
    }],
  });
  return driverDetails.dataValues.car.dataValues.carCapacity;
};

const getAllPlans = async (time) => {
  let plans = await Plans.findAll({
    where: {
      createdAt: { [Op.gte]: moment(time).toDate() },
    },
    include: [
      {
        model: PlanLocations,
        include: [
          {
            model: Orders,
            as: 'order',
            include: [{
              model: OrderStatuses,
              as: 'statusData',
            }],
          },
          {
            model: Places,
            as: 'place',
            include: [{
              model: PlaceTypes,
              as: 'type',
            }],
          },
        ],
      }],
  });

  plans = plans.map((plan) => {
    return {
      ...plan,
      order: mapOrderLocations(plan.plan_locations),
    };
  });

  return plans;
};

const checkPlanAlsoSameOrderZDES = async (orders, placeId) => {
  const checkingOrders = [...orders.filter(order => (
    order.type === 'DES'
    && order.placeType === 'AIRPORT'
    && order.placeId === placeId
    && order.status === 'DELIVERING'))];
  return checkingOrders.length > 0;
};

const getDriversSameRouteList = async (plans, placeId) => {
  return [...plans.filter(async (plan) => {
    const checkingOrders = await checkPlanAlsoSameOrderZDES(plan.order, placeId);
    return checkingOrders;
  })];
};

// const getAllorderCLfrom


const conso = Consolidation(1);
conso.start();

const calculateNumberOfLuggage = async (planId, driverId) => {
  let numberOfLuggage = 0;
  const orders = await getDriverPlanByPlanId(planId);
  const ordersORI = [...orders.filter(order => order.type === 'ORI' && order.status === 'DELIVERING')];
  ordersORI.map((order) => { numberOfLuggage += order.numberOfLuggage; });
  const carCapacity = await getdriverCarCapicity(driverId);
  return {
    planId, driverId, currentLuggage: numberOfLuggage, carCapacity,
  };
};

const mapOrderLocations = (locations) => {
  return locations.reduce((result, location) => {
    return [...result, {
      id: location.order.id,
      planId: location.planId,
      type: location.type,
      arrivingTime: moment(location.arrivingTime).toDate(),
      realArrivingTime: moment(location.order.arrivingTime).toDate(),
      code: location.order.code,
      numberOfLuggage: location.order.numberOfLuggage,
      placeId: location.placeId,
      time: moment(location.collectingTime).toDate(),
      latitude: location.place.latitude,
      longitude: location.place.longitude,
      collectingTime: moment(location.collectingTime).toDate(),
      transportationTime: null,
      placeType: location.place.type.type,
      status: location.order.statusData.status,
      placeName: location.place.name,
    }];
  }, []);
};
