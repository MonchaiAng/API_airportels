const _ = require('lodash');
const moment = require('moment');
const sequelize = require('sequelize');
const {
  Orders,
  Drivers,
  Cars,
  Places,
  PlaceTypes,
  Plans,
  PlanOrders,
  PlanLocations,
  Routes,
  GGRoutes,
  Schedules,
  HistoricRoutes,
  ConsolidationDetails,
  Consolidations
} = require('../../models');

const io = require('../../socket');

const { getDistanceMatrix, getLocationData, getPlaceData } = require('../../helpers/googleMap');
const { timeZoneDiff, testDiffDay } = require('../../config');

const { Op } = sequelize;

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
      // console.log(distance.data.duration_in_traffic);
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

class IRP {
  constructor() {
    this.startRunning = moment().format("HH:mm:ss");
    this.stopRunning = null;

    this.type = null;

    this.orderN = null;
    this.orderNDES = null;

    this.plan = null;
    this.calculatingOrders = [];
    this.spotList = []; // copy all orders and refference those orders by type "ORI"/ "DES"
    this.tempOrderList = []; // sturcture is as same as SPOT List // A copy of SPOT List

    this.IRPList = []; // list of N Order that is selected
    this.tempIRPList = [];
    this.IRPLocationList = []; // list of locations order in IRP in sequence

    this.driver =  null;
    this.driverLocation = null; // { latitude, longitude }
    this.driverStartPlaceId = null;

    this.currentCarCap = 0;

    this.collectingTime = null;
    this.arrivingTimeOfIRP = null;

    this.error = null;

    this.filterAnotherAirport = false;
    this.finishedNotDropYet = false;
    this.endIRPProcess = false;

    // this path is for refreshment function
    this.newOrderORI = null;
    this.newOrderDES = null;

    this.newOrderInsideIRP = false;
    this.refreshmentData = null;

    this.consolidationIsChecked = false;
    this.consolidationIsAvailable = false; //check it can be consolidated.
    this.consolidationPlanDetails = null;
    this.consolidateCL = null;
    this.consolidateCLs = null;
    this.consolidationInCDriverIncludeADriverDES = null;
  }

  async initailStart({
    type, driver, driverLocation, time,
  }) {
    this.type = type || null;
    this.driver = driver || null;
    this.driverLocation = driverLocation || null;
    this.startTime = moment(`${moment()
      .add(testDiffDay, 'days')
      .format('YYYY-MM-DD')}T${time || '09:00'}:00.000Z`).toDate();
  }

  async startProcess() {
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
      order.possibleCollectingTime = null;
      order.possibleArrivingTime = null;
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

  async processFirstRun() {
    if (!this.driverLocation) {
      this.driverLocation = {
        latitude: this.driver.latitude,
        longitude: this.driver.longitude,
      };
    }
    if (this.driver) {
      this.currentCarCap = this.driver.car.carCapacity;
    }
    
    const driverPlaceId = await this.getPlaceIdByLatLng(this.driverLocation.latitude, this.driverLocation.longitude);
    this.driverStartPlaceId = driverPlaceId;
    await this.getAllOrdersTransportations(driverPlaceId, moment(this.startTime).toDate());

    while (this.tempOrderList.length !== 0) {
      this.tempOrderList = _.orderBy(
        this.tempOrderList, 
        ["possibleCollectingTime"], 
        ["ASC"]
      );

      await this.orderNSmartImproveConsiderationRun1();
      //this.orderN = { ...this.tempOrderList[0] };
      await this.createNOrderDES();

      this.collectingTime = moment(this.startTime).add(this.orderN.transportationTime, 'seconds').toDate();
      const orderADES = { ...this.orderNDES };

      const LTOforderNToOrderADES = await this.getSmartDuration(this.orderN.placeId, orderADES.placeId, moment(this.collectingTime).toDate());
      
      if (this.orderN.numberOfLuggage > this.currentCarCap) {
        await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
        continue;
      }
      
      await this.updateCollectingTime();

      if (moment(this.orderN.arrivingTime).toDate() < moment(this.collectingTime).add(LTOforderNToOrderADES, 'seconds').toDate()) {
        this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
        continue;
      }
      
      await this.takeNOrderToIRP();

      this.arrivingTimeOfIRP = moment(this.orderN.arrivingTime).toDate();
      if (this.currentCarCap > 0) {
        await this.processSecondRun();
        return;
      } else if (this.orderNDES.placeType === 'AIRPORT') {
        await this.endProcess();
        return;
      } else {
        this.driverLocation = {
          latitude: this.orderNDES.latitude,
          longitude: this.orderNDES.longitude,
          placeId: this.orderNDES.placeId
        };
        await this.processSecondRun();
        return;
      }
    }
    await this.endProcess();
  }

  async processSecondRun() {
    
    //console.log("orderN:", this.orderN);
    if (this.endIRPProcess === false) { //The default is 'false'
      this.tempOrderList = [...this.spotList];
      this.tempIRPList = [...this.IRPList];
    }

    while (this.tempOrderList.length !== 0) {
      
      // const checkComeIn = [...this.IRPLocationList.filter(order => order.id === 2 && order.type === "DES")];
      // if(checkComeIn.length > 0 || checkComeIn !== undefined){
      //   console.log("IRP LOCA List:", this.IRPLocationList);
      // }
      const orderZ = await this.findOrderZDES();
      const previousOrder = await this.findPreviousOrder();
      
      await this.getAllOrdersTransportations(previousOrder.placeId, moment(previousOrder.collectingTime).toDate());
      
      this.tempOrderList = _.orderBy(
        this.tempOrderList,
        ['possibleCollectingTime', 'transportationTime'],
        ['ASC', 'ASC'],
      );

      const tempOrderListORI = [...this.tempOrderList.filter(order => order.type === "ORI")];
      const tempOrderListDES = [...this.tempOrderList.filter(order => order.type === "DES")];
      const tempOrderListDESAirport = [...tempOrderListDES.filter(order => order.type === "DES" && order.placeType === "AIRPORT")];
      const tempOrderListDESNotAirport = [...tempOrderListDES.filter(order => order.type === "DES" && order.placeType !== "AIRPORT")];
      const newTempOrderListNoDESAirport = [...tempOrderListORI, ...tempOrderListDESNotAirport];

      const sortedNewTempOrderListNoDESAirport = _.orderBy(
        newTempOrderListNoDESAirport,
        ['possibleCollectingTime', 'transportationTime'],
        ['ASC', 'ASC']
      );

      const sortedNewTempOrderListDESAirport = _.orderBy(
        tempOrderListDESAirport,
        ['possibleCollectingTime', 'transportationTime'],
        ['ASC', 'ASC']
      );

      this.tempOrderList = [...sortedNewTempOrderListNoDESAirport, ...sortedNewTempOrderListDESAirport];
      
      const checkContinue = await this.orderNSmartImproveConsiderationRunRefresh();
      
      if(checkContinue === false){
        await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
        continue;
      }

      await this.createNOrderDES();
      if (this.orderN.type === 'ORI') {
        //console.log(" === Collect case ===");
        const dropTime = moment(this.orderN.time).toDate();
        this.arrivingTime = moment(this.orderN.arrivingTime).toDate();

        const TTPreviousOrderToOrderN = await this.getSmartDuration(previousOrder.placeId, this.orderN.placeId, moment(previousOrder.collectingTime).toDate());
        

        if(moment(previousOrder.collectingTime).add(TTPreviousOrderToOrderN, 'seconds').toDate() > moment(this.orderN.time).toDate()){
          this.orderN.collectingTime = moment(previousOrder.collectingTime).add(TTPreviousOrderToOrderN, 'seconds').toDate();
        }else{
          this.orderN.collectingTime = moment(this.orderN.time).toDate();
        }

        this.collectingTime = this.orderN.collectingTime;

        if (this.orderN.numberOfLuggage <= this.currentCarCap) {
          await this.createNOrderDES();
        
          if (this.orderNDES.placeType === 'AIRPORT') {
            if (orderZ !== null) {
              if (orderZ.placeType === 'AIRPORT') {
                
                if (orderZ.placeId === this.orderNDES.placeId) {
                  
                  if (moment(this.orderNDES.arrivingTime).toDate() >= moment(orderZ.arrivingTime).toDate()) {
                    const orderADES = await this.findOrderADES();
                    const LTofOrderNToOrderADES = await this.getSmartDuration(this.orderN.placeId, orderADES.placeId, moment(this.collectingTime).toDate());

                    if (moment(orderADES.arrivingTime).toDate() > moment(this.collectingTime).add(LTofOrderNToOrderADES, 'seconds').toDate()) {
                      //console.log("Get order because of AT");
                      await this.takeNOrderToIRP();
                      await this.sortTempDESByPlaceTypeAndAT();
                      await this.sortDESByPlaceTypeAndAT();
                      await this.processSecondRun();
                      return;
                    } else {
                      //console.log("Failed because of AT");
                      await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
                      continue;
                    }
                  } else {
                    this.updateTempIRPListAT();
                    this.sortTempDESByPlaceTypeAndAT();
                    await this.updateNewATForBeforeCheckingAvailable();
                    
                    const result = await this.checkOrderNIsAvailable();
                    if (result === true) {
                      //console.log("Get order after change AT");
                      await this.updateCollectingTime();
                      await this.takeNOrderToIRP();
                      await this.sortDESByPlaceTypeAndAT();
                      await this.processSecondRun();
                      return;
                    } else {
                      //console.log("Failed because of AT after change AT");
                      this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
                      this.tempIRPList = [...this.tempIRPList.filter((order) => {
                        if (order.id === this.orderNDES.id && order.type === 'DES') {
                          return false;
                        } else {
                          return true;
                        }
                      })];
                      continue;
                    }
                  }
                } else {
                  //console.log("Failed because of not same Airport");
                  this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
                  continue;
                }
              } else {
                this.updateTempIRPListAT();
                this.sortTempDESByPlaceTypeAndAT();
                await this.updateNewATForBeforeCheckingAvailable();

                const result = await this.checkOrderNIsAvailable();
                if (result === true) {
                  //console.log("Get order After change AT");
                  this.updateCollectingTime();
                  await this.takeNOrderToIRP();
                  this.sortDESByPlaceTypeAndAT();
                  await this.processSecondRun();
                  return;
                } else {
                  console.log("Failed after change AT");
                  this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
                  continue;
                }
              }
            } else {
              return;
            }
          } else {
            const orderADES = await this.findOrderADES();
            if (moment(this.orderNDES.arrivingTime).toDate() < moment(orderADES.arrivingTime).toDate()) {
              const TTOrderNToOrderADES = await this.getSmartDuration(this.orderN.placeId, orderADES.placeId, moment(this.collectingTime).toDate());

              const diffOfAT = moment(orderADES.arrivingTime).diff(this.orderN.arrivingTime, 'seconds');
              if (TTOrderNToOrderADES >= diffOfAT) {
                this.orderNDES.arrivingTime = moment(this.orderNDES.arrivingTime).add(diffOfAT, 'seconds').toDate();
              }
              const LTOrderNToOrderADES = await this.getSmartDuration(this.orderN.placeId, orderADES.placeId, moment(this.collectingTime).toDate());
              
              if (moment(this.collectingTime).add(LTOrderNToOrderADES, 'seconds').toDate() >= moment(this.orderNDES.arrivingTime).toDate()) {
                this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
                continue;
              }

              this.tempIRPList.push(this.orderNDES);
              this.sortTempDESByPlaceTypeAndAT();
              this.updateCollectingTime();
              await this.takeNOrderToIRP();
              this.sortDESByPlaceTypeAndAT();
              await this.processSecondRun();
              return;
            } else {
              this.tempIRPList.push(this.orderNDES);
              this.sortTempDESByPlaceTypeAndAT();
              await this.updateNewATForBeforeCheckingAvailable();

              const result = await this.checkOrderNIsAvailable();
              if (result === true) {
                this.updateCollectingTime();
                await this.takeNOrderToIRP();
                this.sortDESByPlaceTypeAndAT();
                await this.processSecondRun();
                return;
              } else {
                this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
                continue;
              }
            }
          }
        } else {
          //console.log("Failed because Car Capacity is not enouph");
          await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
          continue;
        }
      } else {
        //console.log("=== drop off case ===");
        const destinationListNotAirportIsExist = await this.checkDESNotAirportIsExist();

        if(destinationListNotAirportIsExist === true){
          if(this.orderN.placeType === "AIRPORT"){
            await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "DES");
            continue;
          }else{
            //await this.printDetails(this.IRPList, "IRP List");
            const previousOrder = await this.findPreviousOrder();
            const TTPrevoiusOrderToOrderN = await this.getSmartDuration(previousOrder.placeId, this.orderN.placeId, moment(previousOrder.collectingTime).toDate());
            this.collectingTime = moment(previousOrder.collectingTime).add(TTPrevoiusOrderToOrderN, "seconds").toDate();

            await this.sortTempDESByPlaceTypeAndAT();
            const orderADES = await this.findOrderADES();
            await this.updateTempIRPOrderDESStatus(this.orderN.id, "DELIVERED");
            await this.updateNewATForBeforeCheckingAvailableDropoff();

            const tempOrderADES = {...this.tempIRPList.find(order => order.id === orderADES.id && order.type === "DES")};
            
            const result = await this.checkOrderNDESIsAvailableDropoff(tempOrderADES);
            
            if (result === false) {
              await this.updateTempIRPOrderDESStatus(this.orderN.id, "DELIVERING");
              await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "DES");
              continue;
            }else{
              this.currentCarCap =  this.currentCarCap + this.orderN.numberOfLuggage;
              this.orderN.collectingTime = moment(this.collectingTime).toDate();
              this.orderN.status =   "DELIVERED";
              await this.IRPLocationList.push(this.orderN);
              await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "DES");
              await this.removeNOrderByTypeFromSpotList(this.orderN.id, "DES");
              await this.updateIRPOrderDESStatus(this.orderN.id, "DELIVERED");
              await this.updateTempIRPOrderDESStatus(this.orderN.id, "DELIVERED");
              await this.processSecondRun();
              return;
            }
          }
          
        }else{
          
          const previousOrder = await this.findPreviousOrder();

          const TTPrevoiusOrderToOrderN = await this.getSmartDuration(previousOrder.placeId, this.orderN.placeId, moment(previousOrder.collectingTime).toDate());
          
          this.collectingTime = moment(previousOrder.collectingTime).add(TTPrevoiusOrderToOrderN, "seconds").toDate();

          this.sortTempDESByPlaceTypeAndAT();
          const orderADES = await this.findOrderADES();
          await this.updateTempIRPOrderDESStatus(this.orderN.id, "DELIVERED");
          //console.log("otderN", this.orderN);
          await this.updateNewATForBeforeCheckingAvailableDropoff();
          const tempOrderADES = {...this.tempIRPList.find(order => order.id === orderADES.id && order.type === "DES")};
          
          const result = await this.checkOrderNDESIsAvailableDropoff(tempOrderADES);

          
          if (result === false) {
            await this.updateTempIRPOrderDESStatus(this.orderN.id, "DELIVERING");
            await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "DES");
            continue;
          }else{
            this.currentCarCap =  this.currentCarCap + this.orderN.numberOfLuggage;
            this.orderN.collectingTime = moment(this.collectingTime).toDate();
            this.orderN.status = "DELIVERED";
            await this.IRPLocationList.push(this.orderN);
            await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "DES");
            await this.removeNOrderByTypeFromSpotList(this.orderN.id, "DES");

            await this.updateIRPOrderDESStatus(this.orderN.id, "DELIVERED");
            await this.updateTempIRPOrderDESStatus(this.orderN.id, "DELIVERED");
            
            if(this.orderN.placeType === "AIRPORT"){
              //make the first AIRPORT delivering (temp) //have to remove this
              await this.updateTempIRPOrderDESStatus(this.orderN.id, "DELIVERING");
              this.tempOrderList = [...this.tempIRPList.filter(order => 
                (order.status === "DELIVERING") && (order.id !== this.orderN.id))];

              if(this.consolidationIsChecked === false){
                await this.IRPConsolidationAdjustment();
                if(this.consolidationIsAvailable === true){
                  this.tempOrderList = [];
                  this.IRPLocationList = [...await this.IRPLocationList.filter(order => !(order.placeType === "AIRPORT" && order.type === "DES") )];
                  const lastLocationINIRP = this.IRPLocationList[this.IRPLocationList.length - 1];
                  await this.createConsolidateLocation(lastLocationINIRP.placeId, lastLocationINIRP.collectingTime);
                  let driverAPlanId = await this.endProcessConsolidation();
                  let driverCPlanId = this.consolidateCL.planId;
                  //setting C Driver IRP
                  this.IRPLocationList = [...this.consolidationInCDriverIncludeADriverDES];
                  //update CDriver IRP include A Driver LGs //delete all details and create new one
                  await this.updateDriversIRPConsolidate(driverCPlanId);
                  //insert consolidate details to database
                  await this.createConsolidateDetails(driverAPlanId, driverCPlanId);
                  return;
                }
              }
              
              if(this.consolidationIsAvailable === false){
                await this.updateTempIRPOrderDESStatus(this.orderN.id, "DELIVERED");
                if(this.tempOrderList.length === 0){
                  await this.endProcess();
                  return;
                }else{
                  this.endIRPProcess = true;
                  await this.processSecondRun();
                }
              }
            }else{
              await this.processSecondRun();
            }
            return;
          }
        }
      }
      this.endProcess();
      return;
    }
  }

  async createConsolidateDetails(driverAPlanId, driverCPlanId){

    this.consolidationPlanDetails = await Consolidations.create({
      fromPlanId: driverAPlanId,
      toPlanId: driverCPlanId,
      orderId: this.consolidateCL.orderId,
      collectingTime: this.consolidateCL.collectingTime,
      type: this.consolidateCL.type,
      placeId: this.consolidateCL.placeId
    });

    //console.log("this.consolidationPlanDetails", this.consolidationPlanDetails.id);

    await Promise.all(this.consolidateCLs.map(async order => {
      await ConsolidationDetails.create({
        consolidationId: this.consolidationPlanDetails.id,
        orderId: order.id,
        type: order.type
      });
    }));
  }

  async updateDriversIRPConsolidate(consolidatePlanId){

    if(this.IRPLocationList.length > 0) {
      const tempIRPLocationList = [...this.IRPLocationList];
      //find C Driver
      let previousPlanDetails = await Plans.findOne({
        where: {
          id: consolidatePlanId
        }
      });

      //destroy PlanLocation and update their details
      await PlanLocations.destroy({
        where: {
          planId: consolidatePlanId
        }
      });
      
      //destroy Plans and update their details
      await Plans.destroy({
        where: {
          id: consolidatePlanId
        }
      });

      this.plan = await Plans.create({
        id: consolidatePlanId,
        driverId: previousPlanDetails.driverId,
        updatedBy: 1, // manager id
        createdBy: 1, // manager id
        status: previousPlanDetails.status
      });

      const createOrders = [];
      tempIRPLocationList.forEach((order) => { 
        const orderIncludingDetails = {
          planId: this.plan.id,
          orderId: order.id,
          transportationTime: order.transportationTime,
          collectingTime: moment(order.collectingTime).toDate(),
          arrivingTime: moment(order.arrivingTime).toDate(),
          possibleCollectingTime: moment(order.possibleCollectingTime).toDate(),
          possibleArrivingTime: null,
          type: order.type,
          placeId: order.placeId
        };
        createOrders.push(orderIncludingDetails);
      });

      const createOrderList = [..._.orderBy(createOrders, ['collectingTime', 'arrivingTime'], ['ASC', 'ASC'])];
      
      await PlanLocations.bulkCreate(createOrderList);

      this.stopRunning = moment().format("HH:mm:ss");
      console.log("=======================================================");
      console.log("Driver ID:", this.driver.id);
      console.log("Driver Place ID:", this.driverStartPlaceId);
      console.log("Start Time:", moment.utc(this.startTime).format('MMMM Do YYYY, h:mm:ss a'));
      console.log("Latitude:", this.driver.latitude);
      console.log("Longitude:", this.driver.longitude);
      console.log("Plan ID:", this.plan.id);
      console.log("Running Time:", moment.utc(moment(this.stopRunning, "HH:mm:ss").diff(moment(this.startRunning, "HH:mm:ss"))).format("HH:mm:ss"));
      await this.printDetails(this.IRPLocationList, "IRP Location List");
      console.log("====================  more details ====================");
      console.log('IRPLocationList', this.IRPLocationList);
      console.log("=======================================================");
      
      io.emit('MRP', { message: 'PROCESSED', isProcessing: false, IRPLocationList: this.IRPLocationList });
      return;
    }
  }

  async createConsolidateLocation(lastLocationPlaceId, lastLocationCollectingTime){

    let latitude = null;
    let longitude = null;
    let placeType = null;
    let placeName = null;
    let time = null;
    let arrivingTime = null;

    let orderDetails = await Orders.findOne({
      include: [{
          model: Places,
          as: 'originPlace',
          include: [{ model: PlaceTypes, as: 'type' }],
        },
        {
          model: Places,
          as: 'destinationPlace',
          include: [{ model: PlaceTypes, as: 'type' }],
        }
      ],where:{ id: this.consolidateCL.id }
    }); 

    if(this.consolidateCL.type === "ORI"){
      latitude = orderDetails.originPlace.latitude;
      longitude = orderDetails.originPlace.longitude;
      placeType = orderDetails.originPlace.type.type;
      placeName = orderDetails.originPlace.name;
      time = orderDetails.dropTime;
      arrivingTime = orderDetails.arrivingTime;
    }else{
      latitude = orderDetails.destinationPlace.latitude;
      longitude = orderDetails.destinationPlace.longitude;
      placeType = orderDetails.destinationPlace.type.type;
      placeName = orderDetails.destinationPlace.name;
      time = orderDetails.pickupTime;
      arrivingTime = orderDetails.arrivingTime;
    }

    let TT = await this.getSmartDuration(lastLocationPlaceId, this.consolidateCL.placeId ,moment(lastLocationCollectingTime).toDate());
    const LT = moment(lastLocationCollectingTime).add(TT, "seconds").toDate();

    await Promise.all(this.consolidateCLs.map(async order => {
      this.IRPLocationList.push({
        id: order.id,
        arrivingTime: this.consolidateCL.arrivingTime,
        transportationTime: TT,
        collectingTime: LT,
        time: this.consolidateCL.collectingTime,
        placeId: this.consolidateCL.placeId,
        type: "DES",
        code: order.code,
        latitude: latitude,
        longitude: longitude,
        numberOfLuggage: order.numberOfLuggage,
        placeType: placeType,
        status: "DELIVERED",
        realArrivingTime: this.consolidateCL.arrivingTime,
        placeName: placeName,
        possibleCollectingTime: LT
      });
      TT = 0;
    }));
    
  }
  

  async initailStartRefreshment(selectedPlan) {

    //find the selected CL plan details
    let planLocationDetails = await PlanLocations.findOne({
      include: [{ model: Plans, include: [{ model: Drivers, include: [{ model: Cars }]}]}],
      where: { planId: selectedPlan.planId }
    });
    //Get refreshing plan details
    let refreshingPlanDetails = {
      planId: planLocationDetails.planId,
      driverId: planLocationDetails.plan.driverId,
      carCapacity: planLocationDetails.plan.driver.car.carCapacity,
      workingStatus: "WAITING"
    }

    this.currentCarCap = refreshingPlanDetails.carCapacity;
    this.driver = { id: refreshingPlanDetails.driverId }
    this.driverLocation = {latitude: "13.7287773", longitude: "100.5247112"};
    this.startTime = moment("2019-05-27T08:30:00").toDate(); //currentTime
  }

  async startProcessRefreshment() {
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
      order.possibleCollectingTime = null;
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
    await this.processFirstRunRefreshment();
  }

  async processFirstRunRefreshment() {
    if (!this.driverLocation) {
      this.driverLocation = {
        latitude: this.driver.latitude,
        longitude: this.driver.longitude,
      };
    }

    const driverPlaceId = await this.getPlaceIdByLatLng(this.driverLocation.latitude, this.driverLocation.longitude);
    this.driverStartPlaceId = driverPlaceId;
    await this.getAllOrdersTransportations(driverPlaceId, moment(this.startTime).toDate());

    while (this.tempOrderList.length !== 0) {
      this.tempOrderList = _.orderBy(
        this.tempOrderList, 
        ["possibleCollectingTime"], 
        ["ASC"]
      );

      await this.orderNSmartImproveConsiderationRun1();
      //this.orderN = { ...this.tempOrderList[0] };
      await this.createNOrderDES();

      this.collectingTime = moment(this.startTime).add(this.orderN.transportationTime, 'seconds').toDate();
      const orderADES = { ...this.orderNDES };

      const LTOforderNToOrderADES = await this.getSmartDuration(this.orderN.placeId, orderADES.placeId, moment(this.collectingTime).toDate());
      
      if (this.orderN.numberOfLuggage > this.currentCarCap) {
        await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
        continue;
      }
      
      await this.updateCollectingTime();

      if (moment(this.orderN.arrivingTime).toDate() < moment(this.collectingTime).add(LTOforderNToOrderADES, 'seconds').toDate()) {
        this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
        continue;
      }
      
      await this.takeNOrderToIRPRefreshment();

      this.arrivingTimeOfIRP = moment(this.orderN.arrivingTime).toDate();
      if (this.currentCarCap > 0) {
        await this.processSecondRunRefreshment();
        return;
      } else if (this.orderNDES.placeType === 'AIRPORT') {
        await this.endProcessAdjustment();
        return;
      } else {
        this.driverLocation = {
          latitude: this.orderNDES.latitude,
          longitude: this.orderNDES.longitude,
          placeId: this.orderNDES.placeId
        };
        await this.processSecondRunRefreshment();
        return;
      }
    }
    await this.endProcessAdjustment();
    return;
  }

  async processSecondRunRefreshment() {
    
    //console.log("orderN:", this.orderN);
    if (this.endIRPProcess === false) { //The default is 'false'
      this.tempOrderList = [...this.spotList];
      this.tempIRPList = [...this.IRPList];
    }

    while (this.tempOrderList.length !== 0) {

      const orderZ = await this.findOrderZDES();
      const previousOrder = await this.findPreviousOrder();
      
      await this.getAllOrdersTransportations(previousOrder.placeId, moment(previousOrder.collectingTime).toDate());
      
      this.tempOrderList = _.orderBy(
        this.tempOrderList,
        ['possibleCollectingTime', 'transportationTime'],
        ['ASC', 'ASC'],
      );

      const tempOrderListORI = [...this.tempOrderList.filter(order => order.type === "ORI")];
      const tempOrderListDES = [...this.tempOrderList.filter(order => order.type === "DES")];
      const tempOrderListDESAirport = [...tempOrderListDES.filter(order => order.type === "DES" && order.placeType === "AIRPORT")];
      const tempOrderListDESNotAirport = [...tempOrderListDES.filter(order => order.type === "DES" && order.placeType !== "AIRPORT")];
      const newTempOrderListNoDESAirport = [...tempOrderListORI, ...tempOrderListDESNotAirport];

      const sortedNewTempOrderListNoDESAirport = _.orderBy(
        newTempOrderListNoDESAirport,
        ['possibleCollectingTime', 'transportationTime'],
        ['ASC', 'ASC']
      );

      const sortedNewTempOrderListDESAirport = _.orderBy(
        tempOrderListDESAirport,
        ['possibleCollectingTime', 'transportationTime'],
        ['ASC', 'ASC']
      );

      this.tempOrderList = [...sortedNewTempOrderListNoDESAirport, ...sortedNewTempOrderListDESAirport];
      
      const checkContinue = await this.orderNSmartImproveConsiderationRunRefresh();
      
      if(checkContinue === false){
        await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
        continue;
      }

      await this.createNOrderDES();
      if (this.orderN.type === 'ORI') {
        //console.log(" === Collect case ===");
        const dropTime = moment(this.orderN.time).toDate();
        this.arrivingTime = moment(this.orderN.arrivingTime).toDate();

        const TTPreviousOrderToOrderN = await this.getSmartDuration(previousOrder.placeId, this.orderN.placeId, moment(previousOrder.collectingTime).toDate());
        

        if(moment(previousOrder.collectingTime).add(TTPreviousOrderToOrderN, 'seconds').toDate() > moment(this.orderN.time).toDate()){
          this.orderN.collectingTime = moment(previousOrder.collectingTime).add(TTPreviousOrderToOrderN, 'seconds').toDate();
        }else{
          this.orderN.collectingTime = moment(this.orderN.time).toDate();
        }

        this.collectingTime = this.orderN.collectingTime;

        if (this.orderN.numberOfLuggage <= this.currentCarCap) {
          await this.createNOrderDES();
        
          if (this.orderNDES.placeType === 'AIRPORT') {
            if (orderZ !== null) {
              if (orderZ.placeType === 'AIRPORT') {
                
                if (orderZ.placeId === this.orderNDES.placeId) {
                  
                  if (moment(this.orderNDES.arrivingTime).toDate() >= moment(orderZ.arrivingTime).toDate()) {
                    const orderADES = await this.findOrderADES();
                    const LTofOrderNToOrderADES = await this.getSmartDuration(this.orderN.placeId, orderADES.placeId, moment(this.collectingTime).toDate());

                    if (moment(orderADES.arrivingTime).toDate() > moment(this.collectingTime).add(LTofOrderNToOrderADES, 'seconds').toDate()) {
                      //console.log("Get order because of AT");
                      await this.takeNOrderToIRP();
                      await this.sortTempDESByPlaceTypeAndAT();
                      await this.sortDESByPlaceTypeAndAT();
                      await this.processSecondRunRefreshment();
                      return;
                    } else {
                      //console.log("Failed because of AT");
                      await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
                      continue;
                    }
                  } else {
                    await this.updateTempIRPListAT();
                    await this.sortTempDESByPlaceTypeAndAT();
                    await this.updateNewATForBeforeCheckingAvailable();
                    
                    const result = await this.checkOrderNIsAvailable();
                    if (result === true) {
                      //console.log("Get order after change AT");
                      await this.updateCollectingTime();
                      await this.takeNOrderToIRP();
                      await this.sortDESByPlaceTypeAndAT();
                      await this.processSecondRunRefreshment();
                      return;
                    } else {
                      console.log("Failed because of AT after change AT");
                      await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
                      this.tempIRPList = [...this.tempIRPList.filter((order) => {
                        if (order.id === this.orderNDES.id && order.type === 'DES') {
                          return false;
                        } else {
                          return true;
                        }
                      })];
                      continue;
                    }
                  }
                } else {
                  //console.log("Failed because of not same Airport");
                  await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
                  continue;
                }
              } else {
                await this.updateTempIRPListAT();
                await this.sortTempDESByPlaceTypeAndAT();
                await this.updateNewATForBeforeCheckingAvailable();

                const result = await this.checkOrderNIsAvailable();
                if (result === true) {
                  //console.log("Get order After change AT");
                  await this.updateCollectingTime();
                  await this.takeNOrderToIRP();
                  await this.sortDESByPlaceTypeAndAT();
                  await this.processSecondRunRefreshment();
                  return;
                } else {
                  //console.log("Failed after change AT");
                  await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
                  continue;
                }
              }
            }
          } else {
            const orderADES = await this.findOrderADES();
            if (moment(this.orderNDES.arrivingTime).toDate() < moment(orderADES.arrivingTime).toDate()) {
              const TTOrderNToOrderADES = await this.getSmartDuration(this.orderN.placeId, orderADES.placeId, moment(this.collectingTime).toDate());

              const diffOfAT = moment(orderADES.arrivingTime).diff(this.orderN.arrivingTime, 'seconds');
              if (TTOrderNToOrderADES >= diffOfAT) {
                this.orderNDES.arrivingTime = moment(this.orderNDES.arrivingTime).add(diffOfAT, 'seconds').toDate();
              }
              const LTOrderNToOrderADES = await this.getSmartDuration(this.orderN.placeId, orderADES.placeId, moment(this.collectingTime).toDate());
              
              if (moment(this.collectingTime).add(LTOrderNToOrderADES, 'seconds').toDate() >= moment(this.orderNDES.arrivingTime).toDate()) {
                await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
                continue;
              }

              this.tempIRPList.push(this.orderNDES);
              await this.sortTempDESByPlaceTypeAndAT();
              await this.updateCollectingTime();
              await this.takeNOrderToIRP();
              await this.sortDESByPlaceTypeAndAT();
              await this.processSecondRunRefreshment();
              return;
            } else {
              await this.tempIRPList.push(this.orderNDES);
              await this.sortTempDESByPlaceTypeAndAT();
              await this.updateNewATForBeforeCheckingAvailable();

              const result = await this.checkOrderNIsAvailable();
              if (result === true) {
                await this.updateCollectingTime();
                await this.takeNOrderToIRP();
                await this.sortDESByPlaceTypeAndAT();
                await this.processSecondRunRefreshment();
                return;
              } else {
                await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
                continue;
              }
            }
          }
        } else {
          //console.log("Failed because Car Capacity is not enouph");
          await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
          continue;
        }
      } else {
        //console.log("=== drop off case ===");
        const destinationListNotAirportIsExist = await this.checkDESNotAirportIsExist();

        if(destinationListNotAirportIsExist === true){
          if(this.orderN.placeType === "AIRPORT"){
            await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "DES");
            continue;
          }else{
            //await this.printDetails(this.IRPList, "IRP List");
            const previousOrder = await this.findPreviousOrder();
            const TTPrevoiusOrderToOrderN = await this.getSmartDuration(previousOrder.placeId, this.orderN.placeId, moment(previousOrder.collectingTime).toDate());
            this.collectingTime = moment(previousOrder.collectingTime).add(TTPrevoiusOrderToOrderN, "seconds").toDate();

            await this.sortTempDESByPlaceTypeAndAT();
            const orderADES = await this.findOrderADES();
            await this.updateTempIRPOrderDESStatus(this.orderN.id, "DELIVERED");
            await this.updateNewATForBeforeCheckingAvailableDropoff();

            const tempOrderADES = {...this.tempIRPList.find(order => order.id === orderADES.id && order.type === "DES")};
            
            const result = await this.checkOrderNDESIsAvailableDropoff(tempOrderADES);
            
            if (result === false) {
              await this.updateTempIRPOrderDESStatus(this.orderN.id, "DELIVERING");
              await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "DES");
              continue;
            }else{
              this.currentCarCap =  this.currentCarCap + this.orderN.numberOfLuggage;
              this.orderN.collectingTime = moment(this.collectingTime).toDate();
              this.orderN.status =   "DELIVERED";
              await this.IRPLocationList.push(this.orderN);
              await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "DES");
              await this.removeNOrderByTypeFromSpotList(this.orderN.id, "DES");
              await this.updateIRPOrderDESStatus(this.orderN.id, "DELIVERED");
              await this.updateTempIRPOrderDESStatus(this.orderN.id, "DELIVERED");
              await this.processSecondRunRefreshment();
              return;
            }
          }
          
        }else{
          
          const previousOrder = await this.findPreviousOrder();

          const TTPrevoiusOrderToOrderN = await this.getSmartDuration(previousOrder.placeId, this.orderN.placeId, moment(previousOrder.collectingTime).toDate());
          
          this.collectingTime = moment(previousOrder.collectingTime).add(TTPrevoiusOrderToOrderN, "seconds").toDate();

          await this.sortTempDESByPlaceTypeAndAT();
          const orderADES = await this.findOrderADES();
          await this.updateTempIRPOrderDESStatus(this.orderN.id, "DELIVERED");
          await this.updateNewATForBeforeCheckingAvailableDropoff();
          const tempOrderADES = {...this.tempIRPList.find(order => order.id === orderADES.id && order.type === "DES")};
          
          const result = await this.checkOrderNDESIsAvailableDropoff(tempOrderADES);

          
          if (result === false) {
            await this.updateTempIRPOrderDESStatus(this.orderN.id, "DELIVERING");
            await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "DES");
            continue;
          }else{
            this.currentCarCap =  this.currentCarCap + this.orderN.numberOfLuggage;
            this.orderN.collectingTime = moment(this.collectingTime).toDate();
            this.orderN.status = "DELIVERED";
            await this.IRPLocationList.push(this.orderN);
            await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "DES");
            await this.removeNOrderByTypeFromSpotList(this.orderN.id, "DES");

            await this.updateIRPOrderDESStatus(this.orderN.id, "DELIVERED");
            await this.updateTempIRPOrderDESStatus(this.orderN.id, "DELIVERED");
            
            if(this.orderN.placeType === "AIRPORT"){
              this.tempOrderList = [...this.tempIRPList.filter(order => 
                (order.status === "DELIVERING") && (order.id !== this.orderN.id))];

                if(this.tempOrderList.length === 0){
                  await this.endProcessAdjustment();
                  return;
                }else{
                  this.endIRPProcess = true;
                  await this.processSecondRunRefreshment();
                  return;
                }
            }else{
              await this.processSecondRunRefreshment();
              return;
            }
          }
        }
      }
      await this.endProcessAdjustment();
      return;
    }
  }

  async processThirdRun() {
    
    //console.log("orderN:", this.orderN);
    if (this.endIRPProcess === false) { //The default is 'false'
      this.tempOrderList = [...this.spotList];
      this.tempIRPList = [...this.IRPList];
    }

    while (this.tempOrderList.length !== 0) {
      const orderZ = await this.findOrderZDES();
      const previousOrder = await this.findPreviousOrder();
      
      await this.getAllOrdersTransportations(previousOrder.placeId, moment(previousOrder.collectingTime).toDate());
      
      this.tempOrderList = _.orderBy(
        this.tempOrderList,
        ['possibleCollectingTime', 'transportationTime'],
        ['ASC', 'ASC'],
      );
      
      const tempOrderListORI = [...this.tempOrderList.filter(order => order.type === "ORI")];
      const tempOrderListDES = [...this.tempOrderList.filter(order => order.type === "DES")];
      const tempOrderListDESAirport = [...tempOrderListDES.filter(order => order.type === "DES" && order.placeType === "AIRPORT")];
      const tempOrderListDESNotAirport = [...tempOrderListDES.filter(order => order.type === "DES" && order.placeType !== "AIRPORT")];
      const newTempOrderListNoDESAirport = [...tempOrderListORI, ...tempOrderListDESNotAirport];

      const sortedNewTempOrderListNoDESAirport = _.orderBy(
        newTempOrderListNoDESAirport,
        ['possibleCollectingTime', 'transportationTime'],
        ['ASC', 'ASC']
      );

      const sortedNewTempOrderListDESAirport = _.orderBy(
        tempOrderListDESAirport,
        ['possibleCollectingTime', 'transportationTime'],
        ['ASC', 'ASC']
      );

      this.tempOrderList = [...sortedNewTempOrderListNoDESAirport, ...sortedNewTempOrderListDESAirport];
      
      const checkContinue = await this.orderNSmartImproveConsiderationRunRefreshWorking();
      
      if(checkContinue === false){
        await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
        continue;
      }

      await this.createNOrderDES();
      if (this.orderN.type === 'ORI') {
        //console.log(" === Collect case ===");
        const dropTime = moment(this.orderN.time).toDate();
        this.arrivingTime = moment(this.orderN.arrivingTime).toDate();

        const TTPreviousOrderToOrderN = await this.getSmartDuration(previousOrder.placeId, this.orderN.placeId, moment(previousOrder.collectingTime).toDate());

        if(moment(previousOrder.collectingTime).add(TTPreviousOrderToOrderN, 'seconds').toDate() > moment(this.orderN.time).toDate()){
          this.orderN.collectingTime = moment(previousOrder.collectingTime).add(TTPreviousOrderToOrderN, 'seconds').toDate();
        }else{
          this.orderN.collectingTime = moment(this.orderN.time).toDate();
        }
        
        this.collectingTime = this.orderN.collectingTime;
        
        if (this.orderN.numberOfLuggage <= this.currentCarCap) {
          await this.createNOrderDES();
          
          if (this.orderNDES.placeType === 'AIRPORT') {
            if (orderZ !== null) {
              
              if (orderZ.placeType === 'AIRPORT') {
                 
                if (orderZ.placeId === this.orderNDES.placeId) {
                  if (moment(this.orderNDES.arrivingTime).toDate() >= moment(orderZ.arrivingTime).toDate()) {
                    const orderADES = await this.findOrderADES();
                    const LTofOrderNToOrderADES = await this.getSmartDuration(this.orderN.placeId, orderADES.placeId, moment(this.collectingTime).toDate());
                    
                    if (moment(orderADES.arrivingTime).toDate() > moment(this.collectingTime).add(LTofOrderNToOrderADES, 'seconds').toDate()) {
                      //console.log("Get order because of AT");
                      await this.takeNOrderToIRP();
                      await this.sortTempDESByPlaceTypeAndAT();
                      await this.sortDESByPlaceTypeAndAT();
                      await this.processThirdRun();
                      return;
                    } else {
                      //console.log("Failed because of AT");
                      await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
                      continue;
                    }
                  } else {
                    await this.updateTempIRPListAT();
                    await this.sortTempDESByPlaceTypeAndAT();
                    await this.updateNewATForBeforeCheckingAvailable();
                    
                    const result = await this.checkOrderNIsAvailable();
                    if (result === true) {
                      //console.log("Get order after change AT");
                      await this.updateCollectingTime();
                      await this.takeNOrderToIRP();
                      await this.sortDESByPlaceTypeAndAT();
                      await this.processThirdRun();
                      return;
                    } else {
                      //console.log("Failed because of AT after change AT");
                      await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
                      this.tempIRPList = [...this.tempIRPList.filter((order) => {
                        if (order.id === this.orderNDES.id && order.type === 'DES') {
                          return false;
                        } else {
                          return true;
                        }
                      })];
                      continue;
                    }
                  }
                } else {
                  //console.log("Failed because of not same Airport");
                  await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
                  continue;
                }
              } else {
                await this.updateTempIRPListAT();
                await this.sortTempDESByPlaceTypeAndAT();
                await this.updateNewATForBeforeCheckingAvailable();

                const result = await this.checkOrderNIsAvailable();
                if (result === true) {
                  //console.log("Get order After change AT");
                  await this.updateCollectingTime();
                  await this.takeNOrderToIRP();
                  await this.sortDESByPlaceTypeAndAT();
                  await this.processThirdRun();
                  return;
                } else {
                  //console.log("Failed after change AT");
                  await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
                  continue;
                }
              }
            }
          } else {
            const orderADES = await this.findOrderADES();
            
            if (moment(this.orderNDES.arrivingTime).toDate() < moment(orderADES.arrivingTime).toDate()) {
              const TTOrderNToOrderADES = await this.getSmartDuration(this.orderN.placeId, orderADES.placeId, moment(this.collectingTime).toDate());
              
              const diffOfAT = moment(orderADES.arrivingTime).diff(this.orderN.arrivingTime, 'seconds');
              if (TTOrderNToOrderADES >= diffOfAT) {
                this.orderNDES.arrivingTime = moment(this.orderNDES.arrivingTime).add(diffOfAT, 'seconds').toDate();
              }
              const LTOrderNToOrderADES = await this.getSmartDuration(this.orderN.placeId, orderADES.placeId, moment(this.collectingTime).toDate());
              
              if (moment(this.collectingTime).add(LTOrderNToOrderADES, 'seconds').toDate() >= moment(this.orderNDES.arrivingTime).toDate()) {
                await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
                continue;
              }

              this.tempIRPList.push(this.orderNDES);
              await this.sortTempDESByPlaceTypeAndAT();
              await this.updateCollectingTime();
              await this.takeNOrderToIRP();
              await this.sortDESByPlaceTypeAndAT();
              await this.processThirdRun();
              return;
            } else {
              await this.tempIRPList.push(this.orderNDES);
              await this.sortTempDESByPlaceTypeAndAT();
              await this.updateNewATForBeforeCheckingAvailable();
              const result = await this.checkOrderNIsAvailable();
              if (result === true) {
                await this.updateCollectingTime();
                await this.takeNOrderToIRP();
                await this.sortDESByPlaceTypeAndAT();
                await this.processThirdRun();
                return;
              } else {
                await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
                continue;
              }
            }
          }
        } else {
          //console.log("Failed because Car Capacity is not enouph");
          await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, 'ORI');
          continue;
        }
      } else {
        //console.log("=== drop off case ===");
        const destinationListNotAirportIsExist = await this.checkDESNotAirportIsExist();

        if(destinationListNotAirportIsExist === true){
          if(this.orderN.placeType === "AIRPORT"){
            await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "DES");
            continue;
          }else{
            //await this.printDetails(this.IRPList, "IRP List");
            const previousOrder = await this.findPreviousOrder();
            const TTPrevoiusOrderToOrderN = await this.getSmartDuration(previousOrder.placeId, this.orderN.placeId, moment(previousOrder.collectingTime).toDate());
            this.collectingTime = moment(previousOrder.collectingTime).add(TTPrevoiusOrderToOrderN, "seconds").toDate();

            await this.sortTempDESByPlaceTypeAndAT();
            const orderADES = await this.findOrderADES();
            await this.updateTempIRPOrderDESStatus(this.orderN.id, "DELIVERED");
            await this.updateNewATForBeforeCheckingAvailableDropoff();

            const tempOrderADES = {...this.tempIRPList.find(order => order.id === orderADES.id && order.type === "DES")};
            
            const result = await this.checkOrderNDESIsAvailableDropoff(tempOrderADES);
            
            if (result === false) {
              await this.updateTempIRPOrderDESStatus(this.orderN.id, "DELIVERING");
              await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "DES");
              continue;
            }else{
              this.currentCarCap =  this.currentCarCap + this.orderN.numberOfLuggage;
              this.orderN.collectingTime = moment(this.collectingTime).toDate();
              this.orderN.status =   "DELIVERED";
              await this.IRPLocationList.push(this.orderN);
              await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "DES");
              await this.removeNOrderByTypeFromSpotList(this.orderN.id, "DES");
              await this.updateIRPOrderDESStatus(this.orderN.id, "DELIVERED");
              await this.updateTempIRPOrderDESStatus(this.orderN.id, "DELIVERED");
              await this.processThirdRun();
              return;
            }
          }
        }else{
          
          const previousOrder = await this.findPreviousOrder();

          const TTPrevoiusOrderToOrderN = await this.getSmartDuration(previousOrder.placeId, this.orderN.placeId, moment(previousOrder.collectingTime).toDate());
          
          this.collectingTime = moment(previousOrder.collectingTime).add(TTPrevoiusOrderToOrderN, "seconds").toDate();

          await this.sortTempDESByPlaceTypeAndAT();
          const orderADES = await this.findOrderADES();
          await this.updateTempIRPOrderDESStatus(this.orderN.id, "DELIVERED");
          await this.updateNewATForBeforeCheckingAvailableDropoff();
          const tempOrderADES = {...this.tempIRPList.find(order => order.id === orderADES.id && order.type === "DES")};
          
          const result = await this.checkOrderNDESIsAvailableDropoff(tempOrderADES);  
          if (result === false) {
            await this.updateTempIRPOrderDESStatus(this.orderN.id, "DELIVERING");
            await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "DES");
            continue;
          }else{
            this.currentCarCap =  this.currentCarCap + this.orderN.numberOfLuggage;
            this.orderN.collectingTime = moment(this.collectingTime).toDate();
            this.orderN.status = "DELIVERED";
            await this.IRPLocationList.push(this.orderN);
            await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "DES");
            await this.removeNOrderByTypeFromSpotList(this.orderN.id, "DES");

            await this.updateIRPOrderDESStatus(this.orderN.id, "DELIVERED");
            await this.updateTempIRPOrderDESStatus(this.orderN.id, "DELIVERED");
            
            if(this.orderN.placeType === "AIRPORT"){
              this.tempOrderList = [...this.tempIRPList.filter(order => 
                (order.status === "DELIVERING") && (order.id !== this.orderN.id))];

                if(this.tempOrderList.length === 0){
                  await this.endProcessAdjustment();
                  return;
                }else{
                  this.endIRPProcess = true;
                  await this.processThirdRun();
                  return;
                }
            }else{
              await this.processThirdRun();
              return;
            }
          }
        }
      }
      await this.endProcessAdjustment();
      return;
    }
  }
  
  async IRPConsolidationAdjustment(){
    //get orders from tempIRPList
    const ordersInIRP = [...this.tempIRPList];
    //find the orders in IRPList which destination place type is equal to AIRPORT and status is equal to "DELIVERING"
    let orderZDES = [...ordersInIRP.filter(order => order.placeType === "AIRPORT" && order.type === "DES" && order.status === "DELIVERING")];
    //sort those orders by realArriving Time
    orderZDES = _.orderBy(orderZDES, "realArrivingTime", "ASC");
    //get the shortest real Arriving Time orders
    const shortestOrderZDES = {...orderZDES[0]};
    //find the order is not equal to AIRPORT destination
    let orderNotAirportDES = [...ordersInIRP.filter(order => !(order.placeType === "AIRPORT" && order.type === "DES"))];
    //sort those orders by collectingTime
    orderNotAirportDES = _.orderBy(orderNotAirportDES, "collectingTime", "ASC");
    //lastest order in IRPList is the lastest one
    const orderNCL = {...orderNotAirportDES[orderNotAirportDES.length - 1]};
    //find every plans that status 'working' and 'waiting'
    const workingPlanDetails = await Plans.findAll({
      where: {
        status: { [Op.in]: ["WORKING", "WAITING"] },
      }
    });
    //get plan list (only plan id)
    let workingPlans = await workingPlanDetails.map(plan => plan.id);
    //get plans same airport route (BKK or DMK)
    const workingPlanSameDESAirport = [];
    //get the plans that there are same airport route as the selected Order N CL 
    //filter by plan list
    await Promise.all(workingPlans.map(async (pId) => {
      let orderDetails = await PlanLocations.findAll({
        where: {
          planId: pId,
          type: "DES"
        },attributes: ["id", "planId", "orderId", "placeId", "collectingTime"]
      });
      
      orderDetails = _.orderBy(orderDetails, ["collectingTime"], ["ASC"]);

      if(orderDetails[orderDetails.length - 1].placeId === shortestOrderZDES.placeId){
        workingPlanSameDESAirport.push(pId);
      }
    }));
    //find the details of each CL in that List
    let orderInConsolidationList = [];
    await Promise.all(workingPlanSameDESAirport.map(async (pId) => {
      let ordersInPlanDetails = await PlanLocations.findAll({
        attributes: ["orderId", "planId", "placeId", "collectingTime", "possibleArrivingTime", "possibleCollectingTime", "transportationTime", "type", "arrivingTime"],
        include: [{
          model: Orders,
          attributes: ["numberOfLuggage", "code"]
        }],
        where: {
          planId: pId
        }
      });
      ordersInPlanDetails = await ordersInPlanDetails.map(o => o.toJSON());
      orderInConsolidationList = [...orderInConsolidationList, ...ordersInPlanDetails];
    }));
    //initial ALL CLs inside CL List
    let AllCCLs = [];
    //initial ALL CLs including their details
    let AllCCLIncludedDetails = [];
    //filter CLs greater than N CL or CLs lower than N CL + 1.5 hours
    await orderInConsolidationList.map(order => {
      if(moment(order.collectingTime).toDate() >= moment(orderNCL.collectingTime).toDate() && moment(order.collectingTime).toDate() <= moment(orderNCL.collectingTime).add(90, "minutes").toDate()){
        AllCCLs.push(order);
      }
    }); 
    //cut off Airport CL
    AllCCLs = await AllCCLs.filter(od =>  !(od.placeId === orderNCL.placeId && od.type === "DES"));
    
    //format the CCLs
    await AllCCLs.map(cl => {
      AllCCLIncludedDetails.push({
        id: cl.orderId,
        planId: cl.planId,
        orderId: cl.orderId,
        type: cl.type,
        placeId: cl.placeId,
        possibleArrivingTime: null,
        waitingTime: null,
        collectingTime: cl.collectingTime,
        numberOfLuggage: cl.order.numberOfLuggage,
        code: cl.order.code,
        arrivingTime: cl.arrivingTime
      });
    });
    
    //Calculate PAT to all of orders in All C CL List
    await Promise.all(AllCCLIncludedDetails.map(async cl => {
      let TTOrderNCLtoOrderCCL = await this.getSmartDuration(orderNCL.placeId, cl.placeId, moment(orderNCL.collectingTime).toDate());
      let possibleArrivingTime = moment(orderNCL.collectingTime).add(TTOrderNCLtoOrderCCL, "seconds").toDate();
      cl.possibleArrivingTime = moment(possibleArrivingTime).toDate();
      cl.waitingTime = moment.utc(moment(cl.collectingTime, "HH:mm:ss").diff(moment(possibleArrivingTime, "HH:mm:ss"))).format("HH:mm:ss")
    }));

    let CCLListWhichPATLowerThanCCL = [];
    let CCLListWhichPATBiggerThanCCL = [];

    //seperate CL into 2 parts
    await AllCCLIncludedDetails.forEach(cl => {
      if(moment(cl.possibleArrivingTime).toDate() <= moment(cl.collectingTime).toDate()){
        CCLListWhichPATLowerThanCCL.push(cl);
      }else{
        CCLListWhichPATBiggerThanCCL.push(cl);
      }
    });

    //find the list of C CL which PAT <= C CL
    CCLListWhichPATLowerThanCCL = _.orderBy(CCLListWhichPATLowerThanCCL, "possibleArrivingTime", "ASC");
    //find the list of C CL which PAT > C CL
    CCLListWhichPATBiggerThanCCL = _.orderBy(CCLListWhichPATBiggerThanCCL, "waitingTime", "ASC");
    //combine 2 list of CLs
    let AllConsolidationCLsIncludingAirport = [...CCLListWhichPATLowerThanCCL, ...CCLListWhichPATBiggerThanCCL];

    //find all of airport in system
    let allOfPlaceTypeAirports = await Places.findAll({attributes: ["placeId"], where: {typeId: 1}});
    allOfPlaceTypeAirports = await allOfPlaceTypeAirports.map(place => place.toJSON());
    allOfPlaceTypeAirports = await allOfPlaceTypeAirports.map(place => place.placeId);
    allOfPlaceTypeAirports = _.uniq(allOfPlaceTypeAirports);

    //cut off airport from ccl list
    let AllConsolidationCLs = [];
    await AllConsolidationCLsIncludingAirport.forEach(cl => {
      if(!allOfPlaceTypeAirports.includes(cl.placeId)){
        AllConsolidationCLs.push(cl);
      }
    });

    //stop checking if we can consolidate at this CL //default as false
    let checkConsolidate = false;

    while(AllConsolidationCLs.length !== 0){
      if(checkConsolidate === true){
        return;
      }
      let selectedCCL = AllConsolidationCLs[0];
      //have to adjust here real is <=
      if(moment(selectedCCL.possibleArrivingTime).toDate() <= moment(selectedCCL.collectingTime).toDate()){
        //case of selected CL PAT <= C CL
        let currentCDriverCarCapacity = 0;
        //find driver maximum car capacity
        let driverCarCarPacity = await this.getCarCapacityByPlanId(selectedCCL.planId);
        //find all of order in the plan locations that selected CL is belong to
        //prepare all details of order which selected plan is belong to include their status        
        //get all of orders that belong to the plan of selected c cl
        let formatedOrdersInPlan = await this.preparationOrdersInFormattedRealtime(selectedCCL);
        //sort all of orders by collectingTime
        formatedOrdersInPlan = _.orderBy(formatedOrdersInPlan, ["collectingTime", "id"], ["ASC", "ASC"]);
        //find the current car capacity depend to locked point
        //check this CL is a locked point ?
        const checkCCLsLockedPoint = await this.checkCCLisLockedPoints(selectedCCL);

        if(checkCCLsLockedPoint === true){
          //find locked points (list of collectingTime of group of locked points)
          let lockedPoints = await this.checkSelectedPlanLockedPointsDetails(selectedCCL);
          //calculate number of luggages until last locked
          currentCDriverCarCapacity = await this.findCurrentCarCapacityConsolidation(formatedOrdersInPlan, moment(lockedPoints[lockedPoints.length-1]).toDate());
        }else{
          //calculate number of luggages until selected C CL
          currentCDriverCarCapacity = await this.findCurrentCarCapacityConsolidation(formatedOrdersInPlan, moment(selectedCCL.collectingTime).toDate());
        }
        //current car capacity is also including locked points and selected C CL
        //check C Driver car capacity is enough
        if(currentCDriverCarCapacity <= driverCarCarPacity){
          //find A Driver AT
          let ordersInADriver = this.tempIRPList.filter(order => order.type === "DES" && order.status === "DELIVERING" && order.placeType === "AIRPORT");
          let ordersInADriverDESAirport = _.orderBy(ordersInADriver, "arrivingTime", "ASC");
          let ADriverAT = moment(ordersInADriverDESAirport[0].arrivingTime).toDate();
          //find C Driver AT
          let ordersInCDriver = [...formatedOrdersInPlan];
          let ordersInCDriverDES = ordersInCDriver.filter(order => order.type === "DES" && order.status === "DELIVERING");
          //sort Airport DES by Collecting Time and then Arriving Time
          ordersInCDriverDES = _.orderBy(ordersInCDriverDES, ["collectingTime", "arrivingTime"], ["ASC", "ASC"]);
          let CDriverAT = moment(ordersInCDriverDES[0].arrivingTime).toDate();
          //find C Driver DES AIRPORT
          let ordersInCDriverDESAirport = ordersInCDriver.filter(order => order.type === "DES" && order.placeType === "AIRPORT");
          //sort Airport DES by Arriving Time ASC
          ordersInCDriverDESAirport = [..._.orderBy(ordersInCDriverDESAirport, "arrivingTime", "ASC")];
          //find C Driver CollectingTime AIRPORT
          let CDriverCLAirport = moment(ordersInCDriverDESAirport[0].collectingTime).toDate();
          //update A Driver AIRPORT DES 
          ordersInADriverDESAirport.forEach(order => {
            order.transportationTime = 0;
            order.collectingTime = moment(CDriverCLAirport).toDate();
          });

          //check A Driver AT is bigger or equal to C Driver AT //In real is greater or equal
          if(moment(ADriverAT).toDate() >= moment(CDriverAT).toDate()){
            console.log("make consolidation#1");
            //C Driver includong A Driver Airport DES
            let ordersInCDriverIncludeADriverDES = [...ordersInCDriver, ...ordersInADriverDESAirport];
            this.consolidationIsAvailable = true;
            this.consolidateCLs = [...ordersInADriverDESAirport];
            this.consolidateCL = {...selectedCCL};
            this.consolidationInCDriverIncludeADriverDES = [...ordersInCDriverIncludeADriverDES];
            return;
            //make consolidation
          }else{
            //make a copy of IRP List of C Driver
            let ADriverLuggages = 0;

            await ordersInADriverDESAirport.forEach(order => {
              ADriverLuggages = ADriverLuggages + order.numberOfLuggage;
              order.collectingTime = moment(CDriverCLAirport).toDate();
            });

            //C Driver includong A Driver Airport DES
            let ordersInCDriverIncludeADriverDES = [...ordersInCDriver, ...ordersInADriverDESAirport];
            //Re calculate AT (Loop)
            let tempIRPConsolidationList = await this.updateNewATForConsolidation(ordersInCDriverIncludeADriverDES);
            //find order destination in C Driver
            let newCDriverOrdersDES = [...await tempIRPConsolidationList.filter(order => order.type === "DES" && order.status === "DELIVERING")];
            //sort driver destination by collecting time and then arriving time (ASC both)
            newCDriverOrdersDES = _.orderBy(newCDriverOrdersDES, ["collectingTime", "arrivingTime"], ["ASC", "ASC"]);
            //find new order A DES for C Driver
            let newCDriverADES = newCDriverOrdersDES[0];
            if(checkCCLsLockedPoint === false){
              let TTfromCCLtoADES = await this.getSmartDuration(selectedCCL.placeId, newCDriverADES.placeId, moment(selectedCCL.collectingTime).toDate());
              if(moment(selectedCCL.collectingTime).add(TTfromCCLtoADES, "seconds").toDate() <= moment(ADriverAT).toDate()){
                //make Consolidation
                console.log("make consolidation#2");
                this.consolidationIsAvailable = true;
                this.consolidateCLs = [...ordersInADriverDESAirport];
                this.consolidateCL = {...selectedCCL};
                this.consolidationInCDriverIncludeADriverDES = [...ordersInCDriverIncludeADriverDES];
                return;
              }else{
                //remove the CL
                AllConsolidationCLs = AllConsolidationCLs.filter(CCL => !(CCL.orderId === selectedCCL.orderId &&  CCL.type === selectedCCL.type));
                continue;
              } 
            }else{
              //find lockedPoint (collecting time)
              let lockedPoints = await this.checkSelectedPlanLockedPointsDetails(selectedCCL);
              //find lastLocked collecting time
              let lastLocked = lockedPoints[lockedPoints.length - 1];
              //find group of last locked point places
              // console.log("ordersInCDriver", ordersInCDriver);
              // console.log("lastLocked", lastLocked);
              let lastLockedPlaceIds = await ordersInCDriver.filter(order => moment(order.collectingTime).format("YYYY-MM-DD hh:mm:ss") === moment(lastLocked).format("YYYY-MM-DD hh:mm:ss"));
              //find last locked point placeId
              let lastLockedPlaceId = lastLockedPlaceIds[0].placeId;
              let TTfromCCLtoADES = await this.getSmartDuration(lastLockedPlaceId, newCDriverADES.placeId, moment(lastLocked).toDate());
              console.log("check", moment(lastLocked).add(TTfromCCLtoADES, "seconds").toDate() <= moment(ADriverAT).toDate());
              if(moment(lastLocked).add(TTfromCCLtoADES, "seconds").toDate() <= moment(ADriverAT).toDate()){
                //make Consolidation
                console.log("make consolidation#3");
                this.consolidationIsAvailable = true;
                this.consolidateCLs = [...ordersInADriverDESAirport];
                this.consolidateCL = {...selectedCCL};
                this.consolidationInCDriverIncludeADriverDES = [...ordersInCDriverIncludeADriverDES];
                return;
              }else{
                //remove the CL
                AllConsolidationCLs = AllConsolidationCLs.filter(CCL => !(CCL.orderId === selectedCCL.orderId &&  CCL.type === selectedCCL.type));
                continue;
              }
            }
          }
          return;
        }else{
          //remove the CL
          AllConsolidationCLs = AllConsolidationCLs.filter(CCL => !(CCL.orderId === selectedCCL.orderId &&  CCL.type === selectedCCL.type));
          continue;
        }
      }else{
        // case of PAT > C CL
        let currentCDriverCarCapacity = 0;
        //find driver maximum car capacity
        let driverCarCarPacity = await this.getCarCapacityByPlanId(selectedCCL.planId);
        //find all of order in the plan locations that selected CL is belong to
        //prepare all details of order which selected plan is belong to include their status        
        //get all of orders that belong in plan of selected c cl
        let formatedOrdersInPlan = await this.preparationOrdersInFormattedRealtime(selectedCCL);
        //sort all of orders by collectingTime
        formatedOrdersInPlan = _.orderBy(formatedOrdersInPlan, ["collectingTime", "id"], ["ASC", "ASC"]);
        //find the current car capacity depend to locked point
        //check this CL is a locked point ?
        const checkCCLsLockedPoint = await this.checkCCLisLockedPoints(selectedCCL);
        if(checkCCLsLockedPoint === true){
          //find locked points (list of collectingTime of group of locked points)
          let lockedPoints = await this.checkSelectedPlanLockedPointsDetails(selectedCCL);
          //calculate number of luggages until last locked
          currentCDriverCarCapacity = await this.findCurrentCarCapacityConsolidation(formatedOrdersInPlan, moment(lockedPoints[lockedPoints.length-1]).toDate());
        }else{
          //calculate number of luggages until selected C CL
          currentCDriverCarCapacity = await this.findCurrentCarCapacityConsolidation(formatedOrdersInPlan, moment(selectedCCL.collectingTime).toDate());
        }
        //current car capacity is also including locked points and selected C CL
        //check C Driver car capacity is enough
        if(currentCDriverCarCapacity <= driverCarCarPacity){
          //find A Driver AT
          let ordersInADriver = this.tempIRPList.filter(order => order.type === "DES" && order.status === "DELIVERING" && order.placeType === "AIRPORT");
          let ordersInADriverDESAirport = _.orderBy(ordersInADriver, "arrivingTime", "ASC");
          let ADriverAT = moment(ordersInADriverDESAirport[0].arrivingTime).toDate();

          //find C Driver AT
          let ordersInCDriver = [...formatedOrdersInPlan];
          let ordersInCDriverDES = ordersInCDriver.filter(order => order.type === "DES" && order.status === "DELIVERING");
          //sort Airport DES by Collecting Time and then Arriving Time
          ordersInCDriverDES = _.orderBy(ordersInCDriverDES, ["collectingTime", "arrivingTime"], ["ASC", "ASC"]);
          let CDriverAT = moment(ordersInCDriverDES[0].arrivingTime).toDate();

          //find C Driver DES AIRPORT
          let ordersInCDriverDESAirport = ordersInCDriver.filter(order => order.type === "DES" && order.placeType === "AIRPORT");
          //sort Airport DES by Arriving Time
          ordersInCDriverDESAirport = _.orderBy(ordersInCDriverDESAirport, "arrivingTime", "ASC");
          let CDriverCLAirport = moment(ordersInCDriverDESAirport[0].collectingTime).toDate();

          let ADriverLuggages = 0;
          await ordersInADriverDESAirport.forEach(order => {
            ADriverLuggages = ADriverLuggages + order.numberOfLuggage;
            order.collectingTime = moment(CDriverCLAirport).toDate();
          });
          //C Driver includong A Driver Airport DES
          let ordersInCDriverIncludeADriverDES = [...ordersInCDriver, ...ordersInADriverDESAirport];
          let tempIRPConsolidationList = null;

          //check A Driver AT is less than to C Driver AT
          if(moment(ADriverAT).toDate() < moment(CDriverAT).toDate()){
            //Re calculate AT (Loop)
            tempIRPConsolidationList = await this.updateNewATForConsolidation(ordersInCDriverIncludeADriverDES);
          }else{
            tempIRPConsolidationList = [...ordersInCDriverIncludeADriverDES];
          }

          //change selected C CL to PAT
          selectedCCL.collectingTime = moment(selectedCCL.possibleArrivingTime).toDate();

          tempIRPConsolidationList = [...await this.updateDelayCollectingTime(tempIRPConsolidationList, selectedCCL.collectingTime)];

          

            
          //find order destination in C Driver
          let newCDriverOrdersDES = [...await tempIRPConsolidationList.filter(order => order.type === "DES" && order.status === "DELIVERING")];

          //sort driver destination by collecting time and then arriving time (ASC both)
          newCDriverOrdersDES = _.orderBy(newCDriverOrdersDES, ["collectingTime", "arrivingTime"], ["ASC", "ASC"]);
          //find new order A DES for C Driver
          let newCDriverADES = newCDriverOrdersDES[0];

          if(checkCCLsLockedPoint === false){
            let TTfromCCLtoADES = await this.getSmartDuration(selectedCCL.placeId, newCDriverADES.placeId, moment(selectedCCL.collectingTime).toDate());
            if(moment(selectedCCL.collectingTime).add(TTfromCCLtoADES, "seconds").toDate() <= moment(ADriverAT).toDate()){
              //make Consolidation
              console.log("selectedCCL:", selectedCCL);
              console.log("make consolidation#4");
              this.consolidationIsAvailable = true;
              this.consolidateCLs = [...ordersInADriverDESAirport];
              this.consolidateCL = {...selectedCCL};
              this.consolidationInCDriverIncludeADriverDES = [...ordersInCDriverIncludeADriverDES];
              return;
            }else{
              //remove the CL
              AllConsolidationCLs = AllConsolidationCLs.filter(CCL => !(CCL.orderId === selectedCCL.orderId &&  CCL.type === selectedCCL.type));
              continue;
            } 
          }else{
            //find lockedPoint (collecting time)
            let lockedPoints = await this.checkSelectedPlanLockedPointsDetails(selectedCCL);
            //find lastLocked collecting time
            let lastLocked = lockedPoints[lockedPoints.length - 1];
            //find group of last locked point places
            let lastLockedPlaceIds = await ordersInCDriver.filter(order => moment(order.collectingTime).toDate() = moment(lastLocked).toDate());
            //find last locked point placeId
            let lastLockedPlaceId = lastLockedPlaceIds[0].placeId;
            let TTfromCCLtoADES = await this.getSmartDuration(lastLockedPlaceId, newCDriverADES.placeId, moment(lastLocked).toDate());
            if(moment(lastLocked).add(TTfromCCLtoADES, "seconds").toDate() <= moment(ADriverAT).toDate()){
              //make Consolidation
              console.log("make consolidation#5");
              this.consolidationIsAvailable = true;
              this.consolidateCLs = [...ordersInADriverDESAirport];
              this.consolidateCL = {...selectedCCL};
              this.consolidationInCDriverIncludeADriverDES = [...ordersInCDriverIncludeADriverDES];
              return;
            }else{
              //remove the CL
              AllConsolidationCLs = AllConsolidationCLs.filter(CCL => !(CCL.orderId === selectedCCL.orderId &&  CCL.type === selectedCCL.type));
              continue;
            }
          }
        }else{
          //remove the CL
          AllConsolidationCLs = AllConsolidationCLs.filter(CCL => !(CCL.orderId === selectedCCL.orderId &&  CCL.type === selectedCCL.type));
          continue;
        }
      }
    }

    this.consolidationIsChecked = true;
    console.log("consolidationIsChecked:", this.consolidationIsChecked);
    console.log("consolidationIsAvailable:", this.consolidationIsAvailable);
    console.log("end consolidation process...");
    return;
  }

  async updateDelayCollectingTime(_tempIRPConsolidationList, selectedCCLCollectingTime){
    let orderCollectingTimeLessThanCCL = await _tempIRPConsolidationList.filter(order => moment(order.collectingTime).toDate() < moment(selectedCCLCollectingTime).toDate());
    let orderCollectingTimeGreaterThanCCL = await _tempIRPConsolidationList.filter(order => moment(order.collectingTime).toDate() >= moment(selectedCCLCollectingTime).toDate());
    orderCollectingTimeGreaterThanCCL = _.orderBy(orderCollectingTimeGreaterThanCCL, ["collectingTime"], ["ASC"]);

    let i = 0;
    orderCollectingTimeGreaterThanCCL[0].collectingTime = moment(selectedCCLCollectingTime).toDate();

    if((orderCollectingTimeGreaterThanCCL.length - 1) > 1 ){
      while(i !== (orderCollectingTimeGreaterThanCCL.length - 2)){
        let TT = await this.getSmartDuration( orderCollectingTimeGreaterThanCCL[i].placeId, 
                                              orderCollectingTimeGreaterThanCCL[i+1].placeId, 
                                              moment(orderCollectingTimeGreaterThanCCL[i].collectingTime).toDate() );

        orderCollectingTimeGreaterThanCCL[i+1].collectingTime = moment(orderCollectingTimeGreaterThanCCL[i]).add(TT, "seconds").toDate();
        i++;
      }
    }
    _tempIRPConsolidationList = [...orderCollectingTimeLessThanCCL, ...orderCollectingTimeGreaterThanCCL];
    _tempIRPConsolidationList = _.orderBy(_tempIRPConsolidationList, ["collectingTime"], "ASC");
    return _tempIRPConsolidationList;
  }

  async checkSelectedPlanLockedPointsDetails(selectedCCL){
    //get selected Plan from selected C CL
    let selectedPlan = selectedCCL.planId;

    //get each orders details inside selected plan
    let allOrdersInPlan = await PlanLocations.findAll({
      attributes: ["orderId", "planId", "collectingTime", "type"],
      include: [{
        attributes: ["status"],
        model: Orders
      }],
      where: {planId: selectedPlan}
    });
    
    allOrdersInPlan = await allOrdersInPlan.map(od => {
      return {
        id: od.orderId,
        type: od.type,
        workingStatus: od.order.status,
        collectingTime: od.collectingTime
      };
    });

    let lockedPoints = await allOrdersInPlan.filter(order => {
      if(order.workingStatus === 6 && order.type === "ORI"){
        return order;
      }else if( order.workingStatus === 7 && order.type === "DES"){
        return order;
      }
    });
    lockedPoints = _.orderBy(lockedPoints, "collectingTime", "asc");
    lockedPoints = await lockedPoints.map(cl => cl.collectingTime);
    let groupOfLockedPoints = _.uniq(lockedPoints);
    /*
    // let AllOfLockedPoints = [];
    // await Promise.all(groupOfLockedPoints.map(async (group, index) => {
    //   let ordersInGroup = await allOrdersInPlan.filter(order => {
    //     if(order.collectingTime === group){ ื
    //     }
    //   });

    //   AllOfLockedPoints.push({
    //     lockedPointIndex: index+1,
    //     orders: ordersInGroup
    //   });
    // }));
    */
    
    return groupOfLockedPoints;
  }

  async IRPConsolidation(){
    const ordersInIRP = [...this.tempIRPList];
    //find the shortest orderZ DES which place type equal to AIRPORT
    let orderZDES = [...ordersInIRP.filter(order => order.placeType === "AIRPORT" && order.type === "DES")];
    let orderNotAirportDES = [...ordersInIRP.filter(order => !(order.placeType === "AIRPORT" && order.type === "DES"))];
    orderZDES = _.orderBy(orderZDES, "realArrivingTime", "ASC");
    orderNotAirportDES = _.orderBy(orderNotAirportDES, "arrivingTime", "ASC");
    const shortestOrderZDES = {...orderZDES[0]};
    const orderNCL = {...orderNotAirportDES[orderNotAirportDES.length - 1]};

    //find the plan status 'working' and 'waiting' details
    const workingPlanDetails = await Plans.findAll({
      where: {
        status: { [Op.in]: ["WORKING", "WAITING"] },
      }
    });
    // get only plan id
    let workingPlans = await workingPlanDetails.map(plan => plan.id);
    
    //get plans same airport route (BKK or DMK)
    const workingPlanSameDESAirport = [];
    await Promise.all(workingPlans.map(async (pId) => {
      let orderDetails = await PlanLocations.findAll({
        where: {
          planId: pId,
          type: "DES"
        },attributes: ["id", "planId", "orderId", "placeId", "collectingTime"]
      });
      
      orderDetails = _.orderBy(orderDetails, ["collectingTime"], ["ASC"]);

      if(orderDetails[orderDetails.length - 1].placeId === shortestOrderZDES.placeId){
        workingPlanSameDESAirport.push(pId);
      }
    }));

    let orderInConsolidationList = [];
    await Promise.all(workingPlanSameDESAirport.map(async (pId) => {
      let ordersInPlanDetails = await PlanLocations.findAll({
        include: [{
          model: "Orders"
        }],
        where: {
          planId: pId
        }
      });

      ordersInPlanDetails = await ordersInPlanDetails.map(o => o.toJSON());
      orderInConsolidationList = [...orderInConsolidationList, ...ordersInPlanDetails];
    }));

    let AllCCLs = [];
    let AllCCLIncludedDetails = [];
    //cut off CLs with collectingTime less than orderNCL's collectingTime
    await orderInConsolidationList.map(order => {
      if(moment(order.collectingTime).toDate() >= moment(orderNCL.collectingTime).add(90, "minutes").toDate()){
        AllCCLs.push(order);
      }
    });
    //cut off Airport CL
    AllCCLs = await AllCCLs.filter(od =>  !(od.placeId === orderNCL.placeId && od.type === "DES"));

    //formate the CCLs
    await AllCCLs.map(cl => {
      AllCCLIncludedDetails.push({
        id: cl.orderId,
        planId: cl.planId,
        orderId: cl.orderId,
        type: cl.type,
        placeId: cl.placeId,
        possibleArrivingTime: null,
        waitingTime: null,
        collectingTime: cl.collectingTime,
        numberOfLuggage: cl.order.numberOfLuggage
      });
    });

    await Promise.all(AllCCLIncludedDetails.map(async cl => {
      let TTOrderNCLtoOrderCCL = await this.getSmartDuration(orderNCL.placeId, cl.placeId, moment(orderNCL.collectingTime).toDate());
      cl.possibleArrivingTime = moment(orderNCL.collectingTime).add(TTOrderNCLtoOrderCCL, "seconds").toDate();
    }));

    AllCCLIncludedDetails = _.orderBy(AllCCLIncludedDetails, "possibleArrivingTime", "ASC");

    while(AllCCLIncludedDetails.length !== 0){
      
      let selectedCCL = AllCCLIncludedDetails[0];

      if(moment(selectedCCL.possibleArrivingTime).toDate() <= moment(selectedCCL.collectingTime).toDate()){
        const checkCCLsLockedPoint = await this.checkCCLisFirstLockedPoints(selectedCCL);

        let currentCDriverCarCapacity = 0;
        let driverCarCarPacity = await this.getCarCapacityByPlanId(selectedCCL.planId);

        //find all of order in the plan locations that selected CL is belong to
        let ordersInPlan = await PlanLocations.findAll({ include: [{ model: "Orders" }], where: { planId: selectedCCL.planId }});
        ordersInPlan = await ordersInPlan.map(order => order.toJSON());
        await ordersInPlan.forEach(order => {order.id = order.orderId});
        //prepare all details of order which selected plan is belong to include their status        
        const formatedOrdersInPlan = await this.changeOrderInPlanToCalculatingFormat(ordersInPlan);

        if(checkCCLsLockedPoint === true){
          //calculate number of luggages until selected point
          currentCDriverCarCapacity = await this.findCurrentCarCapacity(formatedOrdersInPlan, selectedCCL);
        }else{
          //calculate number of luggages until last locked point
          let lockedPoints = await ordersInPlan.filter(order => order.order.status === 6 || order.order.status === 7);
          lockedPoints = _.orderBy(lockedPoints, "collectingTime", "ASC");
          let firstLocked = {...lockedPoints[0]};
          let lastLocked = {...lockedPoints[lockedPoints.length - 1]};
          if(firstLocked.placeId === selectedCCL.placeId){
            currentCDriverCarCapacity = await this.findCurrentCarCapacity(formatedOrdersInPlan, lastLocked);
          }else{
            currentCDriverCarCapacity = await this.findCurrentCarCapacity(formatedOrdersInPlan, selectedCCL);
          }
        }
        //check car capacity is enouph
        if(currentCDriverCarCapacity + selectedCCL.numberOfLuggage <= driverCarCarPacity){
          //find A Driver AT
          let ordersInADriver = this.tempIRPList.filter(order => order.type === "DES" && order.status === "DELIVERING");
          ordersInADriverDES = _.orderBy(ordersInADriver, "arrivingTime", "ASC");
          const driverNArrivingTime = ordersInADriverDES[0].arrivingTime;

          if(driverNArrivingTime >= selectedCCL.collectingTime){
            //make a consolidate algorithm
            return;
          }else{
            //make a copy of Driver
          }

        }else{
          //remove selected CCL from the List
          AllCCLIncludedDetails = AllCCLIncludedDetails.filter(CCL => !(CCL.orderId === selectedCCL.orderId &&  CCL.type === selectedCCL.type));
          continue;
        }
      }else{
        //calculate the waiting time of C Driver
        await AllCCLIncludedDetails.forEach(order => {
          order.waitingTime = order.possibleArrivingTime - order.collectingTime;
        });

        AllCCLIncludedDetails = _.orderBy(AllCCLIncludedDetails, "waitingTime", "ASC");
        selectedCCL = AllCCLIncludedDetails[0];

        let currentCDriverCarCapacity = 0;
        let driverCarCarPacity = await this.getCarCapacityByPlanId(selectedCCL.planId);

        //find all of order in the plan locations that selected CL is belong to
        let ordersInPlan = await PlanLocations.findAll({ include: [{ model: "Orders" }], where: { planId: selectedCCL.planId }});
        ordersInPlan = await ordersInPlan.map(order => order.toJSON());
        await ordersInPlan.forEach(order => {order.id = order.orderId});
        //prepare all details of order which selected plan is belong to include their status        
        const formatedOrdersInPlan = await this.changeOrderInPlanToCalculatingFormat(ordersInPlan);
        //calculate number of luggages until last locked point
        let lockedPoints = await ordersInPlan.filter(order => order.order.status === 6 || order.order.status === 7);
        lockedPoints = _.orderBy(lockedPoints, "collectingTime", "ASC");
        let firstLocked = {...lockedPoints[0]};
        let lastLocked = {...lockedPoints[lockedPoints.length - 1]};

        if(checkCCLsLockedPoint === true){
          //calculate number of luggages until selected point
          currentCDriverCarCapacity = await this.findCurrentCarCapacity(formatedOrdersInPlan, selectedCCL);
        }else{
          
          if(firstLocked.placeId === selectedCCL.placeId){
            currentCDriverCarCapacity = await this.findCurrentCarCapacity(formatedOrdersInPlan, lastLocked);
          }else{
            currentCDriverCarCapacity = await this.findCurrentCarCapacity(formatedOrdersInPlan, selectedCCL);
          }
        }
        //check car capacity is enouph
        if(currentCDriverCarCapacity + selectedCCL.numberOfLuggage <= driverCarCarPacity){
          //find A Driver AT
          let ordersInADriver = this.tempIRPList.filter(order => order.type === "DES" && order.status === "DELIVERING");
          ordersInADriverDES = _.orderBy(ordersInADriver, "arrivingTime", "ASC");
          const driverNArrivingTime = ordersInADriverDES[0].arrivingTime;

          if(moment(driverNArrivingTime).toDate() >= moment(selectedCCL.collectingTime).toDate()){
            //recalculate AT loop
          }
          //change C CL departure time to be equal to PAT
          selectedCCL.collectingTime = selectedCCL.possibleArrivingTime;

          if(firstLocked.placeId !== selectedCCL.placeId){
            const TTfromOrderNCLtoADES = await this.getSmartDuration(selectedCCL.placeId, ordersInADriverDES[0].placeId, moment(selectedCCL.collectingTime).toDate());
            if(moment(selectedCCL.collectingTime).add(TTfromOrderNCLtoADES, "seconds").toDate() <= moment(driverNArrivingTime).toDate()){
              //make a consolidate algorithm
              return;
            }else{
              //remove selected CCL from the List
              AllCCLIncludedDetails = AllCCLIncludedDetails.filter(CCL => !(CCL.orderId === selectedCCL.orderId &&  CCL.type === selectedCCL.type));
              continue;
            }
          }else{
            //C CL + TT (From C CL to next locked point) + TT (From next locked point to A DES) <= A AT
            if(true){
              //make a consolidate algorithm
              return;
            }else{
              //remove selected CCL from the List
              AllCCLIncludedDetails = AllCCLIncludedDetails.filter(CCL => !(CCL.orderId === selectedCCL.orderId &&  CCL.type === selectedCCL.type));
              continue;
            }
          }
        }else{
          //remove selected CCL from the List
          AllCCLIncludedDetails = AllCCLIncludedDetails.filter(CCL => !(CCL.orderId === selectedCCL.orderId &&  CCL.type === selectedCCL.type));
          continue;
        }
      }

      
    }
    
    return;
  }

  async checkCCLisLockedPoints(selectedCCL) {
    let orderDetails = await Orders.findOne({where: {id: selectedCCL.orderId}});
    if(orderDetails.status === 6 || orderDetails.status === 7){
      return true;
    }else{
      return false;
    }
  }

  async findDiffDay(){
    const testDate = moment([2019, 5, 27]);
    const today = moment([moment().format('YYYY'), moment().format('M'), moment().format('D')]);
    console.log("Diff Day:", testDate.diff(today, 'days'), "days");
  }

  async IRPRefreshmentAdjustment(orderId){
    
    //await this.findDiffDay();
    //Select the New Order
    console.log("order id:", orderId);
    //Get the Origin, Des and DT of N order
    const newOrderDetails = await this.createNewOrderORIandDES(orderId);
    //check new order is exist. if there is not exists, throw error.
    if(newOrderDetails === null) throw new Error("This order is not exist.");
    //H2Hcase: true, H2Acase: false
    let H2Hcase = true;
    // Is the new order destination is 'Airport'
    
    if(this.orderNDES.placeType === "AIRPORT"){
      H2Hcase = false;
      // H2A case
      const lockedOrderORIPlaceSameDES = await this.makeAListOfDriversH2A_ORI();
      const checkOrderNORIisExist = await this.checkOrderNORIIsExistInPlaceList(lockedOrderORIPlaceSameDES);
      //check the order ORI place id is Exists in a list of locked points. If there is, send back those CLs
      if(checkOrderNORIisExist.status === true){
        //H2A ORI case
        //get all of the CL list
        let AllOfSelectedCL = checkOrderNORIisExist.place;
        
        while(AllOfSelectedCL.length !== 0){
          //choose the first CL
          let selectedCL = {...AllOfSelectedCL[0]};
          //get plan id of this CL
          const planN = selectedCL.planId;
          //get all details of this plan id
          const planDetails = await Plans.findOne({ where: {id: planN} });
          //find the driver of this plan //
          this.driver = { id: planDetails.driverId };
          //find locked order by plan id in array of locked points order ORI type
          const lockOrderInPlanN = [];
          lockedOrderORIPlaceSameDES.forEach(order => { if(order.planId === planN){ lockOrderInPlanN.push(order); }});
          //find all of order in the plan locations that selected CL is belong to
          let ordersInPlan = await PlanLocations.findAll({ where: { planId: planN }});
          ordersInPlan = await ordersInPlan.map(order => order.toJSON());
          await ordersInPlan.forEach(order => {order.id = order.orderId});
          //prepare all details of order which selected plan is belong to include their status
          const formatedOrdersInPlan = await this.changeOrderInPlanToCalculatingFormat(ordersInPlan);
          //Get only locked points included their details
          let filterLockedPoints = [];
          await Promise.all(lockOrderInPlanN.map(async order => {
            await formatedOrdersInPlan.forEach(o => {
              if(order.id === o.id && order.type === o.type){
                filterLockedPoints.push(o);
              }
            });
          }));
          //filter the collecting points by collectingTime (ASC)
          filterLockedPoints = _.orderBy(filterLockedPoints, ["collectingTime"], ["ASC"]);
          //find the first locked point
          const firstLocked = filterLockedPoints[0];
          //find the last locked point
          const lastLocked = filterLockedPoints[filterLockedPoints.length - 1];
          //find the orderZ DES process
          //H2A case //the last case is always 'airport'                                                            
          //get airport destination from order in plan that destination is airport and status is equal to delivering
          let airportDES = [...formatedOrdersInPlan.filter(order => order.type === "DES" && order.placeType === "AIRPORT" && order.status === "DELIVERING")];
          //sort the all destination is airport and delivering by arrivingTime
          airportDES = [..._.orderBy(airportDES, ["arrivingTime"], ["ASC"])];
          //order z destination will be the first one
          const orderZDES = {...airportDES[0]};
          //check that Is the arrivingTime of orderN is greater than orderZ DES arrivingTime ?
          if(moment(this.orderN.arrivingTime).toDate() >= moment(orderZDES.arrivingTime).toDate()){
            //find the current car capacity used of the car
            let currentLuggages = await this.findCurrentCarCapacity(formatedOrdersInPlan, lastLocked);
            //find the maximum car capacity of the car
            let maximumCarCapacity = await this.getCarCapacityByPlanId(planN);
            //real is <=
            if(currentLuggages + this.orderN.numberOfLuggage <= maximumCarCapacity){
              //find the selected CL plan details
              let planLocationDetails = await PlanLocations.findOne({
                include: [{ model: Plans, include: [{ model: Drivers, include: [{ model: Cars }]}]}],
                where: { orderId: selectedCL.id }
              });
              //Get refreshing plan details
              let refreshingPlanDetails = {
                planId: planLocationDetails.planId,
                driverId: planLocationDetails.plan.driverId,
                carCapacity: planLocationDetails.plan.driver.car.carCapacity,
                workingStatus: "WORKING" //we use only working because sometime the plan status is equal to waiting 
                //but there is locked points as same as the plan order status working
              };
              //check that new Orders is same place as which locked (firstLocked, lastLocked);
              let sameLockedPoint = null;
              if(firstLocked.placeId === this.newOrderORI.placeId){
                sameLockedPoint = {...firstLocked};
              }else{
                sameLockedPoint = {...lastLocked};
              }
              //refresh the plan //this plan is included same ORI (firstLocked, lastLocked)
              await this.refreshSelectedPlanAdjustmentH2A(refreshingPlanDetails, sameLockedPoint);//removeLockedPoint is always null            
              return; //Don't forget to remove it
            }else{
              //new order cannot come into IRP
              //then check for remove last locked
              //unlocked the last locked
              await Orders.update({status: 2}, {where: {id: lastLocked.id}});
              if(this.newOrderORI.placeId === firstLocked.placeId){
                //change last locked point to first locked point (unlocked lastlocked)
                //find the current car capacity used of the car
                let currentLuggages = await this.findCurrentCarCapacity(formatedOrdersInPlan, firstLocked);
                //find the maximum car capacity of the car
                let maximumCarCapacity = await this.getCarCapacityByPlanId(planN);
                //check: Is car capacity available?
                if(currentLuggages + this.orderN.numberOfLuggage <= maximumCarCapacity){
                  //find the selected CL plan details
                  let planLocationDetails = await PlanLocations.findOne({
                    include: [{ model: Plans, include: [{ model: Drivers, include: [{ model: Cars }]}]}],
                    where: { orderId: selectedCL.id }
                  });
                  //Get refreshing plan details
                  let refreshingPlanDetails = {
                    planId: planLocationDetails.planId,
                    driverId: planLocationDetails.plan.driverId,
                    carCapacity: planLocationDetails.plan.driver.car.carCapacity,
                    workingStatus: "WORKING" //we use only working because sometime the plan status is equal to waiting 
                    //but there is locked points as same as the plan order status working
                  };
                  //refresh the plan
                  await this.refreshSelectedPlanAdjustmentH2A(refreshingPlanDetails, {...firstLocked});
                  return;
                }else{
                  //restore last locked status
                  if(lastLocked.type === "ORI"){
                    await Orders.update({status: 6}, {where: {id: lastLocked.id}});
                  }else{
                    await Orders.update({status: 7}, {where: {id: lastLocked.id}});
                  }
                  
                  //remove selected CL
                  AllOfSelectedCL = await this.removeSelectedCL(AllOfSelectedCL, selectedCL);
                  console.log("continue#1");
                  //return; //Don't forget to remove it
                  continue;
                }
              }else{
                //remove selected CL
                AllOfSelectedCL = await this.removeSelectedCL(AllOfSelectedCL, selectedCL);
                console.log("continue#2");
                //return; //Don't forget to remove it
                continue;
              }
              return; //Don't forget to remove it
            }
          }else{
            console.log("AT of orderN is less than orderZ DES");
            //create tempIRPList
            this.tempIRPList = [...formatedOrdersInPlan];
            //push orderN DES to the tempIRPList to re-calculate arivingTime
            this.tempIRPList.push(this.orderNDES);
            //update all of arrivingTime
            await this.updateNewATForBeforeCheckingAvailable();
            //find order A DES
            const orderADES = await this.findOrderADES();
            //calculate TT from last locked to order A DES
            const TTLastLockedToADES = await this.getSmartDuration(lastLocked.placeId, orderADES.placeId, lastLocked.collectingTime);
            //check: Last locked point + TT to orderA DES is lower or equal to orderA AT                                                                                                                                                                                       
            if( moment(lastLocked.collectingTime).add(TTLastLockedToADES, "seconds").toDate() <= moment(orderADES.arrivingTime).toDate() ){ 
              //find the current car capacity used of the car
              let currentLuggages = await this.findCurrentCarCapacity(formatedOrdersInPlan, lastLocked);
              //find the maximum car capacity of the car
              let maximumCarCapacity = await this.getCarCapacityByPlanId(planN);
              if(currentLuggages + this.orderN.numberOfLuggage <= maximumCarCapacity){
                //find the selected CL plan details
                let planLocationDetails = await PlanLocations.findOne({
                  include: [{ model: Plans, include: [{ model: Drivers, include: [{ model: Cars }]}]}],
                  where: { orderId: selectedCL.id }
                });
                //Get refreshing plan details
                let refreshingPlanDetails = {
                  planId: planLocationDetails.planId,
                  driverId: planLocationDetails.plan.driverId,
                  carCapacity: planLocationDetails.plan.driver.car.carCapacity,
                  workingStatus: "WORKING" //we use only working because sometime the plan status is equal to waiting 
                  //but there is locked points as same as the plan order status working
                };
                //refresh the plan
                await this.refreshSelectedPlanAdjustment(refreshingPlanDetails);
                return; //Don't forget to remove it
              }else{
                console.log("currentLuggages is not avaliable#2");
                if(this.orderN.placeId === firstLocked.placeId){
                  //change last locked point to first locked point (unlocked lastlocked)
                  lastLocked = {...firstLocked};
                  //find the current car capacity used of the car
                  let currentLuggages = await this.findCurrentCarCapacity(formatedOrdersInPlan, lastLocked);
                  //find the maximum car capacity of the car
                  let maximumCarCapacity = await this.getCarCapacityByPlanId(planN);
                  //check: Is car capacity available?
                  if(currentLuggages + this.orderN.numberOfLuggage <= maximumCarCapacity){
                    //find the selected CL plan details
                    let planLocationDetails = await PlanLocations.findOne({
                      include: [{ model: Plans, include: [{ model: Drivers, include: [{ model: Cars }]}]}],
                      where: { orderId: selectedCL.id }
                    });
                    //Get refreshing plan details
                    let refreshingPlanDetails = {
                      planId: planLocationDetails.planId,
                      driverId: planLocationDetails.plan.driverId,
                      carCapacity: planLocationDetails.plan.driver.car.carCapacity,
                      workingStatus: "WORKING" //we use only working because sometime the plan status is equal to waiting 
                      //but there is locked points as same as the plan order status working
                    };
                    //refresh the plan
                    await this.refreshSelectedPlanAdjustment(refreshingPlanDetails);
                    return;
                  }else{
                    //remove selected CL
                    AllOfSelectedCL = await this.removeSelectedCL(AllOfSelectedCL, selectedCL);
                    console.log("continue#3");
                    // return; //Don't forget to remove it
                    continue;
                  }
                }else{
                  //remove selected CL
                  AllOfSelectedCL = await this.removeSelectedCL(AllOfSelectedCL, selectedCL);
                  console.log("continue#4");
                  // return; //Don't forget to remove it
                  continue;
                }
              }
            }else{
              //remove selected CL
              AllOfSelectedCL = await this.removeSelectedCL(AllOfSelectedCL, selectedCL);
              console.log("continue#5");
              // return; //Don't forget to remove it
              continue;
            }
          }
        }
      }else{
        //H2A DES case //included the format
        let AllOfSelectedCL = await this.makeAListOfDriversH2A_DES();
        
        //Is there any CLs
        while(AllOfSelectedCL.length != 0){
          //sort the all CLs by transportationTime (ASC)
          const sortedAllOfSelectedCLByTT = [..._.orderBy(AllOfSelectedCL, ["transportationTime"], ["ASC"])];
          //selectedCL = the lowest transportationTime
          let selectedCL = {...sortedAllOfSelectedCLByTT[0]};
          //find the same TT as same as selectedCL
          let selectedCLSameTT =  await sortedAllOfSelectedCLByTT.filter(order => order.placeId === selectedCL.placeId && order.transportationTime === selectedCL.transportationTime);
          //there is only one lowest transportationTime
          
          if(selectedCLSameTT.length === 1){
            //find the selected CL plan details
            let planLocationDetails = await PlanLocations.findOne({
              include: [{ model: Plans, include: [{ model: Drivers, include: [{ model: Cars }]}]}],
              where: { orderId: selectedCLSameTT[0].id }
            });
            //get the details of selected plan details
            let refreshingPlanDetails = {
              planId: planLocationDetails.planId,
              driverId: planLocationDetails.plan.driverId,
              carCapacity: planLocationDetails.plan.driver.car.carCapacity,
              workingStatus: planLocationDetails.plan.status
            };
            // get rollback data
            await this.getRefreshmentData(refreshingPlanDetails.planId, refreshingPlanDetails.workingStatus);
            //refresh the plan

            console.log("refreshingPlanDetails", refreshingPlanDetails);
            console.log("refreshmentData", this.refreshmentData);
            await this.refreshSelectedPlanAdjustment(refreshingPlanDetails);
            console.log("come after refreshment...");
            
            let newOrderIsAvailable = await this.checkNewOrderIsExistsInTheIRP();

            if(newOrderIsAvailable === false){
              console.log("AllOfSelectedCL before:", AllOfSelectedCL);
              AllOfSelectedCL = await this.removeAllDriverCL(AllOfSelectedCL);
              console.log("AllOfSelectedCL after:", AllOfSelectedCL);
              await this.rollbackOrderStatus();
              return;
            }else{
              console.log("Really end process....");
              return;
            }

          }else{
            selectedCL = selectedCLSameTT[0];
            //there is more than one lowest transportationTime
            console.log("there is more than one lowest transportationTime");
            //find selected order is belong to which plan
            let selectedOrderPlanId = await PlanLocations.findOne({ attributes:["planId"], where: {orderId: selectedCL.id}});
            //console.log("selectedOrderPlanId", selectedOrderPlanId);
            //find all orders in the plan 
            let allOrderInPlanLocations = await PlanLocations.findAll({attributes: ["planId", "orderId", "placeId"], where: {planId: selectedOrderPlanId.planId, type: "DES"}});
            let allOrderInPlanExcludeDelivered = [];
            //filter all of order destination exclude which order status deleivered
            allOrderInPlanLocations = await Promise.all(allOrderInPlanLocations.map(async order => {
              let orderDetails = await Orders.findOne({where: {id: order.orderId}});
              if(orderDetails.status != 5){
                allOrderInPlanExcludeDelivered.push(order.toJSON());
              }
            }));
            //checkDoes any of those driver's DES equal to orderN destinations?
            let checkSameDes = false;
            await allOrderInPlanExcludeDelivered.forEach(order => {
              if(order.placeId === this.orderNDES.placeId){
                checkSameDes = true;
              }
            });

            if(checkSameDes === true){
              //find the selected CL plan details
              let planLocationDetails = await PlanLocations.findOne({
                include: [{ model: Plans, include: [{ model: Drivers, include: [{ model: Cars }]}]}],
                where: { orderId: selectedCL.id }
              });
              //get the details of selected plan details
              let refreshingPlanDetails = {
                planId: planLocationDetails.planId,
                driverId: planLocationDetails.plan.driverId,
                carCapacity: planLocationDetails.plan.driver.car.carCapacity,
                workingStatus: planLocationDetails.plan.status
              };

              await this.getRefreshmentData(refreshingPlanDetails.planId, refreshingPlanDetails.workingStatus);
              //refresh the plan
              await this.refreshSelectedPlanAdjustment(refreshingPlanDetails);

              let newOrderIsAvailable = await this.checkNewOrderIsExistsInTheIRP();
              if(newOrderIsAvailable === false){
                AllOfSelectedCL = await this.removeAllDriverCL(AllOfSelectedCL);
                await this.rollbackOrderStatus();
              }else{
                console.log("Really end process....");
                return;
              }
            }else{
              //Choose the driver with the bigger Car Cap left. Over all Capacity from IRP
              //find plan id list of those selected orders
              let allPlanInSelectedOrders = [];
              await Promise.all(selectedCLSameTT.map(async order => {
                let orderDetails = await PlanLocations.findOne({ attributes: ["planId"], where: { orderId: order.id }});
                allPlanInSelectedOrders.push(orderDetails.planId);                                                                                       
              }));
              //uniq plan Id in planList
              allPlanInSelectedOrders = _.uniq(allPlanInSelectedOrders);
              
              let orderInPlanDetails = [];
              await Promise.all(allPlanInSelectedOrders.map(async plan => {
                let carCapacityUsed = 0;

                let ordersInPlan = await PlanLocations.findAll({
                  include: [{
                    model: Orders
                  }],
                  where: { planId: plan, type: "ORI" }
                });

                console.log();
                await ordersInPlan.map(o => {
                  carCapacityUsed = carCapacityUsed + o.order.numberOfLuggage;
                });
                //find detail of each plan and car capacity left
                let planLocationDetails = await PlanLocations.findOne({
                  include: [{ 
                    model: Plans, 
                    include: [{ 
                      model: Drivers, 
                      include: [{ 
                        model: Cars 
                      }]
                    }
                  ]}],
                  where: { planId: plan }
                });
                
                orderInPlanDetails.push({
                  planId: planLocationDetails.planId,
                  driverId: planLocationDetails.plan.driverId,
                  carCapacity: (planLocationDetails.plan.driver.car.carCapacity),
                  workingStatus: planLocationDetails.plan.status,
                  carCapacityLeft: (planLocationDetails.plan.driver.car.carCapacity) - carCapacityUsed
                });

              }));
              //sort all of plan by Car capacity 
              orderInPlanDetails = _.orderBy(orderInPlanDetails, ["carCapacityLeft"], ["desc"]);
              let refreshingPlanDetails = {...orderInPlanDetails[0]};
              //rollback plan data
              await this.getRefreshmentData(refreshingPlanDetails.planId, refreshingPlanDetails.workingStatus);
              //refresh the plan
              await this.refreshSelectedPlanAdjustment(refreshingPlanDetails);
              if(newOrderIsAvailable === false){
                AllOfSelectedCL = await this.removeAllDriverCL(AllOfSelectedCL);
                await this.rollbackOrderStatus();
              }else{
                console.log("Really end process....");
                return;
              }
            }
          }
        }
      }
      return;
    }else{
      console.log("H2H case");
      // H2H case
      let AllOfSelectedCL = await this.makeAListOfDriversH2H();
      //Is there any CLs
      while(AllOfSelectedCL.length != 0){
        //sort the all CLs by transportationTime (ASC)
        const sortedAllOfSelectedCLByTT = [..._.orderBy(AllOfSelectedCL, ["transportationTime"], ["ASC"])];
        //selectedCL = the lowest transportationTime
        let selectedCL = {...sortedAllOfSelectedCLByTT[0]};
        //find the same TT as same as selectedCL
        let selectedCLSameTT =  await sortedAllOfSelectedCLByTT.filter(order => order.placeId === selectedCL.placeId && order.transportationTime === selectedCL.transportationTime);
        //there is only one lowest transportationTime

        if(selectedCLSameTT.length === 0){
          //find the selected CL plan details
          let planLocationDetails = await PlanLocations.findOne({
            include: [{ model: Plans, include: [{ model: Drivers, include: [{ model: Cars }]}]}],
            where: { orderId: selectedCL.id }
          });
          //get the details of selected plan details
          let refreshingPlanDetails = {
            planId: planLocationDetails.planId,
            driverId: planLocationDetails.plan.driverId,
            carCapacity: planLocationDetails.plan.driver.car.carCapacity,
            workingStatus: planLocationDetails.plan.status
          };
          //rollback plan data
          await this.getRefreshmentData(refreshingPlanDetails.planId, refreshingPlanDetails.workingStatus);
          //refresh the plan
          await this.refreshSelectedPlanAdjustment(refreshingPlanDetails);
          let newOrderIsAvailable = await this.checkNewOrderIsExistsInTheIRP();
          if(newOrderIsAvailable === false){
            await this.removeAllDriverCL(AllOfSelectedCL);
            await this.rollbackOrderStatus();
          }
          return;
        }else{
          selectedCL = selectedCLSameTT[0];
          //there is more than one lowest transportationTime
          console.log("there is more than one lowest transportationTime");
          //find selected order is belong to which plan
          let selectedOrderPlanId = await PlanLocations.findOne({ attributes:["planId"], where: {orderId: selectedCL.id}});
          //console.log("selectedOrderPlanId", selectedOrderPlanId);
          //find all orders in the plan 
          let allOrderInPlanLocations = await PlanLocations.findAll({attributes: ["planId", "orderId", "placeId"], where: {planId: selectedOrderPlanId.planId, type: "DES"}});
          let allOrderInPlanExcludeDelivered = [];
          //filter all of order destination exclude which order status deleivered
          allOrderInPlanLocations = await Promise.all(allOrderInPlanLocations.map(async order => {
            let orderDetails = await Orders.findOne({where: {id: order.orderId}});
            if(orderDetails.status != 5){
              allOrderInPlanExcludeDelivered.push(order.toJSON());
            }
          }));
          //checkDoes any of those driver's DES equal to orderN destinations?
          let checkSameDes = false;
          await allOrderInPlanExcludeDelivered.forEach(order => {
            if(order.placeId === this.orderNDES.placeId){
              checkSameDes = true;
            }
          });

          if(checkSameDes === true){
            //find the selected CL plan details
            let planLocationDetails = await PlanLocations.findOne({
              include: [{ model: Plans, include: [{ model: Drivers, include: [{ model: Cars }]}]}],
              where: { orderId: selectedCL.id }
            });
            //get the details of selected plan details
            let refreshingPlanDetails = {
              planId: planLocationDetails.planId,
              driverId: planLocationDetails.plan.driverId,
              carCapacity: planLocationDetails.plan.driver.car.carCapacity,
              workingStatus: planLocationDetails.plan.status
            };
            //rollback plan data
            await this.getRefreshmentData(refreshingPlanDetails.planId, refreshingPlanDetails.workingStatus);
            //refresh the plan
            await this.refreshSelectedPlanAdjustment(refreshingPlanDetails);
            let newOrderIsAvailable = await this.checkNewOrderIsExistsInTheIRP();
            if(newOrderIsAvailable === false){
              await this.removeAllDriverCL(AllOfSelectedCL);
              await this.rollbackOrderStatus();
            }
            return;
          }else{
            //Choose the driver with the bigger Car Cap left. Over all Capacity from IRP
            //find plan id list of those selected orders
            let allPlanInSelectedOrders = [];
            await Promise.all(selectedCLSameTT.map(async order => {
              let orderDetails = await PlanLocations.findOne({ attributes: ["planId"], where: { orderId: order.id }});
              allPlanInSelectedOrders.push(orderDetails.planId);                                                                                       
            }));
            //uniq plan Id in planList
            allPlanInSelectedOrders = _.uniq(allPlanInSelectedOrders);
            
            let orderInPlanDetails = [];
            await Promise.all(allPlanInSelectedOrders.map(async plan => {
              let carCapacityUsed = 0;

              let ordersInPlan = await PlanLocations.findAll({
                include: [{
                  model: Orders
                }],
                where: { planId: plan, type: "ORI" }
              });

              console.log();
              await ordersInPlan.map(o => {
                carCapacityUsed = carCapacityUsed + o.order.numberOfLuggage;
              });
              //find detail of each plan and car capacity left
              let planLocationDetails = await PlanLocations.findOne({
                include: [{ 
                  model: Plans, 
                  include: [{ 
                    model: Drivers, 
                    include: [{ 
                      model: Cars 
                    }]
                  }
                ]}],
                where: { planId: plan }
              });
              
              orderInPlanDetails.push({
                planId: planLocationDetails.planId,
                driverId: planLocationDetails.plan.driverId,
                carCapacity: (planLocationDetails.plan.driver.car.carCapacity),
                workingStatus: planLocationDetails.plan.status,
                carCapacityLeft: (planLocationDetails.plan.driver.car.carCapacity) - carCapacityUsed
              });

            }));
            //sort all of plan by Car capacity 
            orderInPlanDetails = _.orderBy(orderInPlanDetails, ["carCapacityLeft"], ["desc"]);
            let refreshingPlanDetails = {...orderInPlanDetails[0]};
            //rollback plan data
            await this.getRefreshmentData(refreshingPlanDetails.planId, refreshingPlanDetails.workingStatus);
            //refresh the plan
            await this.refreshSelectedPlanAdjustment(refreshingPlanDetails);
            let newOrderIsAvailable = await this.checkNewOrderIsExistsInTheIRP();
            if(newOrderIsAvailable === false){
              await this.removeAllDriverCL(AllOfSelectedCL);
              await this.rollbackOrderStatus();
            }
            return;
          }
        }
      }
    }
    return;
  }

  async getRefreshmentData(planId, workingStatus) {
    let planLocationDetails = await PlanLocations.findAll({
      where: { planId: planId}
    });

    let ordersInPlan = _.uniq(await planLocationDetails.map(order => order.orderId));
    let data = [];
    await Promise.all(ordersInPlan.map( async orderId => {
      let orderDetails = await Orders.findOne({where: {id: orderId}});
      data.push({ orderId: orderDetails.id, status: orderDetails.status });
    }));

    this.refreshmentData = {
      planId: planId,
      orders: data,
      workingStatus: workingStatus
    };
  }
  
  async removeAllDriverCL(AllOfSelectedCL){
    const removePlanId = this.refreshmentData.planId;
    let removingOrdersDetails = [...this.refreshmentData.orders];
    let removingOrders = await removingOrdersDetails.map(order => order.orderId);
    let previousAllOfSelectedCL = [];
    await AllOfSelectedCL.map(order => {
      if(!removingOrders.includes(order.id)){
        previousAllOfSelectedCL.push(order);
      }
    });

    AllOfSelectedCL = [...previousAllOfSelectedCL];
    return AllOfSelectedCL;
  }

  async removeSelectedCL(AllOfSelectedCL, selectedCL){
    AllOfSelectedCL = await AllOfSelectedCL.filter(order => !(order.id === selectedCL.id && order.type === selectedCL.type && order.planId === selectedCL.planId));
    AllOfSelectedCL = await AllOfSelectedCL.filter(order => !(order.placeId === selectedCL.placeId && order.planId === selectedCL.planId));
    return AllOfSelectedCL;
  }

  async makeAListOfDriversH2A_ORI(){
    //find the plan status 'working' and 'waiting' details
    const workingPlanDetails = await Plans.findAll({
      where: {
        status: { [Op.in]: ["WORKING", "WAITING"] },
      }
    });
    // get only plan id
    let workingPlans = await workingPlanDetails.map(plan => plan.id);
    
    //get plans same airport route (BKK or DMK)
    const workingPlanSameDES = [];
    await Promise.all(workingPlans.map(async (pId) => {
      let orderDetails = await PlanLocations.findAll({
        where: {
          planId: pId,
          type: "DES"
        },attributes: ["id", "planId", "orderId", "placeId", "collectingTime"]
      });
      
      orderDetails = _.orderBy(orderDetails, ["collectingTime"], ["ASC"]);
      //console.log(orderDetails);

      if(orderDetails[orderDetails.length - 1].placeId === this.orderNDES.placeId){
        workingPlanSameDES.push(pId);
      }
    }));

    //get all of orders in each plan which as same as destination
    let ordersInPlanSameDES = [];
    await Promise.all(workingPlanSameDES.map(async (pId) => {
      let orders = await PlanLocations.findAll({
        where: {
          planId: pId
        }
      });

      ordersInPlanSameDES = [...ordersInPlanSameDES, ...orders.map(o => {
        return {
          id: o.orderId,
          type: o.type,
          planId: pId,
          placeId: o.placeId
        };
      })];
    }));

    //get all of locked points same airport route
    let lockedOrderSameDES = [];
    await Promise.all(ordersInPlanSameDES.map(async (order) => {
      let orderLocked = await Orders.findOne({
        where: {
          id: order.id
        }
      });

      if(orderLocked.dataValues.status === 6 || orderLocked.dataValues.status === 7){
        let data = {
            id: order.id,
            type: order.type,
            planId: order.planId,
            placeId: order.placeId
        };
        // get locked point ORI and DES
        if(orderLocked.dataValues.status === 6 && order.type === "ORI"){
          lockedOrderSameDES.push(data);
        }else if(orderLocked.dataValues.status === 7 && order.type === "DES"){
          lockedOrderSameDES.push(data);
        }
      }
    }));
  
    let lockedOrderORIPlaceSameDES = await this.getORIPlaceIdList(lockedOrderSameDES);
    lockedOrderORIPlaceSameDES = _.orderBy(lockedOrderORIPlaceSameDES, ["planId", "collectingTime"], ["ASC", "ASC"]);
    return lockedOrderORIPlaceSameDES;
  }

  async makeAListOfDriversH2A_DES(){
    
    //find the plan status 'working' and 'waiting' details
    const workingPlanDetails = await Plans.findAll({
      where: {
        status: { [Op.in]: ["WORKING", "WAITING"] },
      }
    });
    // get only plan id
    let workingPlans = await workingPlanDetails.map(plan => plan.id);
    
    // filter plan id only go to the same destination airport route
    let workingPlanSameDES = [];
    await Promise.all(workingPlans.map(async (pId) => {
      let orderDetails = await PlanLocations.findAll({
        where: {
          planId: pId
        },attributes: ["id", "planId", "orderId", "placeId", "collectingTime", "type"]
      });
      
      orderDetails = _.orderBy(orderDetails, ["collectingTime"], ["ASC"]);

      if(orderDetails[orderDetails.length - 1].placeId === this.orderNDES.placeId){
        workingPlanSameDES.push(pId);
      }
      //uniqe the working plans
      workingPlanSameDES = _.uniq(workingPlanSameDES);
    }));
    
    //get some of orders's details in selected plan
    let ordersInPlanSameDES = [];
    await Promise.all(workingPlanSameDES.map(async (pId) => {
      let orders = await PlanLocations.findAll({
        where: {
          planId: pId
        }
      });

      ordersInPlanSameDES = [...ordersInPlanSameDES, ...orders.map(o => {
        return {
          id: o.orderId,
          type: o.type,
          planId: pId,
          placeId: o.placeId
        };
      })];
    }));
    
    let formatedOrdersInPlans = await this.changeOrderInPlanToCalculatingFormat(ordersInPlanSameDES);
    //Airport DES can not be CL in CL List
    formatedOrdersInPlans = [...formatedOrdersInPlans.filter(order => !(order.placeType === "AIRPORT" && order.type === "DES"))];
    
    //create selected CL List
    const AllOfSelectedCL = [];
    await Promise.all(formatedOrdersInPlans.map(async order => {
      let orderDetails = await Orders.findOne({
        where: {
          id: order.id
        }
      });
      //Remove order status is equal to DELIVERED
      if(orderDetails.status !== 5){
        AllOfSelectedCL.push(order);
      }
    }));

    //find TT
    await Promise.all(AllOfSelectedCL.map(async order => {
      //find each order plan details
      let planDetails = await PlanLocations.findOne({
        where: {
          orderId: order.id
        }
      });
      //find each order driver 
      let driverDetails = await Plans.findOne({
        where: {
          id: planDetails.planId
        }
      });
      //setting driver 
      this.driver = { id: driverDetails.driverId };
      //find the transportationTime of orderN ORI to each CL in CL List
      let TTOrderNToEachCL = await this.getSmartDuration(this.orderN.placeId, order.placeId, moment(this.orderN.time).toDate());
      order.transportationTime = TTOrderNToEachCL;
    }));

    return [...AllOfSelectedCL];
  }

  async makeAListOfDriversH2H(){
    //find the plan status 'working' and 'waiting' details
    const workingPlanDetails = await Plans.findAll({
      where: {
        status: { [Op.in]: ["WORKING", "WAITING"] },
      }
    });
    // get only plan id
    let workingPlans = await workingPlanDetails.map(plan => plan.id);
    let workingPlanH2H = [...workingPlans];
    //uniqe the working plans H2H
    workingPlanH2H = _.uniq(workingPlanH2H);

    //get some of orders's details in selected plan
    let ordersInPlanH2H = [];
    await Promise.all(workingPlanH2H.map(async (pId) => {
      let orders = await PlanLocations.findAll({
        where: {
          planId: pId
        }
      });

      ordersInPlanH2H = [...ordersInPlanH2H, ...orders.map(o => {
        return {
          id: o.orderId,
          type: o.type,
          planId: pId,
          placeId: o.placeId
        };
      })];
    }));

    let formatedOrdersInPlans = await this.changeOrderInPlanToCalculatingFormat(ordersInPlanH2H);
    //Airport DES can not be CL in CL List
    formatedOrdersInPlans = [...formatedOrdersInPlans.filter(order => !(order.placeType === "AIRPORT" && order.type === "DES"))];
    //create selected CL List
    const AllOfSelectedCL = [];
    await Promise.all(formatedOrdersInPlans.map(async order => {
      let orderDetails = await Orders.findOne({
        where: {
          id: order.id
        }
      });
      //Remove order status is equal to DELIVERED
      if(orderDetails.status !== 5){
        AllOfSelectedCL.push(order);
      }
    }));

    //find TT
    await Promise.all(AllOfSelectedCL.map(async order => {
      //find each order plan details
      let planDetails = await PlanLocations.findOne({
        where: {
          orderId: order.id
        }
      });
      //find each order driver 
      let driverDetails = await Plans.findOne({
        where: {
          id: planDetails.planId
        }
      });
      //setting driver 
      this.driver = { id: driverDetails.driverId };
      //find the transportationTime of orderN ORI to each CL in CL List
      let TTOrderNToEachCL = await this.getSmartDuration(this.orderN.placeId, order.placeId, moment(this.orderN.time).toDate());
      order.transportationTime = TTOrderNToEachCL;
    }));

    return [...AllOfSelectedCL];
  }

  async checkLockedpointIsExists(planId){
    let lockedPointExists = false;
    let ordersInplan = await PlanLocations.findAll({
      where: {
        planId: planId
      }
    });
    
    ordersInplan = _.uniq(ordersInplan.map(order => order.orderId));
    await Promise.all(ordersInplan.map(async order => {
      let orderDetails = await Orders.findOne({
        where: {
          id: order
        }
      });
      if(orderDetails.status === 6 || orderDetails.status === 7){
        lockedPointExists = true;
      }
    }));
    
    return lockedPointExists;
  };

  async refreshSelectedPlanAdjustment(selectedPlan){
    //setting driver
    this.driver = {
      id: selectedPlan.driverId,
      carCapacity: selectedPlan.carCapacity
    };

    let checkLPisExist = false;
    checkLPisExist = await this.checkLockedpointIsExists(selectedPlan.planId);
    if(selectedPlan.workingStatus === "WAITING" && checkLPisExist === true){
      selectedPlan.workingStatus = "WORKING"
    }

    if(selectedPlan.workingStatus === "WORKING"){
      //order each status
      const orderStatusLockedORI = [];
      const orderStatusLockedDES = [];
      const orderStatusDelivered = [];
      const orderStatusDelivering = [];
      const orderStatusPlaned = [];

      const allOfLocationsInIRP = await PlanLocations.findAll({
        include: [{
          model: Orders
        }],
        where: {planId: selectedPlan.planId}
      });

      //get all loctions in irp
      await allOfLocationsInIRP.map(location => {
        //data format location in irp
        let data = {
          planId: selectedPlan.planId,
          orderId: location.orderId,
          orderStatus: location.order.status,
          typeOfOrder: location.type };

        // locked ori and locked des
        if(location.order.status === 6 || location.order.status === 7){
          if(location.type === "ORI" && location.order.status === 6){
            orderStatusLockedORI.push(data);
          }else if(location.type === "DES" && location.order.status === 7){
            orderStatusLockedDES.push(data);
          }
        }
        //delivered order
        if(location.order.status === 5){
          orderStatusDelivered.push(data);
        }
        //delivering order
        if(location.order.status === 4){
          orderStatusDelivering.push(data);
        }
        //planed order
        if(location.order.status === 2){
          orderStatusPlaned.push(data);
        }
      });

      //get order planed uniq 
      let ordersStatusPlaned = [...await orderStatusPlaned.map(order => order.orderId)];
      ordersStatusPlaned = _.uniq(ordersStatusPlaned);
      //get order delivered uniq
      let ordersStatusDelivered = [...await orderStatusDelivered.map(order => order.orderId)];
      ordersStatusDelivered = _.uniq(ordersStatusDelivered);
      //get order delivering uniq
      let ordersStatusDelivering = [...await orderStatusDelivering.map(order => order.orderId)];
      ordersStatusDelivering = _.uniq(ordersStatusDelivering);
      await Orders.update({ status: 1 }, { where: { id: { [Op.in]: [...ordersStatusPlaned] }}});

      //create ori and des case (locked ori)
      const orderORIFromLockedORI= [];
      const orderDESFromLockedORI = [];
      await Promise.all(orderStatusLockedORI.map(async order => {
        let details = await PlanLocations.findOne({
          include: [{
            model: Orders,
            include: [
              {
                model: Places,
                as: 'originPlace',
                include: [{ model: PlaceTypes, as: 'type' }],
              },
              {
                model: Places,
                as: 'destinationPlace',
                include: [{ model: PlaceTypes, as: 'type' }],
              }
            ]
          }],
          where: {
            orderId: order.orderId,
            planId: order.planId,
            type: order.typeOfOrder
          }
        });
        //order ori locked points ORI
        orderORIFromLockedORI.push({
          id: order.orderId,
          code: details.order.code,
          type: "ORI",
          placeId: details.order.originPlaceId,
          placeName: details.order.originPlace.name,
          placeType: details.order.originPlace.type.type,
          latitude: details.order.originPlace.latitude,
          longitude: details.order.originPlace.longitude,
          time: moment(details.order.dropTime).toDate(),
          collectingTime: moment(details.collectingTime).toDate(), //get from plan locations
          possibleCollectingTime: moment(details.collectingTime).toDate(), //get from plan locations
          arrivingTime: moment(details.arrivingTime).toDate(), //get from plan locations
          realArrivingTime: moment(details.order.arrivingTime).toDate(),
          transportationTime: details.transportationTime, //get from plan locations
          status: 'COLLECTED', 
          numberOfLuggage: details.order.numberOfLuggage
        });
        //order ori locked points DES
        orderDESFromLockedORI.push({
          id: order.orderId,
          code: details.order.code,
          type: "DES",
          placeId: details.order.destinationPlaceId,
          placeName: details.order.destinationPlace.name,
          placeType: details.order.destinationPlace.type.type,
          latitude: details.order.destinationPlace.latitude,
          longitude: details.order.destinationPlace.longitude,
          time: moment(details.order.pickupTime).toDate(),
          collectingTime: null, // don't know because we don't not arrive yet
          possibleCollectingTime: null, // don't know because we don't not arrive yet
          arrivingTime: moment(details.order.arrivingTime).toDate(), // order default
          realArrivingTime: moment(details.order.arrivingTime).toDate(), // order default
          transportationTime: null, // dont know yet
          status: 'DELIVERING',
          numberOfLuggage: details.order.numberOfLuggage
        });
      }));

      //create ori and des case (locked des)
      const orderORIFromLockedDES= [];
      const orderDESFromLockedDES = [];
      await Promise.all(orderStatusLockedDES.map(async order => {
        let details = await PlanLocations.findOne({
          include: [{
            model: Orders,
            include: [
              {
                model: Places,
                as: 'originPlace',
                include: [{ model: PlaceTypes, as: 'type' }],
              },
              {
                model: Places,
                as: 'destinationPlace',
                include: [{ model: PlaceTypes, as: 'type' }],
              }
            ]
          }],
          where: {
            orderId: order.orderId,
            planId: order.planId,
            type: order.typeOfOrder
          }
        });

        orderORIFromLockedDES.push({
          id: order.orderId,
          code: details.order.code,
          type: "ORI",
          placeId: details.order.originPlaceId,
          placeName: details.order.originPlace.name,
          placeType: details.order.originPlace.type.type,
          latitude: details.order.originPlace.latitude,
          longitude: details.order.originPlace.longitude,
          time: moment(details.order.dropTime).toDate(),
          collectingTime: moment(details.collectingTime).toDate(),
          possibleCollectingTime: moment(details.collectingTime).toDate(),
          arrivingTime: moment(details.arrivingTime).toDate(),
          realArrivingTime: moment(details.order.arrivingTime).toDate(),
          transportationTime: details.transportationTime,
          status: 'COLLECTED',
          numberOfLuggage: details.order.numberOfLuggage
        });

        orderDESFromLockedDES.push({
          id: order.orderId,
          code: details.order.code,
          type: "DES",
          placeId: details.order.destinationPlaceId,
          placeName: details.order.destinationPlace.name,
          placeType: details.order.destinationPlace.type.type,
          latitude: details.order.destinationPlace.latitude,
          longitude: details.order.destinationPlace.longitude,
          time: moment(details.order.pickupTime).toDate(),
          collectingTime: moment(details.collectingTime).toDate(),
          possibleCollectingTime: moment(details.collectingTime).toDate(),
          arrivingTime: moment(details.arrivingTime).toDate(),
          realArrivingTime: moment(details.order.arrivingTime).toDate(),
          transportationTime: details.transportationTime,
          status: 'DELIVERED',
          numberOfLuggage: details.order.numberOfLuggage
        });
      }));

      //create ori and des for order delivered
      const orderORIFromDelivered= [];
      const orderDESFromDelivered = [];
      await Promise.all(ordersStatusDelivered.map(async order => {
        let details = await PlanLocations.findOne({
          include: [{
            model: Orders,
            include: [
              {
                model: Places,
                as: 'originPlace',
                include: [{ model: PlaceTypes, as: 'type' }],
              },
              {
                model: Places,
                as: 'destinationPlace',
                include: [{ model: PlaceTypes, as: 'type' }],
              }
            ]
          }],
          where: {
            orderId: order,
            planId: selectedPlan.planId
          }
        });

        orderORIFromDelivered.push({
          id: order,
          code: details.order.code,
          type: "ORI",
          placeId: details.order.originPlaceId,
          placeName: details.order.originPlace.name,
          placeType: details.order.originPlace.type.type,
          latitude: details.order.originPlace.latitude,
          longitude: details.order.originPlace.longitude,
          time: moment(details.order.dropTime).toDate(),
          collectingTime: moment(details.collectingTime).toDate(),
          possibleCollectingTime: moment(details.collectingTime).toDate(),
          arrivingTime: moment(details.arrivingTime).toDate(),
          realArrivingTime: moment(details.order.arrivingTime).toDate(),
          transportationTime: details.transportationTime,
          status: 'COLLECTED',
          numberOfLuggage: details.order.numberOfLuggage
        });

        orderDESFromDelivered.push({
          id: order,
          code: details.order.code,
          type: "DES",
          placeId: details.order.destinationPlaceId,
          placeName: details.order.destinationPlace.name,
          placeType: details.order.destinationPlace.type.type,
          latitude: details.order.destinationPlace.latitude,
          longitude: details.order.destinationPlace.longitude,
          time: moment(details.order.pickupTime).toDate(),
          collectingTime: moment(details.collectingTime).toDate(),
          possibleCollectingTime: moment(details.collectingTime).toDate(),
          arrivingTime: moment(details.arrivingTime).toDate(),
          realArrivingTime: moment(details.order.arrivingTime).toDate(),
          transportationTime: details.transportationTime,
          status: 'DELIVERED',
          numberOfLuggage: details.order.numberOfLuggage
        });
      }));

      //create ori and des for order delivering
      const orderORIFromDelivering= [];
      const orderDESFromDelivering = [];
      await Promise.all(ordersStatusDelivering.map(async order => {
        let details = await PlanLocations.findOne({
          include: [{
            model: Orders,
            include: [
              {
                model: Places,
                as: 'originPlace',
                include: [{ model: PlaceTypes, as: 'type' }],
              },
              {
                model: Places,
                as: 'destinationPlace',
                include: [{ model: PlaceTypes, as: 'type' }],
              }
            ]
          }],
          where: {
            orderId: order,
            planId: selectedPlan.planId
          }
        });

        orderORIFromDelivering.push({
          id: order,
          code: details.order.code,
          type: "ORI",
          placeId: details.order.originPlaceId,
          placeName: details.order.originPlace.name,
          placeType: details.order.originPlace.type.type,
          latitude: details.order.originPlace.latitude,
          longitude: details.order.originPlace.longitude,
          time: moment(details.order.dropTime).toDate(),
          collectingTime: moment(details.collectingTime).toDate(),
          possibleCollectingTime: moment(details.collectingTime).toDate(),
          arrivingTime: moment(details.arrivingTime).toDate(),
          realArrivingTime: moment(details.order.arrivingTime).toDate(),
          transportationTime: details.transportationTime,
          status: 'COLLECTED',
          numberOfLuggage: details.order.numberOfLuggage
        });

        orderDESFromDelivering.push({
          id: order,
          code: details.order.code,
          type: "DES",
          placeId: details.order.destinationPlaceId,
          placeName: details.order.destinationPlace.name,
          placeType: details.order.destinationPlace.type.type,
          latitude: details.order.destinationPlace.latitude,
          longitude: details.order.destinationPlace.longitude,
          time: moment(details.order.pickupTime).toDate(),
          collectingTime: null,
          possibleCollectingTime: null,
          arrivingTime: moment(details.order.arrivingTime).toDate(),
          realArrivingTime: moment(details.order.arrivingTime).toDate(),
          transportationTime: null,
          status: 'DELIVERING',
          numberOfLuggage: details.order.numberOfLuggage
        });
      }));

      //setting varriable before refreshment process
      this.IRPList = [];
      this.IRPLocationList = [];
      this.spotList = [];
      //find all of order status waiting
      this.calculatingOrders = await getCalculatingOrders();
      this.calculatingOrders = [...this.calculatingOrders.filter(order => order.originPlace.type.type !== 'AIRPORT')];
      this.spotList = this.calculatingOrders.map((order) => {
        order.type = 'ORI';
        order.placeId = order.originPlace.placeId;
        order.latitude = order.originPlace.latitude;
        order.longitude = order.originPlace.longitude;
        order.time = moment(order.dropTime).toDate();
        order.placeType = order.originPlace.type.type;
        order.possibleCollectingTime = null;
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
      //setting irp list
      this.IRPList = [ ...orderORIFromLockedORI,  ...orderDESFromLockedORI, 
                       ...orderDESFromLockedDES,  ...orderORIFromLockedDES, 
                       ...orderORIFromDelivered,  ...orderDESFromDelivered, 
                       ...orderORIFromDelivering, ...orderDESFromDelivering ];
                       
      //setting irp location list            
      let orderInIRPLocationList = [  ...orderORIFromLockedORI, 
                                      ...orderORIFromLockedDES, ...orderDESFromLockedDES,
                                      ...orderORIFromDelivered, ...orderDESFromDelivered,
                                      ...orderORIFromDelivering
                                   ];
      //sort irp location list
      orderInIRPLocationList = _.orderBy(orderInIRPLocationList, ["collectingTime"], ["asc"]); // sorted by collectingTime
    
      this.IRPLocationList = [ ...orderInIRPLocationList ]; 
      this.tempOrderList = [ ...this.spotList, ...orderDESFromLockedORI, ...orderDESFromDelivering ];
      this.spotList = [...this.tempOrderList];
      this.tempIRPLocationList = [...this.IRPLocationList];
      
      let carCapacityUsed = 0;
      //find the current car capacity
      await this.IRPLocationList.map(order => {
        if(order.type === "ORI"){
          if(order.status === "COLLECTED"){
            carCapacityUsed += order.numberOfLuggage;
          }
        }else{
          if(order.status === "DELIVERED"){
            carCapacityUsed -= order.numberOfLuggage;
          }
        }
      }); 

      this.currentCarCap = this.driver.carCapacity - carCapacityUsed;
      this.endIRPProcess = false;
      await this.processThirdRun();
      return;
    }else{
      await this.changeOrderStatus(selectedPlan, 1);
      await this.initailStartRefreshment(selectedPlan);
      await this.startProcessRefreshment();
      return;
    }
    
  }

  async refreshSelectedPlanAdjustmentH2A(selectedPlan, sameLockedPoint){
    //setting driver
    this.driver = {
      id: selectedPlan.driverId,
      carCapacity: selectedPlan.carCapacity
    };

    this.refreshmentData = {
      planId: selectedPlan.placeId,
      workingStatus: selectedPlan.workingStatus
    };

    let checkLPisExist = false;
    checkLPisExist = await this.checkLockedpointIsExists(selectedPlan.planId);
    if(selectedPlan.workingStatus === "WAITING" && checkLPisExist === true){
      selectedPlan.workingStatus = "WORKING"
    }

    if(selectedPlan.workingStatus === "WORKING"){
      //order each status
      const orderStatusLockedORI = [];
      const orderStatusLockedDES = [];
      const orderStatusDelivered = [];
      const orderStatusDelivering = [];
      const orderStatusPlaned = [];

      const allOfLocationsInIRP = await PlanLocations.findAll({
        include: [{
          model: Orders
        }],
        where: {planId: selectedPlan.planId}
      });

      //get all loctions in irp
      await allOfLocationsInIRP.map(location => {
        //data format location in irp
        let data = {
          planId: selectedPlan.planId,
          orderId: location.orderId,
          orderStatus: location.order.status,
          typeOfOrder: location.type };

        // locked ori and locked des
        if(location.order.status === 6 || location.order.status === 7){
          if(location.type === "ORI" && location.order.status === 6){
            orderStatusLockedORI.push(data);
          }else if(location.type === "DES" && location.order.status === 7){
            orderStatusLockedDES.push(data);
          }
        }

        //delivered order
        if(location.order.status === 5){
          orderStatusDelivered.push(data);
        }
        //delivering order
        if(location.order.status === 4){
          orderStatusDelivering.push(data);
        }
        //planed order
        if(location.order.status === 2){
          orderStatusPlaned.push(data);
        }
      });

      //get order planed uniq 
      let ordersStatusPlaned = [...await orderStatusPlaned.map(order => order.orderId)];
      ordersStatusPlaned = _.uniq(ordersStatusPlaned);
      //get order delivered uniq
      let ordersStatusDelivered = [...await orderStatusDelivered.map(order => order.orderId)];
      ordersStatusDelivered = _.uniq(ordersStatusDelivered);
      //get order delivering uniq
      let ordersStatusDelivering = [...await orderStatusDelivering.map(order => order.orderId)];
      ordersStatusDelivering = _.uniq(ordersStatusDelivering);
      await Orders.update({ status: 1 }, { where: { id: { [Op.in]: [...ordersStatusPlaned] }}});

      //create ori and des case (locked ori)
      let orderORIFromLockedORI= [];
      let orderDESFromLockedORI = [];

      await Promise.all(orderStatusLockedORI.map(async order => {
        let details = await PlanLocations.findOne({
          include: [{
            model: Orders,
            include: [
              {
                model: Places,
                as: 'originPlace',
                include: [{ model: PlaceTypes, as: 'type' }],
              },
              {
                model: Places,
                as: 'destinationPlace',
                include: [{ model: PlaceTypes, as: 'type' }],
              }
            ]
          }],
          where: {
            orderId: order.orderId,
            planId: order.planId,
            type: order.typeOfOrder
          }
        });
        //order ori locked points ORI
        orderORIFromLockedORI.push({
          id: order.orderId,
          code: details.order.code,
          type: "ORI",
          placeId: details.order.originPlaceId,
          placeName: details.order.originPlace.name,
          placeType: details.order.originPlace.type.type,
          latitude: details.order.originPlace.latitude,
          longitude: details.order.originPlace.longitude,
          time: moment(details.order.dropTime).toDate(),
          collectingTime: moment(details.collectingTime).toDate(), //get from plan locations
          possibleCollectingTime: moment(details.collectingTime).toDate(), //get from plan locations
          arrivingTime: moment(details.arrivingTime).toDate(), //get from plan locations
          realArrivingTime: moment(details.order.arrivingTime).toDate(),
          transportationTime: details.transportationTime, //get from plan locations
          status: 'COLLECTED', 
          numberOfLuggage: details.order.numberOfLuggage
        });
        
        //order ori locked points DES
        orderDESFromLockedORI.push({
          id: order.orderId,
          code: details.order.code,
          type: "DES",
          placeId: details.order.destinationPlaceId,
          placeName: details.order.destinationPlace.name,
          placeType: details.order.destinationPlace.type.type,
          latitude: details.order.destinationPlace.latitude,
          longitude: details.order.destinationPlace.longitude,
          time: moment(details.order.pickupTime).toDate(),
          collectingTime: null, // don't know because we don't not arrive yet
          possibleCollectingTime: null, // don't know because we don't not arrive yet
          arrivingTime: moment(details.order.arrivingTime).toDate(), // order default
          realArrivingTime: moment(details.order.arrivingTime).toDate(), // order default
          transportationTime: null, // dont know yet
          status: 'DELIVERING',
          numberOfLuggage: details.order.numberOfLuggage
        });
      }));

      //create ori and des case (locked des)
      let orderORIFromLockedDES= [];
      let orderDESFromLockedDES = [];
      await Promise.all(orderStatusLockedDES.map(async order => {
        let details = await PlanLocations.findOne({
          include: [{
            model: Orders,
            include: [
              {
                model: Places,
                as: 'originPlace',
                include: [{ model: PlaceTypes, as: 'type' }],
              },
              {
                model: Places,
                as: 'destinationPlace',
                include: [{ model: PlaceTypes, as: 'type' }],
              }
            ]
          }],
          where: {
            orderId: order.orderId,
            planId: order.planId,
            type: order.typeOfOrder
          }
        });

        orderORIFromLockedDES.push({
          id: order.orderId,
          code: details.order.code,
          type: "ORI",
          placeId: details.order.originPlaceId,
          placeName: details.order.originPlace.name,
          placeType: details.order.originPlace.type.type,
          latitude: details.order.originPlace.latitude,
          longitude: details.order.originPlace.longitude,
          time: moment(details.order.dropTime).toDate(),
          collectingTime: moment(details.collectingTime).toDate(),
          possibleCollectingTime: moment(details.collectingTime).toDate(),
          arrivingTime: moment(details.arrivingTime).toDate(),
          realArrivingTime: moment(details.order.arrivingTime).toDate(),
          transportationTime: details.transportationTime,
          status: 'COLLECTED',
          numberOfLuggage: details.order.numberOfLuggage
        });

        orderDESFromLockedDES.push({
          id: order.orderId,
          code: details.order.code,
          type: "DES",
          placeId: details.order.destinationPlaceId,
          placeName: details.order.destinationPlace.name,
          placeType: details.order.destinationPlace.type.type,
          latitude: details.order.destinationPlace.latitude,
          longitude: details.order.destinationPlace.longitude,
          time: moment(details.order.pickupTime).toDate(),
          collectingTime: moment(details.collectingTime).toDate(),
          possibleCollectingTime: moment(details.collectingTime).toDate(),
          arrivingTime: moment(details.arrivingTime).toDate(),
          realArrivingTime: moment(details.order.arrivingTime).toDate(),
          transportationTime: details.transportationTime,
          status: 'DELIVERED',
          numberOfLuggage: details.order.numberOfLuggage
        });
      }));

      //get new Order H2A inside IRP
      if(sameLockedPoint != null){
        if(sameLockedPoint.type === "ORI"){
          this.newOrderORI.transportationTime = 0;
          this.newOrderORI.collectingTime = moment(sameLockedPoint.collectingTime).toDate();
          this.newOrderORI.possibleCollectingTime = moment(sameLockedPoint.collectingTime).toDate();
          this.newOrderORI.status = "COLLECTED";
          orderORIFromLockedORI.push(this.newOrderORI);
          this.newOrderDES.transportationTime = null;
          this.newOrderDES.collectingTime = null;
          this.newOrderDES.possibleCollectingTime = null;
          this.newOrderDES.status = "DELIVERING";
          orderDESFromLockedORI.push(this.newOrderDES);
          await Orders.update({ status: 6 },{where: {id: this.newOrderORI.id}});
        }else{
          //find details from database
          let details = await PlanLocations.findOne({
            where: {
              orderId: sameLockedPoint.id,
              planId: selectedPlan.planId,
              type: "ORI"
            }
          });

          this.newOrderORI.transportationTime = details.transportationTime;
          this.newOrderORI.collectingTime = moment(details.collectingTime).toDate();
          this.newOrderORI.possibleCollectingTime = moment(details.collectingTime).toDate();
          this.newOrderORI.status = "COLLECTED";
          orderORIFromLockedDES.push(this.newOrderORI);

          this.newOrderDES.transportationTime = 0;
          this.newOrderDES.collectingTime = moment(sameLockedPoint.collectingTime).toDate();
          this.newOrderDES.status = "DELIVERED";
          orderDESFromLockedDES.push(this.newOrderDES);
          await Orders.update({ status: 7 },{where: {id: this.newOrderORI.id}});
        }        
      }
      orderORIFromLockedORI = _.orderBy(orderORIFromLockedORI, "collectingTime", "ASC");
      orderDESFromLockedORI = _.orderBy(orderDESFromLockedORI, "collectingTime", "ASC");
      orderORIFromLockedDES = _.orderBy(orderORIFromLockedDES, "collectingTime", "ASC");
      orderDESFromLockedDES = _.orderBy(orderDESFromLockedDES, "collectingTime", "ASC");

      //create ori and des for order delivered
      const orderORIFromDelivered= [];
      const orderDESFromDelivered = [];
      await Promise.all(ordersStatusDelivered.map(async order => {
        let details = await PlanLocations.findOne({
          include: [{
            model: Orders,
            include: [
              {
                model: Places,
                as: 'originPlace',
                include: [{ model: PlaceTypes, as: 'type' }],
              },
              {
                model: Places,
                as: 'destinationPlace',
                include: [{ model: PlaceTypes, as: 'type' }],
              }
            ]
          }],
          where: {
            orderId: order,
            planId: selectedPlan.planId
          }
        });

        orderORIFromDelivered.push({
          id: order,
          code: details.order.code,
          type: "ORI",
          placeId: details.order.originPlaceId,
          placeName: details.order.originPlace.name,
          placeType: details.order.originPlace.type.type,
          latitude: details.order.originPlace.latitude,
          longitude: details.order.originPlace.longitude,
          time: moment(details.order.dropTime).toDate(),
          collectingTime: moment(details.collectingTime).toDate(),
          possibleCollectingTime: moment(details.collectingTime).toDate(),
          arrivingTime: moment(details.arrivingTime).toDate(),
          realArrivingTime: moment(details.order.arrivingTime).toDate(),
          transportationTime: details.transportationTime,
          status: 'COLLECTED',
          numberOfLuggage: details.order.numberOfLuggage
        });

        orderDESFromDelivered.push({
          id: order,
          code: details.order.code,
          type: "DES",
          placeId: details.order.destinationPlaceId,
          placeName: details.order.destinationPlace.name,
          placeType: details.order.destinationPlace.type.type,
          latitude: details.order.destinationPlace.latitude,
          longitude: details.order.destinationPlace.longitude,
          time: moment(details.order.pickupTime).toDate(),
          collectingTime: moment(details.collectingTime).toDate(),
          possibleCollectingTime: moment(details.collectingTime).toDate(),
          arrivingTime: moment(details.arrivingTime).toDate(),
          realArrivingTime: moment(details.order.arrivingTime).toDate(),
          transportationTime: details.transportationTime,
          status: 'DELIVERED',
          numberOfLuggage: details.order.numberOfLuggage
        });
      }));

      //create ori and des for order delivering
      const orderORIFromDelivering= [];
      const orderDESFromDelivering = [];
      await Promise.all(ordersStatusDelivering.map(async order => {
        let details = await PlanLocations.findOne({
          include: [{
            model: Orders,
            include: [
              {
                model: Places,
                as: 'originPlace',
                include: [{ model: PlaceTypes, as: 'type' }],
              },
              {
                model: Places,
                as: 'destinationPlace',
                include: [{ model: PlaceTypes, as: 'type' }],
              }
            ]
          }],
          where: {
            orderId: order,
            planId: selectedPlan.planId
          }
        });

        orderORIFromDelivering.push({
          id: order,
          code: details.order.code,
          type: "ORI",
          placeId: details.order.originPlaceId,
          placeName: details.order.originPlace.name,
          placeType: details.order.originPlace.type.type,
          latitude: details.order.originPlace.latitude,
          longitude: details.order.originPlace.longitude,
          time: moment(details.order.dropTime).toDate(),
          collectingTime: moment(details.collectingTime).toDate(),
          possibleCollectingTime: moment(details.collectingTime).toDate(),
          arrivingTime: moment(details.arrivingTime).toDate(),
          realArrivingTime: moment(details.order.arrivingTime).toDate(),
          transportationTime: details.transportationTime,
          status: 'COLLECTED',
          numberOfLuggage: details.order.numberOfLuggage
        });

        orderDESFromDelivering.push({
          id: order,
          code: details.order.code,
          type: "DES",
          placeId: details.order.destinationPlaceId,
          placeName: details.order.destinationPlace.name,
          placeType: details.order.destinationPlace.type.type,
          latitude: details.order.destinationPlace.latitude,
          longitude: details.order.destinationPlace.longitude,
          time: moment(details.order.pickupTime).toDate(),
          collectingTime: null,
          possibleCollectingTime: null,
          arrivingTime: moment(details.order.arrivingTime).toDate(),
          realArrivingTime: moment(details.order.arrivingTime).toDate(),
          transportationTime: null,
          status: 'DELIVERING',
          numberOfLuggage: details.order.numberOfLuggage
        });
      }));

      console.log();
      //setting varriable before refreshment process
      this.IRPList = [];
      this.IRPLocationList = [];
      this.spotList = [];
      //find all of order status waiting
      this.calculatingOrders = await getCalculatingOrders();
      this.calculatingOrders = [...this.calculatingOrders.filter(order => order.originPlace.type.type !== 'AIRPORT')];
      this.spotList = this.calculatingOrders.map((order) => {
        order.type = 'ORI';
        order.placeId = order.originPlace.placeId;
        order.latitude = order.originPlace.latitude;
        order.longitude = order.originPlace.longitude;
        order.time = moment(order.dropTime).toDate();
        order.placeType = order.originPlace.type.type;
        order.possibleCollectingTime = null;
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
      //setting irp list
      this.IRPList = [ ...orderORIFromLockedORI,  ...orderDESFromLockedORI, 
                       ...orderDESFromLockedDES,  ...orderORIFromLockedDES, 
                       ...orderORIFromDelivered,  ...orderDESFromDelivered, 
                       ...orderORIFromDelivering, ...orderDESFromDelivering ];
                       
      //setting irp location list            
      let orderInIRPLocationList = [  ...orderORIFromLockedORI, 
                                      ...orderORIFromLockedDES, ...orderDESFromLockedDES,
                                      ...orderORIFromDelivered, ...orderDESFromDelivered,
                                      ...orderORIFromDelivering
                                   ];
      //sort irp location list
      orderInIRPLocationList = _.orderBy(orderInIRPLocationList, ["collectingTime"], ["asc"]); // sorted by collectingTime
    
      this.IRPLocationList = [ ...orderInIRPLocationList ]; 
      this.tempOrderList = [ ...this.spotList, ...orderDESFromLockedORI, ...orderDESFromDelivering ];
      this.spotList = [...this.tempOrderList];
      this.tempIRPLocationList = [...this.IRPLocationList];
      
      let carCapacityUsed = 0;
      //find the current car capacity
      await this.IRPLocationList.map(order => {
        if(order.type === "ORI"){
          if(order.status === "COLLECTED"){
            carCapacityUsed += order.numberOfLuggage;
          }
        }else{
          if(order.status === "DELIVERED"){
            carCapacityUsed -= order.numberOfLuggage;
          }
        }
      }); 

      this.currentCarCap = this.driver.carCapacity - carCapacityUsed;
      this.endIRPProcess = false;
      await this.processThirdRun();
      return;
    }else{
      await this.changeOrderStatus(selectedPlan, 1);
      await this.initailStartRefreshment(selectedPlan);
      await this.startProcessRefreshment();
      return;
    }
    
  }

  async getOrdersPlanningDetails(selectedPlanId, ordersStatusPlaned, orderType, selectedCollectingTime){
    const ordersPlaningDetails = [];
    await Promise.all(ordersStatusPlaned.map(async order => {
      let details = await PlanLocations.findOne({
        include: [{
          model: Orders,
          include: [
            {
              model: Places,
              as: 'originPlace',
              include: [{ model: PlaceTypes, as: 'type' }],
            },
            {
              model: Places,
              as: 'destinationPlace',
              include: [{ model: PlaceTypes, as: 'type' }],
            }
          ]
        }],
        where: {
          orderId: order,
          planId: selectedPlanId,
          type: orderType
        }
      });

      if(orderType === "ORI"){
        if(moment(details.collectingTime).toDate() <= moment(selectedCollectingTime).toDate()){
          ordersPlaningDetails.push({
            id: order,
            code: details.order.code,
            type: "ORI",
            placeId: details.order.originPlaceId,
            placeName: details.order.originPlace.name,
            placeType: details.order.originPlace.type.type,
            latitude: details.order.originPlace.latitude,
            longitude: details.order.originPlace.longitude,
            time: moment(details.order.dropTime).toDate(),
            collectingTime: moment(details.collectingTime).toDate(),
            possibleCollectingTime: moment(details.possibleCollectingTime).toDate(),
            arrivingTime: moment(details.arrivingTime).toDate(),
            realArrivingTime: moment(details.order.arrivingTime).toDate(),
            transportationTime: details.transportationTime,
            status: 'COLLECTED',
            numberOfLuggage: details.order.numberOfLuggage
          });
        }
      }else{
        let orderORIDetails = await PlanLocations.findOne({
          where: {
            orderId: order,
            planId: selectedPlanId,
            type: "ORI"
          }
        });

        if(moment(orderORIDetails.collectingTime).toDate() <= moment(selectedCollectingTime).toDate()){
          ordersPlaningDetails.push({
            id: order,
            code: details.order.code,
            type: "DES",
            placeId: details.order.destinationPlaceId,
            placeName: details.order.destinationPlace.name,
            placeType: details.order.destinationPlace.type.type,
            latitude: details.order.destinationPlace.latitude,
            longitude: details.order.destinationPlace.longitude,
            time: moment(details.order.dropTime).toDate(),
            collectingTime: moment(details.collectingTime).toDate(),
            possibleCollectingTime: moment(details.possibleCollectingTime).toDate(),
            arrivingTime: moment(details.arrivingTime).toDate(),
            realArrivingTime: moment(details.order.arrivingTime).toDate(),
            transportationTime: details.transportationTime,
            status: 'DELIVERING',
            numberOfLuggage: details.order.numberOfLuggage
          });
        }
      }
    }));

    return ordersPlaningDetails;
  }

  async getOrdersDeliveringDetails(selectedPlanId, ordersStatusDelivering, orderType){

    const ordersDeliveringDetails = [];
    await Promise.all(ordersStatusDelivering.map(async order => {
      let details = await PlanLocations.findOne({
        include: [{
          model: Orders,
          include: [
            {
              model: Places,
              as: 'originPlace',
              include: [{ model: PlaceTypes, as: 'type' }],
            },
            {
              model: Places,
              as: 'destinationPlace',
              include: [{ model: PlaceTypes, as: 'type' }],
            }
          ]
        }],
        where: {
          orderId: order,
          planId: selectedPlanId,
          type: orderType
        }
      });

      if(orderTypt === "ORI"){
        ordersDeliveringDetails.push({
          id: order,
          code: details.order.code,
          type: "ORI",
          placeId: details.order.originPlaceId,
          placeName: details.order.originPlace.name,
          placeType: details.order.originPlace.type.type,
          latitude: details.order.originPlace.latitude,
          longitude: details.order.originPlace.longitude,
          time: moment(details.order.dropTime).toDate(),
          collectingTime: moment(details.collectingTime).toDate(),
          possibleCollectingTime: moment(details.possibleCollectingTime).toDate(),
          arrivingTime: moment(details.arrivingTime).toDate(),
          realArrivingTime: moment(details.order.arrivingTime).toDate(),
          transportationTime: details.transportationTime,
          status: 'COLLECTED',
          numberOfLuggage: details.order.numberOfLuggage
        });
      }else{
        ordersDeliveringDetails.push({
          id: order,
          code: details.order.code,
          type: "DES",
          placeId: details.order.destinationPlaceId,
          placeName: details.order.destinationPlace.name,
          placeType: details.order.destinationPlace.type.type,
          latitude: details.order.destinationPlace.latitude,
          longitude: details.order.destinationPlace.longitude,
          time: moment(details.order.pickupTime).toDate(),
          collectingTime: moment(details.collectingTime).toDate(),
          possibleCollectingTime: moment(details.possibleCollectingTime).toDate(),
          arrivingTime: moment(details.order.arrivingTime).toDate(),
          realArrivingTime: moment(details.order.arrivingTime).toDate(),
          transportationTime: null,
          status: 'DELIVERING',
          numberOfLuggage: details.order.numberOfLuggage
        });
      }
    }));

    return ordersDeliveringDetails;
  }

  async getOrdersDeliveredDetails(selectedPlanId, ordersStatusDelivered, orderType){
    const ordersDeliveredDetails = [];

    await Promise.all(ordersStatusDelivered.map(async order => {

      let details = await PlanLocations.findOne({
        include: [{
          model: Orders,
          include: [
            {
              model: Places,
              as: 'originPlace',
              include: [{ model: PlaceTypes, as: 'type' }],
            },
            {
              model: Places,
              as: 'destinationPlace',
              include: [{ model: PlaceTypes, as: 'type' }],
            }
          ]
        }],
        where: {
          orderId: order,
          planId: selectedPlanId,
          type: orderType
        }
      });

      if(orderType === "ORI"){
        ordersDeliveredDetails.push({
          id: order,
          code: details.order.code,
          type: "ORI",
          placeId: details.order.originPlaceId,
          placeName: details.order.originPlace.name,
          placeType: details.order.originPlace.type.type,
          latitude: details.order.originPlace.latitude,
          longitude: details.order.originPlace.longitude,
          time: moment(details.order.dropTime).toDate(),
          collectingTime: moment(details.collectingTime).toDate(),
          possibleCollectingTime: moment(details.possibleCollectingTime).toDate(),
          arrivingTime: moment(details.arrivingTime).toDate(),
          realArrivingTime: moment(details.order.arrivingTime).toDate(),
          transportationTime: details.transportationTime,
          status: 'COLLECTED',
          numberOfLuggage: details.order.numberOfLuggage
        });
      }else{
        ordersDeliveredDetails.push({
          id: order,
          code: details.order.code,
          type: "DES",
          placeId: details.order.destinationPlaceId,
          placeName: details.order.destinationPlace.name,
          placeType: details.order.destinationPlace.type.type,
          latitude: details.order.destinationPlace.latitude,
          longitude: details.order.destinationPlace.longitude,
          time: moment(details.order.pickupTime).toDate(),
          collectingTime: moment(details.collectingTime).toDate(),
          possibleCollectingTime: moment(details.possibleCollectingTime).toDate(),
          arrivingTime: moment(details.arrivingTime).toDate(),
          realArrivingTime: moment(details.order.arrivingTime).toDate(),
          transportationTime: details.transportationTime,
          status: 'DELIVERED',
          numberOfLuggage: details.order.numberOfLuggage
        });
      }
    }));

    return ordersDeliveredDetails;
  }

  async getOrdersLockedORIDetails_ORI(orderStatusLockedORI){
    const orderORIFromLockedORI = [];
    await Promise.all(orderStatusLockedORI.map(async order => {
      let details = await PlanLocations.findOne({
        include: [{
          model: Orders,
          include: [
            {
              model: Places,
              as: 'originPlace',
              include: [{ model: PlaceTypes, as: 'type' }],
            },
            {
              model: Places,
              as: 'destinationPlace',
              include: [{ model: PlaceTypes, as: 'type' }],
            }
          ]
        }],
        where: {
          orderId: order.orderId,
          planId: order.planId,
          type: order.typeOfOrder
        }
      });

      //order ori locked points ORI
      orderORIFromLockedORI.push({
        id: order.orderId,
        code: details.order.code,
        type: "ORI",
        placeId: details.order.originPlaceId,
        placeName: details.order.originPlace.name,
        placeType: details.order.originPlace.type.type,
        latitude: details.order.originPlace.latitude,
        longitude: details.order.originPlace.longitude,
        time: moment(details.order.dropTime).toDate(),
        collectingTime: moment(details.collectingTime).toDate(), //get from plan locations
        possibleCollectingTime: moment(details.possibleCollectingTime).toDate(), //get from plan locations
        arrivingTime: moment(details.arrivingTime).toDate(), //get from plan locations
        realArrivingTime: moment(details.order.arrivingTime).toDate(),
        transportationTime: details.transportationTime, //get from plan locations
        status: 'COLLECTED', 
        numberOfLuggage: details.order.numberOfLuggage
      });
    }));

    return [...orderORIFromLockedORI];
  }

  async getOrdersLockedORIDetails_DES(orderStatusLockedORI){
    const orderDESFromLockedORI = [];

    await Promise.all(orderStatusLockedORI.map(async order => {
      let details = await PlanLocations.findOne({
        include: [{
          model: Orders,
          include: [
            {
              model: Places,
              as: 'originPlace',
              include: [{ model: PlaceTypes, as: 'type' }],
            },
            {
              model: Places,
              as: 'destinationPlace',
              include: [{ model: PlaceTypes, as: 'type' }],
            }
          ]
        }],
        where: {
          orderId: order.orderId,
          planId: order.planId,
          type: "DES"
        }
      });
      
      //order ori locked points DES
      orderDESFromLockedORI.push({
        id: order.orderId,
        code: details.order.code,
        type: "DES",
        placeId: details.order.destinationPlaceId,
        placeName: details.order.destinationPlace.name,
        placeType: details.order.destinationPlace.type.type,
        latitude: details.order.destinationPlace.latitude,
        longitude: details.order.destinationPlace.longitude,
        time: moment(details.order.pickupTime).toDate(),
        collectingTime: moment(details.collectingTime).toDate(),
        possibleCollectingTime: moment(details.possibleCollectingTime).toDate(),
        arrivingTime: moment(details.order.arrivingTime).toDate(), // order default
        realArrivingTime: moment(details.order.arrivingTime).toDate(), // order default
        transportationTime: null, // dont know yet
        status: 'DELIVERING',
        numberOfLuggage: details.order.numberOfLuggage
      });
    }));

    return [...orderDESFromLockedORI];
  }

  async getOrdersLockedDESDetails_ORI(orderStatusLockedDES){
    const orderORIFromLockedDES = [];

    await Promise.all(orderStatusLockedDES.map(async order => {
      let details = await PlanLocations.findOne({
        include: [{
          model: Orders,
          include: [
            {
              model: Places,
              as: 'originPlace',
              include: [{ model: PlaceTypes, as: 'type' }],
            },
            {
              model: Places,
              as: 'destinationPlace',
              include: [{ model: PlaceTypes, as: 'type' }],
            }
          ]
        }],
        where: {
          orderId: order.orderId,
          planId: order.planId,
          type: "ORI"
        }
      });

      orderORIFromLockedDES.push({
        id: order.orderId,
        code: details.order.code,
        type: "ORI",
        placeId: details.order.originPlaceId,
        placeName: details.order.originPlace.name,
        placeType: details.order.originPlace.type.type,
        latitude: details.order.originPlace.latitude,
        longitude: details.order.originPlace.longitude,
        time: moment(details.order.dropTime).toDate(),
        collectingTime: moment(details.collectingTime).toDate(),
        possibleCollectingTime: moment(details.possibleCollectingTime).toDate(),
        arrivingTime: moment(details.arrivingTime).toDate(),
        realArrivingTime: moment(details.order.arrivingTime).toDate(),
        transportationTime: details.transportationTime,
        status: 'COLLECTED',
        numberOfLuggage: details.order.numberOfLuggage
      });
    }));
    return [...orderORIFromLockedDES];
  }

  async getOrdersLockedDESDetails_DES(orderStatusLockedDES){
    const orderDESFromLockedDES = [];

    await Promise.all(orderStatusLockedDES.map(async order => {
      let details = await PlanLocations.findOne({
        include: [{
          model: Orders,
          include: [
            {
              model: Places,
              as: 'originPlace',
              include: [{ model: PlaceTypes, as: 'type' }],
            },
            {
              model: Places,
              as: 'destinationPlace',
              include: [{ model: PlaceTypes, as: 'type' }],
            }
          ]
        }],
        where: {
          orderId: order.orderId,
          planId: order.planId,
          type: order.typeOfOrder
        }
      });

      orderDESFromLockedDES.push({
        id: order.orderId,
        code: details.order.code,
        type: "DES",
        placeId: details.order.destinationPlaceId,
        placeName: details.order.destinationPlace.name,
        placeType: details.order.destinationPlace.type.type,
        latitude: details.order.destinationPlace.latitude,
        longitude: details.order.destinationPlace.longitude,
        time: moment(details.order.pickupTime).toDate(),
        collectingTime: moment(details.collectingTime).toDate(),
        possibleCollectingTime: moment(details.possibleCollectingTime).toDate(),
        arrivingTime: moment(details.arrivingTime).toDate(),
        realArrivingTime: moment(details.order.arrivingTime).toDate(),
        transportationTime: details.transportationTime,
        status: 'DELIVERING',
        numberOfLuggage: details.order.numberOfLuggage
      });
    }));

    return [...orderDESFromLockedDES];
  }

  async endProcessConsolidation() {

    if(this.IRPLocationList.length > 0) {
      const tempIRPLocationList = [...this.IRPLocationList];

      this.plan = await Plans.create({
        driverId: this.driver.id,
        updatedBy: 1, // manager id
        createdBy: 1, // manager id
      });

      const createOrders = [];
      tempIRPLocationList.forEach((order) => { 
        const orderIncludingDetails = {
          planId: this.plan.id,
          orderId: order.id,
          transportationTime: order.transportationTime,
          collectingTime: moment(order.collectingTime).toDate(),
          arrivingTime: moment(order.arrivingTime).toDate(),
          possibleCollectingTime: moment(order.possibleCollectingTime).toDate(),
          possibleArrivingTime: null,
          type: order.type,
          placeId: order.placeId
        };
        createOrders.push(orderIncludingDetails);
      });

      const createOrderList = [..._.orderBy(createOrders, ['collectingTime', 'arrivingTime'], ['ASC', 'ASC'])];
      
      await PlanLocations.bulkCreate(createOrderList);

      this.stopRunning = moment().format("HH:mm:ss");
      console.log("=======================================================");
      console.log("Driver ID:", this.driver.id);
      console.log("Driver Place ID:", this.driverStartPlaceId);
      console.log("Start Time:", moment.utc(this.startTime).format('MMMM Do YYYY, h:mm:ss a'));
      console.log("Latitude:", this.driver.latitude);
      console.log("Longitude:", this.driver.longitude);
      console.log("Plan ID:", this.plan.id);
      console.log("Running Time:", moment.utc(moment(this.stopRunning, "HH:mm:ss").diff(moment(this.startRunning, "HH:mm:ss"))).format("HH:mm:ss"));
      await this.printDetails(this.IRPLocationList, "IRP Location List");
      console.log("====================  more details ====================");
      console.log('IRPLocationList', this.IRPLocationList);
      console.log("=======================================================");
      
      io.emit('MRP', { message: 'PROCESSED', isProcessing: false, IRPLocationList: this.IRPLocationList });
      return this.plan.id;
    }
  }

  async preparationOrdersInFormattedRealtime(selectedCCL){
    //order each status

    let selectedPlanId = selectedCCL.planId;
    let selectedCollectingTime = moment(selectedCCL.collectingTime).toDate();

    const orderStatusLockedORI = [];
    const orderStatusLockedDES = [];
    const orderStatusDelivered = [];
    const orderStatusDelivering = [];
    const orderStatusPlaned = [];

    const allOfLocationsInIRP = await PlanLocations.findAll({
      include: [{
        model: Orders
      }],
      where: {planId: selectedPlanId}
    });
    
    //get all loctions in irp
    await allOfLocationsInIRP.map(location => {
      //data format location in irp
      let data = {
        planId: selectedPlanId,
        orderId: location.orderId,
        orderStatus: location.order.status,
        collectingTime: location.collectingTime,
        typeOfOrder: location.type };

      // locked ori and locked des
      if(location.order.status === 6 || location.order.status === 7){
        if(location.type === "ORI" && location.order.status === 6){
          orderStatusLockedORI.push(data);
        }else if(location.type === "DES" && location.order.status === 7){
          orderStatusLockedDES.push(data);
        }
      }

      //order status delivered
      if(location.order.status === 5){
        orderStatusDelivered.push(data);
      }
      //order status delivering
      if(location.order.status === 4){
        orderStatusDelivering.push(data);
      }
      //order status planed
      if(location.order.status === 2){
        orderStatusPlaned.push(data);
      }
    });
    
    //get order status delivered uniq
    let ordersStatusDelivered = [...await orderStatusDelivered.map(order => order.orderId)];
    ordersStatusDelivered = _.uniq(ordersStatusDelivered);
    //get order status delivering uniq
    let ordersStatusDelivering = [...await orderStatusDelivering.map(order => order.orderId)];
    ordersStatusDelivering = _.uniq(ordersStatusDelivering);
    //get orders status planned uniq
    let ordersStatusPlaned = [...await orderStatusPlaned.map(order => order.orderId)];
    ordersStatusPlaned = _.uniq(ordersStatusPlaned);

    //create ori and des for order planning
    let orderORIFromPlaning = [...await this.getOrdersPlanningDetails(selectedPlanId, ordersStatusPlaned, "ORI", moment(selectedCollectingTime).toDate())];
    let orderDESFromPlaning = [...await this.getOrdersPlanningDetails(selectedPlanId, ordersStatusPlaned, "DES", moment(selectedCollectingTime).toDate())];
    
    //create ori and des for order(locked ori)
    let orderORIFromLockedORI = [...await this.getOrdersLockedORIDetails_ORI(orderStatusLockedORI)];
    let orderDESFromLockedORI = [...await this.getOrdersLockedORIDetails_DES(orderStatusLockedORI)];

    //create ori and des for order(locked des)
    let orderORIFromLockedDES = [...await this.getOrdersLockedDESDetails_ORI(orderStatusLockedDES)];
    let orderDESFromLockedDES = [...await this.getOrdersLockedDESDetails_DES(orderStatusLockedDES)];

    //create ori and des for order delivered
    let orderORIFromDelivered = [...await this.getOrdersDeliveredDetails(selectedPlanId, ordersStatusDelivered, "ORI")];
    let orderDESFromDelivered = [...await this.getOrdersDeliveredDetails(selectedPlanId, ordersStatusDelivered, "DES")];

    //create ori and des for order delivering
    let orderORIFromDelivering= [...await this.getOrdersDeliveringDetails(selectedPlanId, ordersStatusDelivering, "ORI")];
    let orderDESFromDelivering = [...await this.getOrdersDeliveringDetails(selectedPlanId, ordersStatusDelivering, "DES")];

    //setting varriable process
    //setting irp list
    const consolidationPlan = [ ...orderORIFromLockedORI,  ...orderDESFromLockedORI, 
                                ...orderDESFromLockedDES,  ...orderORIFromLockedDES,
                                ...orderORIFromPlaning,    ...orderDESFromPlaning,
                                ...orderORIFromDelivered,  ...orderDESFromDelivered, 
                                ...orderORIFromDelivering, ...orderDESFromDelivering ];

    return consolidationPlan;
  }

  async rollbackOrderStatus() {
    const orderToRestore = this.refreshmentData.orders;
    await Promise.all(orderToRestore.map(async order => {
      await Orders.update(
        { status: order.status }, 
        { where: {id: order.orderId} }
      );
    }));
  }

  async changeOrderStatus(selectedPlan, status){
    let planLocationDetails = await PlanLocations.findAll({
      where: { planId: selectedPlan.planId }
    });
    planLocationDetails = await planLocationDetails.map(order => order.orderId);
    planLocationDetails = _.uniq(planLocationDetails);
    await Orders.update(
      {status: status},
      {
        where: {
          id: {[Op.in]: planLocationDetails}
        }
      }
    );
  }

  async getCarCapacityByPlanId(planId){
    const planDetails = await Plans.findOne({
      where: {
        id: planId
      }
    });

    const driverDetails = await Drivers.findOne({
      include: {
        model: Cars
      },
      where: {id: planDetails.driverId}
    }); 

    return driverDetails.car.carCapacity;
  }

  async findCurrentCarCapacity(formatedOrdersInPlan, lockedPoint){
    let currentLuggages = 0;
    let checkDone = false;
    await formatedOrdersInPlan.forEach(order => {
      if(!checkDone && order.id){
        if(order.type === "DES"){
          currentLuggages = currentLuggages - order.numberOfLuggage;
        }else{
          currentLuggages = currentLuggages + order.numberOfLuggage;
        }

        if(order.type === lockedPoint.type && order.id === lockedPoint.id){
          checkDone = true;
        }
      }
    });

    return currentLuggages;
  }

  async findCurrentCarCapacityConsolidation(formatedOrdersInPlan, lastCollectingTime){
    let currentLuggages = 0;
    let sortedOrdersInPlan = _.orderBy(formatedOrdersInPlan, "collectingTime", "ASC");
    await sortedOrdersInPlan.forEach(order => {
      if(moment(order.collectingTime).toDate() <= moment(lastCollectingTime).toDate()){
        if(order.type === "ORI"){
          if(order.status === "COLLECTED"){
            currentLuggages = currentLuggages + order.numberOfLuggage;
          }
        }else if(order.type === "DES"){
          if(order.status === "DELIVERED"){
            currentLuggages = currentLuggages - order.numberOfLuggage;
          }
        }
      }
    });

    return currentLuggages;
  }

  async changeOrderInPlanToCalculatingFormat(ordersInPlan) {
    let ordersInFormat = [];
    await Promise.all(ordersInPlan.map(async order => {
      let orderDetails = await Orders.findOne({
        include: [
          {
            model: Places,
            as: 'originPlace',
            include: [{ model: PlaceTypes, as: 'type' }],
          },
          {
            model: Places,
            as: 'destinationPlace',
            include: [{ model: PlaceTypes, as: 'type' }],
          }
        ],
        where:{
          id: order.id
        }
      }); 
      
      let latitude = null;
      let longitude = null;
      let placeType = null;
      let placeName = null;
      let time = null;
      let arrivingTime = null;

      if(order.type === "ORI"){
        latitude = orderDetails.originPlace.latitude;
        longitude = orderDetails.originPlace.longitude;
        placeType = orderDetails.originPlace.type.type;
        placeName = orderDetails.originPlace.name;
        time = orderDetails.dropTime;
        arrivingTime = orderDetails.arrivingTime;
      }else{
        latitude = orderDetails.destinationPlace.latitude;
        longitude = orderDetails.destinationPlace.longitude;
        placeType = orderDetails.destinationPlace.type.type;
        placeName = orderDetails.destinationPlace.name;
        time = orderDetails.pickupTime;
        arrivingTime = orderDetails.arrivingTime;
      }
      
      let orderDetailsInPlanLocation = await PlanLocations.findOne({
        where: {
          planId: order.planId,
          orderId: order.id,
          type: order.type
        }
      });

      ordersInFormat.push({
        id: order.id,
        arrivingTime: orderDetailsInPlanLocation.arrivingTime,
        transportationTime: orderDetailsInPlanLocation.transportationTime,
        collectingTime: orderDetailsInPlanLocation.collectingTime,
        time: time,
        placeId: order.placeId,
        type: order.type,
        code: orderDetails.code,
        latitude: latitude,
        longitude: longitude,
        numberOfLuggage: orderDetails.numberOfLuggage,
        placeType: placeType,
        status: orderDetails.status,
        realArrivingTime: arrivingTime,
        placeName: placeName,
        possibleCollectingTime: null
      });
    }));;

    await ordersInFormat.forEach(o => {
      if(o.type === "ORI"){
        o.status = "COLLECTED";
      }else if(o.type === "DES"){
        if(o.status === 5){
          o.status = "DELIVERED";
        }else{
          o.status = "DELIVERING";
        }
      }
    });

    ordersInFormat = _.orderBy(ordersInFormat, ["collectingTime"], ["ASC"]);
    return ordersInFormat;
  }

  async checkOrderNORIIsExistInPlaceList(lockedOrderORIPlaceSameDES){
    const sameLockedPlaces = [];
    let checkSameLockedPlace = false;
    const orderNplaceId_ORI = this.orderN.placeId;
    
    await lockedOrderORIPlaceSameDES.forEach(order => {
      if(order.placeId === orderNplaceId_ORI){
        checkSameLockedPlace = true;
        sameLockedPlaces.push(order);
      }
    });

    if(checkSameLockedPlace === true){
      return {
        status: checkSameLockedPlace,
        place: sameLockedPlaces
      };
    }else{
      return {
        status: checkSameLockedPlace,
        place: sameLockedPlaces
      };
    }
  }

  async checkOrderNORIPlaceIsSameToNCLPlace(order){
    //this.orderN.placeId = "ChIJN22144mb4jAR1VI1dQDzN8g";
    if(this.orderN.placeId === order.placeId){
      return true;
    }else{
      return false;
    }
  }

  async createNewOrderORIandDES(orderId){
    const newOrderDetails = await Orders.findOne({
      include: [
        {
          model: Places,
          as: 'originPlace',
          include: [{ model: PlaceTypes, as: 'type' }],
        },
        {
          model: Places,
          as: 'destinationPlace',
          include: [{ model: PlaceTypes, as: 'type' }],
        }
      ],
      where: {
        id: orderId
      }
    });

    //seperate new order details to ORI and DES case
    this.orderN = {
      id: newOrderDetails.id,
      arrivingTime: newOrderDetails.arrivingTime,
      transportationTime: null,
      collectingTime: null,
      time: newOrderDetails.dropTime,
      placeId: newOrderDetails.originPlace.placeId,
      type: "ORI",
      code: newOrderDetails.code,
      latitude: newOrderDetails.originPlace.latitude,
      longitude: newOrderDetails.originPlace.longitude,
      numberOfLuggage: newOrderDetails.numberOfLuggage,
      placeType: newOrderDetails.originPlace.type.type,
      status: "COLLECTING",
      realArrivingTime: newOrderDetails.arrivingTime,
      placeName: newOrderDetails.originPlace.name,
      possibleCollectingTime: null
    }

    this.orderNDES = {
      id: newOrderDetails.id,
      arrivingTime: newOrderDetails.arrivingTime,
      transportationTime: null,
      collectingTime: null,
      time: newOrderDetails.pickupTime,
      placeId: newOrderDetails.destinationPlace.placeId,
      type: "DES",
      code: newOrderDetails.code,
      latitude: newOrderDetails.destinationPlace.latitude,
      longitude: newOrderDetails.destinationPlace.longitude,
      numberOfLuggage: newOrderDetails.numberOfLuggage,
      placeType: newOrderDetails.destinationPlace.type.type,
      status: "DELIVERING",
      realArrivingTime: newOrderDetails.arrivingTime,
      placeName: newOrderDetails.destinationPlace.name,
      possibleCollectingTime: null
    }

    this.newOrderORI = {...this.orderN};
    this.newOrderDES = {...this.orderNDES};

    return newOrderDetails;
  }

  async getORIPlaceIdList(orders) {
    let placeList = [];
    //console.log("fn orders:", orders);
    await Promise.all(orders.map( async order => {
      let details = await PlanLocations.findOne({
        where: {
          orderId: order.id,
          type: order.type
        }
      });
      
      placeList.push({
        id: order.id,
        placeId: details.placeId,
        type: order.type,
        planId: details.planId,
        collectingTime: details.collectingTime
      });
    }));

    return placeList;
  }

  async getPlaceIdByLatLng(lat, lng){
    const latlng = lat+","+lng;
    const placeId = await getPlaceData(latlng);
    return placeId.place_id;
  }

  async debug(lineNumber){
    console.log("Pass at line:", lineNumber);
    return;
  }

  async getSmartDuration(originPlaceId, destinationPlaceId, startDateTime) {

    if(originPlaceId === destinationPlaceId){
      return 0;
    }else{
      
      const startTime = moment(startDateTime).format("HH:mm:ss");
      const result = await this.checkRouteIsExistByPlaceId(originPlaceId, destinationPlaceId);
      if(result === null){
        const [routeDetails, originPlaceDetails, destinationPlaceDetails] = await Promise.all([
          Routes.create({
            oriPlaceId: originPlaceId,
            desPlaceId: destinationPlaceId
          }),
          getLocationData(originPlaceId),// find lat lng for those placeId
          getLocationData(destinationPlaceId) // console.log(originPlaceDetails);
        ]);
        
        const originPlace = {
          latitude: originPlaceDetails.geometry.location.lat,
          longitude: originPlaceDetails.geometry.location.lng
        };
        
        const destinationPlace = {
          latitude: destinationPlaceDetails.geometry.location.lat,
          longitude: destinationPlaceDetails.geometry.location.lng
        };
        
        const origin = {...originPlace};
        const destination = {...destinationPlace};
        
        const departureTime = {
          departureTime: startDateTime
        };
        const inputPlaces = {origin, destination, departureTime};
        const durationDetails = await getDistanceMatrix(inputPlaces);

        const scheduleId = await this.findDepartureTimeSchedule(startTime);
        await GGRoutes.create({
          routeId: routeDetails.id,
          scheduleId: scheduleId,
          ggDuration: durationDetails.data.duration.value,
          trafficDuration: durationDetails.data.duration_in_traffic.value,
          departureTime: moment(startDateTime)
        });
        
        return durationDetails.data.duration.value + durationDetails.data.duration_in_traffic.value;
      }else{
        
        const scheduleId = await this.findDepartureTimeSchedule(startTime);
        const routeId = result.id;
        const ggRoutesDetails = await GGRoutes.findAll({
          where: {
            scheduleId: scheduleId,
            routeId: routeId
          }
        });
        if(ggRoutesDetails.length >= 1){
          const historicRouteDetails = await this.checkHistoricRouteIsExistByPlaceId(this.driver.id, routeId, scheduleId);
          
          if(historicRouteDetails.length > 0){
            const ggRouteDB = await GGRoutes.findOne({
              where: {
                scheduleId: scheduleId,
                routeId: routeId
              }
            });
            const historicDriverRoutes = await HistoricRoutes.findAll({
              where: {
                driverId: this.driver.id,
                routeId: routeId
              }
            });
            let sumDriverRoutesRatio = 0;
            const driverHistoricAVG = await historicDriverRoutes.reduce(async(sum, historicDriverRoute) => {
              let driverDuration = historicDriverRoute.driverDuration;
              let ggRoutes = await GGRoutes.findOne({
                where:{
                  scheduleId: historicDriverRoute.scheduleId,
                  routeId: historicDriverRoute.routeId
                }
              });
              return sumDriverRoutesRatio += ((ggRoutes.ggDuration + ggRoutes.trafficDuration)/driverDuration);     
            }, 0);
            
            const driverIndex = driverHistoricAVG/historicDriverRoutes.length;
            const estimateTime = (ggRouteDB.ggDuration + ggRouteDB.trafficDuration)/driverIndex;
            return estimateTime;
          }else{
            
            const ggRoutesDetails = await GGRoutes.findOne({
              where: {
                scheduleId: scheduleId,
                routeId: routeId
              }
            });
            return ggRoutesDetails.ggDuration + ggRoutesDetails.trafficDuration;
          }
        }else{
          const originPlaceDetails = await getLocationData(originPlaceId);
          const destinationPlaceDetails = await getLocationData(destinationPlaceId);

          const originPlace = {
            latitude: originPlaceDetails.geometry.location.lat,
            longitude: originPlaceDetails.geometry.location.lng
          };
          const destinationPlace = {
            latitude: destinationPlaceDetails.geometry.location.lat,
            longitude: destinationPlaceDetails.geometry.location.lng
          };
          
          const origin = {...originPlace};
          const destination = {...destinationPlace};
          const departureTime = {
            departureTime: moment(startDateTime).toDate()
          };
          const inputPlaces = {origin, destination, departureTime};
          const durationDetails = await getDistanceMatrix(inputPlaces);

          await GGRoutes.create({
            routeId: routeId,
            scheduleId: scheduleId,
            ggDuration: durationDetails.data.duration.value,
            trafficDuration: durationDetails.data.duration_in_traffic.value,
            departureTime: moment(startDateTime).toDate()
          });
         
          return durationDetails.data.duration.value + durationDetails.data.duration_in_traffic.value;
        }
      }
    }
  }

  async checkDESNotAirportIsExist() {
    const tempIRPDESList = [...this.tempIRPList.filter(order => order.type === "DES" && order.status === "DELIVERING")];
    const tempIRPDESListNotAirport = [...tempIRPDESList.filter(order => order.placeType !== "AIRPORT")];
    // console.log("DES not airport:", tempIRPDESListNotAirport.length);

    if (tempIRPDESListNotAirport.length === 0) {
      return false;
    } else {
      // console.log("ID not airport:", tempIRPDESListNotAirport[0].id);
      return true;
    }
  }

  async endProcess2() {
    console.log('endprocess2');
    return;
  }

  async endProcessAdjustment() {

    if (this.IRPLocationList.length > 0) {
      const tempIRPLocationList = [...this.IRPLocationList];
      const tempIRPLocationORI = [...tempIRPLocationList.filter(order => order.type === 'ORI' && order.status === 'COLLECTED')];
      const tempIRPLocationDES = [...tempIRPLocationList.filter(order => order.type === 'DES' && order.status === 'DELIVERED')];
      //console.log('End Process . . .');
      const createOrders = [];
      const orderExistsInIRP = await this.checkNewOrderIsExistsInTheIRP();

      if(orderExistsInIRP === true){
        this.plan = await Plans.create({
          driverId: this.driver.id,
          updatedBy: 1, // manager id
          createdBy: 1, // manager id
          status: this.refreshmentData.workingStatus
        });

        tempIRPLocationORI.forEach((order) => { 
          let tempDESDetails = { ...this.IRPLocationList.find(o => o.id === this.orderN.id && o.type === "DES") };
          const orderORI = {
            planId: this.plan.id,
            orderId: order.id,
            transportationTime: order.transportationTime,
            collectingTime: moment(order.collectingTime).toDate(),
            arrivingTime: moment(order.arrivingTime).toDate(),
            possibleCollectingTime: moment(order.possibleCollectingTime).toDate(),
            type: 'ORI',
            placeId: order.placeId
          };
  
          const orderDES = {
            planId: this.plan.id,
            orderId: order.id,
            transportationTime: tempDESDetails.transportationTime,
            collectingTime: moment(tempDESDetails.collectingTime).toDate(),
            arrivingTime: moment(order.arrivingTime).toDate(),
            possibleCollectingTime: moment(order.possibleCollectingTime).toDate(),
            type: 'DES',
            placeId: tempDESDetails.placeId
          };
          createOrders.push(orderORI);
          createOrders.push(orderDES);
        });
        const createOrderList = _.orderBy(createOrders, ['time', 'collectingTime'], ['ASC']);

        await PlanLocations.bulkCreate(createOrderList);
        this.stopRunning = moment().format("HH:mm:ss");
        console.log("=======================================================");
        console.log("Driver ID:", this.driver.id);
        console.log("Driver Place ID:", this.driverStartPlaceId);
        console.log("Start Time:", moment.utc(this.startTime).format('MMMM Do YYYY, h:mm:ss a'));
        console.log("Latitude:", this.driver.latitude);
        console.log("Longitude:", this.driver.longitude);
        console.log("Plan ID:", this.plan.id);
        console.log("Running Time:", moment.utc(moment(this.stopRunning, "HH:mm:ss").diff(moment(this.startRunning, "HH:mm:ss"))).format("HH:mm:ss"));
        await this.printDetails(this.IRPLocationList, "IRP Location List");
        console.log("====================  more details ====================");
        console.log('IRPLocationList', this.IRPLocationList);
        console.log("=======================================================");
        
        io.emit('MRP', { message: 'PROCESSED', isProcessing: false, IRPLocationList: this.IRPLocationList });
        return;
      }{
        this.stopRunning = moment().format("HH:mm:ss");
        console.log("=======================================================");
        console.log("Driver ID:", this.driver.id);
        console.log("Driver Place ID:", this.driverStartPlaceId);
        console.log("Start Time:", moment.utc(this.startTime).format('MMMM Do YYYY, h:mm:ss a'));
        console.log("Latitude:", this.driver.latitude);
        console.log("Longitude:", this.driver.longitude);
        console.log("Plan ID:", this.plan.id);
        console.log("Running Time:", moment.utc(moment(this.stopRunning, "HH:mm:ss").diff(moment(this.startRunning, "HH:mm:ss"))).format("HH:mm:ss"));
        await this.printDetails(this.IRPLocationList, "IRP Location List");
        console.log("====================  more details ====================");
        console.log('IRPLocationList', this.IRPLocationList);
        console.log("=======================================================");
        
        io.emit('MRP', { message: 'PROCESSED', isProcessing: false, IRPLocationList: this.IRPLocationList });
        return;
      }
    }
  }

  async checkNewOrderIsExistsInTheIRP(){
    let orders = await this.IRPLocationList.map(order => order.id);
    orders = _.uniq(orders);
    return orders.includes(this.newOrderORI.id);
  }

  async endProcess() {
    if (this.IRPLocationList.length > 0) {
      this.plan = await Plans.create({
        driverId: this.driver.id,
        updatedBy: 1, // manager id
        createdBy: 1, // manager id
      });

      const tempIRPLocationList = [...this.IRPLocationList];
      const tempIRPLocationORI = [...tempIRPLocationList.filter(order => order.type === 'ORI' && order.status === 'COLLECTED')];
      const tempIRPLocationDES = [...tempIRPLocationList.filter(order => order.type === 'DES' && order.status === 'DELIVERED')];
      console.log('End Process . . .');

      const createOrders = [];

      tempIRPLocationORI.forEach((order) => { 
        let tempDESDetails = { ...this.IRPLocationList.find(o => o.id === this.orderN.id && o.type === "DES") };

        const orderORI = {
          planId: this.plan.id,
          orderId: order.id,
          transportationTime: order.transportationTime,
          collectingTime: moment(order.collectingTime).toDate(),
          arrivingTime: moment(order.arrivingTime).toDate(),
          possibleCollectingTime: moment(order.possibleCollectingTime).toDate(),
          type: 'ORI',
          placeId: order.placeId,
        };

        const orderDES = {
          planId: this.plan.id,
          orderId: order.id,
          transportationTime: tempDESDetails.transportationTime,
          collectingTime: moment(tempDESDetails.collectingTime).toDate(),
          arrivingTime: moment(order.arrivingTime).toDate(),
          possibleCollectingTime: moment(order.possibleCollectingTime).toDate(),
          type: 'DES',
          placeId: tempDESDetails.placeId
        };
        createOrders.push(orderORI);
        createOrders.push(orderDES);
      });

      const createOrderList = _.orderBy(createOrders, ['time', 'collectingTime'], ['ASC']);
      PlanLocations.bulkCreate(createOrderList);
    }

    this.stopRunning = moment().format("HH:mm:ss");
    console.log("=======================================================");
    console.log("Driver ID:", this.driver.id);
    console.log("Driver Place ID:", this.driverStartPlaceId);
    console.log("Start Time:", moment.utc(this.startTime).format('MMMM Do YYYY, h:mm:ss a'));
    console.log("Latitude:", this.driver.latitude);
    console.log("Longitude:", this.driver.longitude);
    //console.log("Plan ID:", this.plan.id);
    console.log("Running Time:", moment.utc(moment(this.stopRunning, "HH:mm:ss").diff(moment(this.startRunning, "HH:mm:ss"))).format("HH:mm:ss"));
    await this.printDetails(this.IRPLocationList, "IRP Location List");
    console.log("====================  more details ====================");
    console.log('IRPLocationList', this.IRPLocationList);
    console.log("=======================================================");
    
    io.emit('MRP', { message: 'PROCESSED', isProcessing: false, IRPLocationList: this.IRPLocationList });
  }

  async getMoreOrdersStatusNotDropYet() {
    
    const realOrderN = {...this.orderN};
    this.tempIRPLocationList = [...this.IRPLocationList];
    this.tempIRPList = [...this.IRPList];
    // get calculatingOrder from database   
    this.calculatingOrders = await getCalculatingOrders();
    // find orderZ DES
    const orderZ = { ...await this.findOrderZDES() };
    // if orderZ place type is airport, we have to filter only same route.
    const orderZPlaceId = orderZ.placeId;
 
    const calculationORINotAirport = [...this.calculatingOrders.filter(order => order.originPlace.typeId !== 1)];
    const calculationOrdersDESAirport = [...calculationORINotAirport.filter(order => order.destinationPlace.typeId === 1)];
    const calculationOrdersDESNotAirport = [...calculationORINotAirport.filter(order => order.destinationPlace.typeId !== 1)];

    const calculationOrdersDESSameAirport = [...calculationOrdersDESAirport.filter(order => order.destinationPlace.placeId === orderZPlaceId)];

    if(orderZ.placeType === "AIRPORT"){
      this.calculatingOrders = [...calculationOrdersDESNotAirport, ...calculationOrdersDESSameAirport];
      this.calculatingOrders = _.orderBy(this.calculatingOrders,["id"], ["ASC"]);
    }

    // seperate calculatingOrders into spotList (ORI CASE)
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

    //get all orders that can go to this IRP to the spotList and then tempOrderList
    this.tempOrderList = [...this.spotList];
    const previousOrderInIRPLocationList = {...this.IRPLocationList[this.IRPLocationList.length - 1]};
    //console.log("previousOrderInIRPLocationList", previousOrderInIRPLocationList);
    
    this.tempOrderList = await Promise.all(
      this.tempOrderList.map(async (order) => {
        order.transportationTime = await this.getSmartDuration(previousOrderInIRPLocationList.placeId, order.placeId, moment(previousOrderInIRPLocationList.collectingTime).toDate());
        return order;
      }),
    );

    this.tempOrderList = this.tempOrderList.filter(order => {
      if(moment(order.time).toDate() > moment(previousOrderInIRPLocationList.collectingTime).add(order.transportationTime, "seconds").toDate()){
        return order;
      }
    });

    //check is there any order in the spotlist
    if(this.tempOrderList.length === 0){
      this.finishedNotDropYet = true;
      this.endIRPProcess = true;
      this.spotList = [...this.IRPList.filter(order => {
        if(order.type === "DES" && order.status === "DELIVERING"){
          return order;
        }
      })];
      this.tempOrderList = [...this.spotList];
      this.IRPLocationList = [...this.tempIRPLocationList];
      this.endIRPProcess = true;
      await this.processSecondRun();
    }else{
      // tempOrderList.length more than 0
      this.tempOrderList.filter( order => {
        let orderDetails = this.calculatingOrders.find( od => { return od.id === order.id });
        if(orderDetails.numberOfLuggage <= this.currentCarCap){
          return order;
        }
      });

      if(this.tempOrderList.length === 0){
        this.finishedNotDropYet = true;
        this.endIRPProcess = true;
        this.spotList = [...this.IRPList.filter(order => {
          if(order.type === "DES" && order.status === "DELIVERING"){
            return order;
          }
        })];
        this.tempOrderList = [...this.spotList];
        this.IRPLocationList = [...this.tempIRPLocationList];
        this.endIRPProcess = true;
        await this.processSecondRun();
      }else{
        while(this.tempOrderList.length !== 0){
          //cal TT before sort orders
          const previousOrder = {...this.IRPLocationList[this.IRPLocationList.length - 1]};

          this.tempOrderList = await Promise.all(
            this.tempOrderList.map(async (order) => {
              order.transportationTime = await this.getSmartDuration(previousOrder.placeId, order.placeId, moment(previousOrder.collectingTime).toDate());
              return order;
            }),
          );

          this.tempOrderList = _.orderBy(this.tempOrderList, ['time', 'transportationTime'], ['ASC']);
          this.orderN = {...this.tempOrderList[0]};
          this.tempIRPLocationList.push(this.orderN);
          this.tempIRPList.push(this.orderN);

          await this.createNOrderDES();
          await this.updateNewATForBeforeCheckingAvailable();

          
          //find ADES
          const orderADES = await this.findOrderADES();
          //calculate TT orderN placeId -> ADES
          const TTOrderNToOrderADES = await this.getSmartDuration(this.orderN.placeId, orderADES.placeId, moment(this.orderN.time).toDate());

          if(moment(this.orderN.time).add(TTOrderNToOrderADES, 'seconds') >= moment(orderADES.arrivingTime).toDate()){
            await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI"); 
            this.tempIRPList = [...this.IRPList];
            this.tempIRPLocationList = [...this.IRPLocationList];
            // console.log("locationList:", this.tempIRPLocationList);
            // return;
            continue;
          }else{
            let i = this.tempIRPLocationList.length - 1;
            while(i >= 0){
              if(this.tempIRPLocationList.length - 1 === i){
                this.tempIRPLocationList[i].collectingTime = moment(this.orderN.time).toDate();
              }else{
                let TTFromCurrentLocationToNextLocation = await this.getSmartDuration(this.tempIRPLocationList[i].placeId, this.tempIRPLocationList[i+1].placeId, moment(this.tempIRPLocationList[i].collectingTime).toDate());
                //console.log("TT", TTFromCurrentLocationToNextLocation);
                this.tempIRPLocationList[i].collectingTime = moment(this.tempIRPLocationList[i+1].collectingTime).add(-TTFromCurrentLocationToNextLocation, "seconds").toDate();
              }
              i = i - 1;
            }
            this.IRPLocationList = [...this.tempIRPLocationList];
            //console.log("orderN (real)", realOrderN);
            this.orderN = {...this.tempIRPLocationList[this.tempIRPLocationList.length-1]};
            this.calculatingOrders = await getCalculatingOrders();
            await this.createNOrderDES();
            await this.takeNOrderToIRP();
            await this.processSecondRun();
            return;
          }
        };
        if(this.tempOrderList.length === 0){
          this.finishedNotDropYet = true;
          this.endIRPProcess = true;
          this.spotList = [...this.IRPList.filter(order => {
            if(order.type === "DES" && order.status === "DELIVERING"){
              return order;
            }
          })];
          this.tempOrderList = [...this.spotList];
          this.IRPLocationList = [...this.tempIRPLocationList];
          this.endIRPProcess = true;
          await this.processSecondRun();
          // console.log("IRPList:", this.IRPList);
          // console.log("finish");
        }
      }
    }
  }

  async getAllOrdersTransportations(originPlaceId, departureTime) {
    this.tempOrderList = await Promise.all(
      this.tempOrderList.map(async (order) => {
        order.transportationTime = await this.getSmartDuration(originPlaceId, order.placeId, moment(departureTime).toDate());
        if(order.type === "ORI"){
          if(moment(departureTime).add(order.transportationTime, "seconds").toDate() > moment(order.time).toDate()){
            order.possibleCollectingTime = moment(departureTime).add(order.transportationTime, "seconds").toDate();
          }else{
            order.possibleCollectingTime = moment(order.time).toDate();
          }
        }else{
          order.possibleCollectingTime = moment(departureTime).add(order.transportationTime, "seconds").toDate();
        }
        return order;
      }),
    );
  }

  async deliveredOrderN() {
    this.IRPList = this.IRPList.map((order) => {
      if (order.id === this.orderN.id) order.status = 'DERIVERED';
      return order; 
    });
    this.IRPLocationList.push(this.orderN);
  }

  async checkAllOrdersWereDropped() {
    const tempIRPDESList = [...this.tempIRPList.filter(order => order.type === 'DES' && order.status === 'DELIVERING')];
    if (tempIRPDESList.length > 0) {
      this.dropOffStatus = false;
      return this.dropOffStatus;
    } else {
      this.dropOffStatus = true;
      return this.dropOffStatus;
    }
  }

  async createNOrderDES() {
    
    const allOrdersAndTheirDetails = await getALLOrdersAndTheirDetails();
    //getALLOrdersAndTheirDetails
    const orderNDetails = { ...allOrdersAndTheirDetails.find(order => order.id === this.orderN.id) };
    const tempOrderN = { ...this.orderN };
    if (!orderNDetails.destinationPlace) {

    }
    this.orderNDES = {
      id: tempOrderN.id,
      type: 'DES',
      arrivingTime: moment(tempOrderN.arrivingTime).toDate(),
      realArrivingTime: moment(tempOrderN.arrivingTime).toDate(),
      code: tempOrderN.code,
      numberOfLuggage: tempOrderN.numberOfLuggage,
      placeId: orderNDetails.destinationPlace.placeId,
      time: moment(orderNDetails.pickupTime).toDate(),
      possibleCollectingTime: null,
      possibleArrivingTime: null,
      latitude: orderNDetails.destinationPlace.latitude,
      longitude: orderNDetails.destinationPlace.longitude,
      collectingTime: null,
      transportationTime: null,
      placeType: orderNDetails.destinationPlace.type.type,
      status: 'DELIVERING',
      placeName: orderNDetails.destinationPlace.name,
    };
  }

  async takeNOrderToIRPRefreshment() {

    this.currentCarCap = this.currentCarCap - this.orderN.numberOfLuggage;
    await this.removeNOrderByTypeFromSpotList(this.orderN.id, 'ORI');
    this.spotList.push(this.orderNDES);

    let checkORIIsExist = false;

    this.IRPLocationList.forEach(order => {
      if(order.type === "ORI" && order.id === this.orderN.id){
        checkORIIsExist = true;
        order.status = "COLLECTED";
      }
    });

    if(!checkORIIsExist){
      this.orderN.status = 'COLLECTED';
      this.IRPList.push(this.orderN);
      this.IRPLocationList.push(this.orderN);
    }

    await this.updateCollectingTimeRun2();

    const orderNDESIsExistIRP = [...this.IRPList.filter(order => order.id === this.orderNDES.id
      && order.type === 'DES')];

    const orderNDESIsExistTempIRP = [...this.tempIRPList.filter(order => order.id === this.orderNDES.id
      && order.type === 'DES')];

    if (orderNDESIsExistIRP.length === 0) {
      this.IRPList.push(this.orderNDES);
    }

    if (orderNDESIsExistTempIRP.length === 0) {
      this.tempIRPList.push(this.orderNDES);
    }

    await Orders.update(
      { status: 2 },
      {
        where: {
          id: this.orderN.id,
        }
      }
    );
    
    //await this.checkRemoveAnotherAirport();
  }

  async takeNOrderToIRP() {

    this.currentCarCap = this.currentCarCap - this.orderN.numberOfLuggage;
    await this.removeNOrderByTypeFromSpotList(this.orderN.id, 'ORI');
    this.spotList.push(this.orderNDES);

    let checkORIIsExist = false;

    this.IRPLocationList.forEach(order => {
      if(order.type === "ORI" && order.id === this.orderN.id){
        checkORIIsExist = true;
        order.status = "COLLECTED";
      }
    });

    if(!checkORIIsExist){
      this.orderN.status = 'COLLECTED';
      this.IRPList.push(this.orderN);
      this.IRPLocationList.push(this.orderN);
    }

    await this.updateCollectingTimeRun2();

    const orderNDESIsExistIRP = [...this.IRPList.filter(order => order.id === this.orderNDES.id
      && order.type === 'DES')];

    const orderNDESIsExistTempIRP = [...this.tempIRPList.filter(order => order.id === this.orderNDES.id
      && order.type === 'DES')];

    if (orderNDESIsExistIRP.length === 0) {
      this.IRPList.push(this.orderNDES);
    }

    if (orderNDESIsExistTempIRP.length === 0) {
      this.tempIRPList.push(this.orderNDES);
    }

    await Orders.update(
      { status: 2 },
      {
        where: {
          id: this.orderN.id,
        }
      }
    );
    
    //await this.checkRemoveAnotherAirport();
  }

  async checkRemoveAnotherAirport(){
    const orderZDES = await this.findOrderZDES();

    if(this.orderNDES.placeType === "AIRPORT" && this.orderNDES.placeId !== orderZDES.placeId && this.filterAnotherAirport === false){
      // this.spotList = this.spotList.foreach(order => order.){

      // }
      this.filterAnotherAirport = true;
    }
  }

  async findDepartureTimeSchedule(departureTime) {
    const schedules = await Schedules.findAll();
    if(schedules.length > 0){
      const scheduleDetails = schedules.filter(schedule => (moment(departureTime, "HH:mm:ss").isBetween( moment(schedule.periodBegin, "HH:mm:ss"), moment(schedule.periodEnd, "HH:mm:ss"))));
      if(scheduleDetails.length > 0)
      {
        return scheduleDetails[0].id;
      }else{
        return 1;
      }
    }else{
      return 1;
    }
  }

  async checkHistoricRouteIsExistByPlaceId(driverId, routeId, scheduleId) {
    const result = await HistoricRoutes.findAll({
      where: {
        scheduleId: scheduleId,
        routeId: routeId,
        driverId: driverId
      }
    });

    if(result){
      return result;
    }else{
      return null;
    }
  }

  async checkRouteIsExistByPlaceId(originPlaceId, destinationPlaceId) {
    const result = await Routes.findOne({
      attributes: ["id", "oriPlaceId", "desPlaceId"],
      include: [{
        model: Places,
        as: "originPlace",
        attributes: ["placeId", "name", "latitude", "longitude"]
      },{
        model: Places,
        as: "destinationPlace",
        attributes: ["placeId", "name", "latitude", "longitude"]
      }],
      where: {
        oriplaceId: originPlaceId,
        desPlaceId: destinationPlaceId
      }
    });
    
    if(result){
      return result;
    }else{
      return null;
    }
  }

  async printDetails(myArray, arrayName) {
    const count = myArray.length;
    console.log(`-------${  arrayName  }-------`);
    if (count > 0) {
      if (count === 1) {
        console.log(`There is ${  count/2  } order`);
      } else {
        console.log(`There are ${  count/2  } orders`);
      }
    } else {
      console.log('There is not any order');
    }

    for (let i = 0; i < count; i++) {
      if (myArray.type === 'ORI') {
        console.log(`${i + 1 }. id: ${myArray[i].id}[${myArray[i].type}][${myArray[i].status}]`);
      } else {
        console.log(`${i + 1}. id: ${myArray[i].id}[${myArray[i].type}][${myArray[i].status}]`);
      }
    }
  }

  async orderNConsideration() {
    this.orderN = { ...this.tempOrderList[0] };
    const sameTransportationList = [...this.tempOrderList.filter(order => order.transportationTime === this.orderN.transportationTime)];
    const sameTransportationListDES = [...sameTransportationList.filter(order => order.type === 'DES')]; // order des no have status yet
    if (sameTransportationListDES.length > 0) {
      this.orderN = { ...sameTransportationListDES[0] };
    } else {
      const sameTransportationListORI = [...sameTransportationList.filter(order => order.type === 'ORI')];
      const IRPDESList = [...this.IRPList.filter(order => order.type === 'DES' && order.status === 'DELIVERING')];

      let flag = true;
      if (sameTransportationListORI.length > 0) {
        for (let i = 0; i < sameTransportationListORI.length && flag === true; i += 1) {
          this.orderN = { ...sameTransportationListORI[i] };
          this.createNOrderDES(); 
          const sameIRPDES = [...IRPDESList.filter(order => order.placeId === this.orderNDES.placeId)];
          if (sameIRPDES.length > 0) {
            flag = false;
          }
        }
      } else {
        this.orderN = { ...sameTransportationList[0] };
      }
    }
    //console.log("Select orderN:", this.orderN);
  }

  async gotoLoop(){
    console.log("Go to loop...");
  }



  async orderNSmartConsideration() {
    //define NOrder in tempOrderList with lowest TT and AT.
    
    this.orderN = { ...this.tempOrderList[0] };
    //console.log("orderN", this.orderN);
    //get list of same lowest TT.
    const sameTransportationList = [...this.tempOrderList.filter(order => order.transportationTime === this.orderN.transportationTime)];
    //List of same lowest TT, Is there any Drop off case.
    //console.log("Same TT List", sameTransportationList);
    
    const sameTransportationListDES = [...sameTransportationList.filter(order => order.type === 'DES')]; // order des no have status yet
    //console.log("Same TT only drop case", sameTransportationListDES);
    
    // sameTransportationList is always greater or equal to 1
    if(sameTransportationList.length > 0){
      //only on lowest TT
      if(sameTransportationListDES.length > 0){
        //Same TT drop off case
        this.orderN = {...sameTransportationListDES[0]};
        //console.log("Select orderN:", this.orderN);
        return true;
      }else{
        //Same TT collecting case
        //same transportation list no drop off case inside
        const sameTransportationListORI = [...sameTransportationList.filter(order => order.type === 'ORI')];
        const IRPDESList = [...this.IRPList.filter(order => order.type === 'DES' && order.status === 'DELIVERING')];
        //same TT list whith waiting status
        const listOfSameTTWithWaitingStatus = await Promise.all([...sameTransportationListORI.map(async (order) => {
        
          let waitingOrderN = await Orders.findOne({
            where: {
              id: order.id
            }
          });
          if(waitingOrderN.status === 1){
            return order;
          }
        })]);

        if(listOfSameTTWithWaitingStatus.length > 0){
          if(listOfSameTTWithWaitingStatus.length === 1){
            // There is only one case that status "Waiting"
            this.orderN = listOfSameTTWithWaitingStatus[0];
            return true;
          }else{
            // There are more than 1 case
            let flag = true;

            for (let i = 0; i < listOfSameTTWithWaitingStatus.length && flag === true; i += 1) {
              this.orderN = { ...listOfSameTTWithWaitingStatus[i] };
              this.createNOrderDES(); 
              let sameIRPDES = [...IRPDESList.filter(order => order.placeId === this.orderNDES.placeId)];
              if (sameIRPDES.length > 0) {
                flag = false;
              }
            }

            if(flag === false){
              return true;
            }else{
              return false;
            }
          }
        }else{
          //planned status
          const IRPDESList = [...this.IRPList.filter(order => order.type === 'DES' && order.status === 'DELIVERING')];
          const listOfSameTTWithPlannedStatus = await Promise.all([...sameTransportationListORI.map(async (order) => {
        
            let plannedOrderN = await Orders.findOne({
              where: {
                id: order.id
              }
            });
            if(plannedOrderN.status === 2){
              return order;
            }
          })]);

          if(listOfSameTTWithPlannedStatus.length === 1){
            // There is only one case that status "Waiting"
            this.orderN = listOfSameTTWithPlannedStatus[0];
            //console.log("Select orderN:", this.orderN);
            return true;
          }else{
            // There are more than 1 case
            let flag = true;
            for (let i = 0; i < listOfSameTTWithPlannedStatus.length && flag === true; i += 1) {
              this.orderN = { ...listOfSameTTWithPlannedStatus[i] };
              this.createNOrderDES(); 
              const sameIRPDES = [...IRPDESList.filter(order => order.placeId === this.orderNDES.placeId)];
              if (sameIRPDES.length > 0) {
                flag = false;
              }
            }

            if(flag === false){
              const orderNInOtherPlanDetails = await PlanLocations.findOne({
                where: {
                  orderId: this.orderN.id,
                  type: "ORI"
                }
              });

              if(this.orderN.transportationTime > orderNInOtherPlanDetails.transportationTime){
                return false;
              }else{
                return true;
              }
            }else{
              return false;
            }
          }
        }
      }
    }else{
      // sameTransportationList is always greater or equal to 1
      return false;
    }
  }

  async orderNSmartImproveConsiderationRunRefreshWorking() {
    //define NOrder in tempOrderList with lowest TT and AT.
    
    this.orderN = { ...this.tempOrderList[0] };
    const samePossibleCollectingTimeList = [...this.tempOrderList.filter(order => order.transportationTime === this.orderN.transportationTime)];
    const samePossibleCollectingTimeListDES = [...samePossibleCollectingTimeList.filter(order => order.type === 'DES')]; // order des no have status yet
    //console.log("Same TT only drop case", sameTransportationListDES);
    
    // sameTransportationList is always greater or equal to 1
    if(samePossibleCollectingTimeList.length > 0){
      //only on lowest TT
      if(samePossibleCollectingTimeListDES.length > 0){
        //Same TT drop off case
        this.orderN = {...samePossibleCollectingTimeListDES[0]};
        return true;
      }else{
        //Same TT collecting case
        //same transportation list no drop off case inside
        const samePossibleCollectingTimeListORI = [...samePossibleCollectingTimeList.filter(order => order.type === 'ORI')];
        const IRPDESList = [...this.IRPList.filter(order => order.type === 'DES' && order.status === 'DELIVERING')];
        //same TT list whith waiting status
        const listOfSamePCLWithWaitingStatus = await Promise.all([...samePossibleCollectingTimeListORI.map(async (order) => {
        
          let waitingOrderN = await Orders.findOne({
            where: {
              id: order.id
            }
          });
          if(waitingOrderN.status === 1){
            return order;
          }
        })]);

        if(listOfSamePCLWithWaitingStatus.length > 0){
          if(listOfSamePCLWithWaitingStatus.length === 1){
            // There is only one case that status "Waiting"
            this.orderN = listOfSamePCLWithWaitingStatus[0];

            if(this.orderN.possibleCollectingTime === this.orderN.time && this.orderN.type === "ORI"){
              let i = this.tempIRPLocationList.length - 1;
              while(i >= 0){
                if(this.tempIRPLocationList.length - 1 === i){
                  this.tempIRPLocationList[i].collectingTime = moment(this.orderN.time).toDate();
                }else{
                  let TTFromCurrentLocationToNextLocation = await this.getSmartDuration(this.tempIRPLocationList[i].placeId, this.tempIRPLocationList[i+1].placeId, moment(this.tempIRPLocationList[i].collectingTime).toDate());
                  //console.log("TT", TTFromCurrentLocationToNextLocation);
                  this.tempIRPLocationList[i].collectingTime = moment(this.tempIRPLocationList[i+1].collectingTime).add(-TTFromCurrentLocationToNextLocation, "seconds").toDate();
                }
                i = i - 1;
              }
            }

            return true;
          }else{
            // There are more than 1 case
            // this.listOfSamePCLWithWaitingStatus = _.orderBy(
            //   this.listOfSamePCLWithWaitingStatus, 
            //   ["transportationTime"], 
            //   ["ASC"]
            // );

            let flag = true;

            for (let i = 0; i < listOfSamePCLWithWaitingStatus.length && flag === true; i += 1) {
              this.orderN = { ...listOfSamePCLWithWaitingStatus[i] };

              if(this.orderN.possibleCollectingTime === this.orderN.time && this.orderN.type === "ORI"){
                let i = this.tempIRPLocationList.length - 1;
                while(i >= 0){
                  if(this.tempIRPLocationList.length - 1 === i){
                    this.tempIRPLocationList[i].collectingTime = moment(this.orderN.time).toDate();
                  }else{
                    let TTFromCurrentLocationToNextLocation = await this.getSmartDuration(this.tempIRPLocationList[i].placeId, this.tempIRPLocationList[i+1].placeId, moment(this.tempIRPLocationList[i].collectingTime).toDate());
                    //console.log("TT", TTFromCurrentLocationToNextLocation);
                    this.tempIRPLocationList[i].collectingTime = moment(this.tempIRPLocationList[i+1].collectingTime).add(-TTFromCurrentLocationToNextLocation, "seconds").toDate();
                  }
                  i = i - 1;
                }
              }

              this.createNOrderDES(); 
              let sameIRPDES = [...IRPDESList.filter(order => order.placeId === this.orderNDES.placeId)];
              if (sameIRPDES.length > 0) {
                flag = false;
              }
            }

            if(flag === false){
              return true;
            }else{
              return false;
            }
          }
        }else{
          //planned status
          const IRPDESList = [...this.IRPList.filter(order => order.type === 'DES' && order.status === 'DELIVERING')];
          const listOfSamePCLWithWaitingStatus = await Promise.all([...samePossibleCollectingTimeListORI.map(async (order) => {
        
            let plannedOrderN = await Orders.findOne({
              where: {
                id: order.id
              }
            });
            if(plannedOrderN.status === 2){
              return order;
            }
          })]);

          if(listOfSamePCLWithWaitingStatus.length === 1){
            // There is only one case that status "Waiting"
            this.orderN = listOfSamePCLWithWaitingStatus[0];

            if(this.orderN.possibleCollectingTime === this.orderN.time && this.orderN.type === "ORI"){
              let i = this.tempIRPLocationList.length - 1;
              while(i >= 0){
                if(this.tempIRPLocationList.length - 1 === i){
                  this.tempIRPLocationList[i].collectingTime = moment(this.orderN.time).toDate();
                }else{
                  let TTFromCurrentLocationToNextLocation = await this.getSmartDuration(this.tempIRPLocationList[i].placeId, this.tempIRPLocationList[i+1].placeId, moment(this.tempIRPLocationList[i].collectingTime).toDate());
                  //console.log("TT", TTFromCurrentLocationToNextLocation);
                  this.tempIRPLocationList[i].collectingTime = moment(this.tempIRPLocationList[i+1].collectingTime).add(-TTFromCurrentLocationToNextLocation, "seconds").toDate();
                }
                i = i - 1;
              }
            }
            //console.log("Select orderN:", this.orderN);
            return true;
          }else{
            // There are more than 1 case
            let flag = true;
            for (let i = 0; i < listOfSamePCLWithWaitingStatus.length && flag === true; i += 1) {
              this.orderN = { ...listOfSamePCLWithWaitingStatus[i] };
              if(this.orderN.possibleCollectingTime === this.orderN.time && this.orderN.type === "ORI"){
                let i = this.tempIRPLocationList.length - 1;
                while(i >= 0){
                  if(this.tempIRPLocationList.length - 1 === i){
                    this.tempIRPLocationList[i].collectingTime = moment(this.orderN.time).toDate();
                  }else{
                    let TTFromCurrentLocationToNextLocation = await this.getSmartDuration(this.tempIRPLocationList[i].placeId, this.tempIRPLocationList[i+1].placeId, moment(this.tempIRPLocationList[i].collectingTime).toDate());
                    //console.log("TT", TTFromCurrentLocationToNextLocation);
                    this.tempIRPLocationList[i].collectingTime = moment(this.tempIRPLocationList[i+1].collectingTime).add(-TTFromCurrentLocationToNextLocation, "seconds").toDate();
                  }
                  i = i - 1;
                }
              }
              this.createNOrderDES(); 
              const sameIRPDES = [...IRPDESList.filter(order => order.placeId === this.orderNDES.placeId)];
              if (sameIRPDES.length > 0) {
                flag = false;
              }
            }

            if(flag === false){
              const orderNInOtherPlanDetails = await PlanLocations.findOne({
                where: {
                  orderId: this.orderN.id,
                  type: "ORI"
                }
              });

              if(this.orderN.transportationTime > orderNInOtherPlanDetails.transportationTime){
                return false;
              }else{
                return true;
              }
            }else{
              return false;
            }
          }
        }
      }
    }else{
      return false;
    }
  }

  async orderNSmartImproveConsiderationRunRefresh() {
    //define NOrder in tempOrderList with lowest TT and AT.
    
    this.orderN = { ...this.tempOrderList[0] };
    const samePossibleCollectingTimeList = [...this.tempOrderList.filter(order => order.transportationTime === this.orderN.transportationTime)];
    const samePossibleCollectingTimeListDES = [...samePossibleCollectingTimeList.filter(order => order.type === 'DES')]; // order des no have status yet
    //console.log("Same TT only drop case", sameTransportationListDES);
    
    // sameTransportationList is always greater or equal to 1
    if(samePossibleCollectingTimeList.length > 0){
      //only on lowest TT
      if(samePossibleCollectingTimeListDES.length > 0){
        //Same TT drop off case
        this.orderN = {...samePossibleCollectingTimeListDES[0]};
        return true;
      }else{
        //Same TT collecting case
        //same transportation list no drop off case inside
        const samePossibleCollectingTimeListORI = [...samePossibleCollectingTimeList.filter(order => order.type === 'ORI')];
        const IRPDESList = [...this.IRPList.filter(order => order.type === 'DES' && order.status === 'DELIVERING')];
        //same TT list whith waiting status
        const listOfSamePCLWithWaitingStatus = await Promise.all([...samePossibleCollectingTimeListORI.map(async (order) => {
          let waitingOrderN = await Orders.findOne({
            where: {
              id: order.id
            }
          });
          if(waitingOrderN.status === 1){
            return order;
          }
        })]);

        if(listOfSamePCLWithWaitingStatus.length > 0){
          if(listOfSamePCLWithWaitingStatus.length === 1){
            // There is only one case that status "Waiting"
            this.orderN = listOfSamePCLWithWaitingStatus[0];
            return true;
          }else{
            let flag = true;
            for (let i = 0; i < listOfSamePCLWithWaitingStatus.length && flag === true; i += 1) {
              this.orderN = { ...listOfSamePCLWithWaitingStatus[i] };
              await this.createNOrderDES(); 
              let sameIRPDES = [...IRPDESList.filter(order => order.placeId === this.orderNDES.placeId)];
              if (sameIRPDES.length > 0) {
                flag = false;
              }
            }
            return !flag;
          }
        }else{
          //planned status
          const IRPDESList = [...this.IRPList.filter(order => order.type === 'DES' && order.status === 'DELIVERING')];
          const listOfSamePCLWithWaitingStatus = await Promise.all([...samePossibleCollectingTimeListORI.map(async (order) => {
            let plannedOrderN = await Orders.findOne({
              where: {
                id: order.id
              }
            });
            if(plannedOrderN.status === 2){
              return order;
            }
          })]);

          if(listOfSamePCLWithWaitingStatus.length === 1){
            // There is only one case that status "Waiting"
            this.orderN = listOfSamePCLWithWaitingStatus[0];
            return true;
          }else{
            // There are more than 1 case
            let flag = true;
            for (let i = 0; i < listOfSamePCLWithWaitingStatus.length && flag === true; i += 1) {
              this.orderN = { ...listOfSamePCLWithWaitingStatus[i] };
              await this.createNOrderDES(); 
              const sameIRPDES = [...IRPDESList.filter(order => order.placeId === this.orderNDES.placeId)];
              if (sameIRPDES.length > 0) {
                flag = false;
              }
            }

            if(flag === false){
              const orderNInOtherPlanDetails = await PlanLocations.findOne({
                where: {
                  orderId: this.orderN.id,
                  type: "ORI"
                }
              });
              if(this.orderN.transportationTime > orderNInOtherPlanDetails.transportationTime){
                return false;
              }else{
                return true;
              }
            }else{
              return false;
            }
          }
        }
      }
    }else{
      return false;
    }
  }

  async orderNSmartImproveConsiderationRun1() {
    this.orderN = { ...this.tempOrderList[0] };
    //get list of same lowest PCL.
    const samePossibleCollectingTimeList = [...this.tempOrderList.filter(order => 
      order.possibleCollectingTime === this.orderN.possibleCollectingTime &&
      order.type === "ORI")];
    // samePossibleCollectingTimeList is always greater or equal to 1
    if(samePossibleCollectingTimeList.length > 0){
      //only on lowest TT
      if(samePossibleCollectingTimeList.length === 1){
        this.orderN = {...samePossibleCollectingTimeList[0]};
        if(this.orderN.time === this.orderN.possibleCollectingTime){
            this.orderN.collectingTime = this.orderN.possibleCollectingTime;
        }
      }else{
        const listOfSamePCLWithWaitingStatus = await Promise.all([...samePossibleCollectingTimeList.map(async (order) => {
          let waitingOrderN = await Orders.findOne({
            where: {
              id: order.id
            }
          });
          if(waitingOrderN.status === 1){
            return order;
          }
        })]);

        if(listOfSamePCLWithWaitingStatus.length > 0){
          //AT
          this.listOfSamePCLWithWaitingStatus = _.orderBy(
            this.listOfSamePCLWithWaitingStatus, 
            ["transportationTime"], 
            ["ASC"]
          );
          this.orderN = listOfSamePCLWithWaitingStatus[0];
          if(this.orderN.time === this.orderN.possibleCollectingTime){
              this.orderN.collectingTime = this.orderN.possibleCollectingTime;
          }
        }else{
          this.samePossibleCollectingTimeList = _.orderBy(
            this.samePossibleCollectingTimeList, 
            ["transportationTime"], 
            ["ASC"]
          );
          this.orderN = this.orderN = {...this.samePossibleCollectingTimeList[0]};
          if(this.orderN.time === this.orderN.possibleCollectingTime){
            this.orderN.collectingTime = this.orderN.possibleCollectingTime;
          }
        }
      }
    }
  }

  async updateCollectingTime() {
    const dropTime = moment(this.orderN.time).toDate();
    if (moment(this.collectingTime).toDate() >= moment(dropTime).toDate()) {

    } else {
      this.collectingTime = moment(dropTime).toDate();
    }
    this.orderN.collectingTime = moment(this.collectingTime).toDate();
  }
  
  async updateCollectingTimeRun2() {
    let i = this.IRPLocationList.length - 1;
    while(i >= 0){
      if(this.IRPLocationList.length - 1 === i){
        this.IRPLocationList[i].collectingTime = moment(this.orderN.collectingTime).toDate();
      }else{
        let TTFromCurrentLocationToNextLocation = await this.getSmartDuration(this.IRPLocationList[i].placeId, this.IRPLocationList[i+1].placeId, moment(this.IRPLocationList[i].collectingTime).toDate());
        //console.log("TT", TTFromCurrentLocationToNextLocation);
        this.IRPLocationList[i].collectingTime = moment(this.IRPLocationList[i+1].collectingTime).add(-TTFromCurrentLocationToNextLocation, "seconds").toDate();
      }
      i = i - 1;
    }
  }

  async findTempOrderADES() {
    const tempOrderDES = [...this.IRPList.filter(order => order.type === 'DES' && order.status === 'DELIVERING')];
    if (tempOrderDES.length > 0) {
      return { ...tempOrderDES[0] };
    } else {
      return null;
    }
  }

  async findPreviousOrderDES() {
    const previousOrder = await this.findPreviousOrder();
    const previousOrderDES = {
      ...this.IRPList.find(order => order.id === previousOrder.id
                                                            && order.type === 'DES'),
    };
    return previousOrderDES;
  }

  async findOrderADES() {
    await this.sortTempDESByPlaceTypeAndAT();
    const tempIRPList = [...this.tempIRPList];
    const tempIRPDESDeliveringList = [...tempIRPList.filter(order => order.type === 'DES' && order.status === 'DELIVERING')];
    const orderADES = { ...tempIRPDESDeliveringList[0] };
    if (tempIRPDESDeliveringList.length > 0) {
      return orderADES;
    } else {
      return null;
    }
  }

  async findOrderZDES() {
    await this.sortTempDESByPlaceTypeAndAT();
    const tempIRPList = [...this.tempIRPList];
    const tempIRPDESDeliveringList = [...tempIRPList.filter(order => order.type === 'DES' && order.status === 'DELIVERING')];
    const orderZDES = { ...tempIRPDESDeliveringList[tempIRPDESDeliveringList.length - 1] };
    if (tempIRPDESDeliveringList.length > 0) {
      return orderZDES;
    } else {
      return null;
    }
  }

  async findPreviousOrder() {
    const orderIRPLocationList = [...this.IRPLocationList];
    return orderIRPLocationList[orderIRPLocationList.length - 1];
  }

  async filterOrderByStatus(orders, type, status) {
    return orders.filter(order => order.type === type && order.status === status);
  }

  async updateTempIRPListAT() {
    const orderZ = { ...this.findOrderZDES() };
    this.tempIRPList.push(this.orderNDES);

    if (orderZ.placeType === 'AIRPORT') {
      let allOrderDESSameAirport = [
        ...this.tempIRPList.filter(
          order => order.type === 'DES'
            && order.placeType === 'AIRPORT'
            && order.status === 'DELIVERING'
            && order.placeId === this.orderNDES.placeId,
        ),
      ];
      allOrderDESSameAirport = _.orderBy(['arrivingTime'], ['ASC']);
      const indexOfOrderNDES = allOrderDESSameAirport.findIndex(order => order.id === this.orderNDES.id);
      this.tempIRPList = this.tempIRPList.map((order, index) => {
        if (index >= indexOfOrderNDES) {
          if (this.orderNDES.placeId === order.placeId) {
            order.arrivingTime = moment(this.orderNDES.arrivingTime).toDate();
          }
        }
        return order;
      });
    } else {
    }
  }

  async sortDESByPlaceTypeAndAT() {
    const IRPORI = [...this.IRPList.filter(order => order.type === 'ORI' || order.status === 'DELIVERED')];
    const IRPDES = [...this.IRPList.filter(order => order.type === 'DES' && order.status === 'DELIVERING')]; // delivering
    let tempIRPDES = [...IRPDES];
    tempIRPDES = _.orderBy(tempIRPDES, ['arrivingTime'], ['ASC']);
    const tempIRPList = [
      ...IRPORI,
      ...tempIRPDES.filter(order => order.placeType !== 'AIRPORT'),
      ...tempIRPDES.filter(order => order.placeType === 'AIRPORT'),
    ];
    this.IRPList = [...tempIRPList];
  }

  async sortTempDESByPlaceTypeAndAT() {
    const IRPORI = [...this.tempIRPList.filter(order => order.type === 'ORI' || order.status === 'DELIVERED')];
    const IRPDES = [...this.tempIRPList.filter(order => order.type === 'DES' && order.status === 'DELIVERING')];
    let tempIRPDES = [...IRPDES];
    tempIRPDES = _.orderBy(tempIRPDES, ['arrivingTime'], ['ASC']);
    this.tempIRPList = [
      ...IRPORI,
      ...tempIRPDES.filter(order => order.placeType !== 'AIRPORT'),
      ...tempIRPDES.filter(order => order.placeType === 'AIRPORT'),
    ];
  }

  async sortTempDESByPlaceTypeAndATConsolidation(tempIRPListConsolidation) {
    const IRPORI = [...tempIRPListConsolidation.filter(order => order.type === 'ORI' || order.status === 'DELIVERED')];
    const IRPDES = [...tempIRPListConsolidation.filter(order => order.type === 'DES' && order.status === 'DELIVERING')];
    let tempIRPDES = [...IRPDES];
    tempIRPDES = _.orderBy(tempIRPDES, ['arrivingTime'], ['ASC']);
    tempIRPListConsolidation = [
      ...IRPORI,
      ...tempIRPDES.filter(order => order.placeType !== 'AIRPORT'),
      ...tempIRPDES.filter(order => order.placeType === 'AIRPORT'),
    ];

    return tempIRPListConsolidation;
  }

  async checkOrderNIsAvailable() {
    const tempOrderADES = await this.findTempOrderADES();
    const LTofOrderNToTempOrderADES = await this.getSmartDuration(this.orderN.placeId, tempOrderADES.placeId, moment(this.orderN.collectingTime).toDate());
    if (moment(tempOrderADES.arrivingTime).toDate() > moment(this.orderN.collectingTime).add(LTofOrderNToTempOrderADES, 'seconds').toDate()) {
      this.arrivingTimeOfIRP = moment(tempOrderADES.arrivingTime).toDate();
      this.IRPList = [...this.tempIRPList];
      return true;
    } else {
      return false;
    }
  }

  async checkOrderNDESIsAvailable() {
    const orderADES = await this.findOrderADES();
    const LTofOrderNToOrderADES = await this.getSmartDuration(this.orderN.placeId, orderADES.placeId, moment(this.orderN.collectingTime).toDate());
    if (moment(orderADES.arrivingTime).toDate() >= moment(this.collectingTime).add(LTofOrderNToOrderADES, 'seconds').toDate()) {
      return true;
    } else {
      return false;
    }
  }

  async checkOrderNDESIsAvailableDropoff(orderADES) {

    const LTofOrderNToOrderADES = await this.getSmartDuration(this.orderN.placeId, orderADES.placeId, moment(this.collectingTime).toDate());
    if (moment(orderADES.arrivingTime).toDate() >= moment(this.collectingTime).add(LTofOrderNToOrderADES, 'seconds').toDate()) {
      return true;
    } else {
      // console.log("locationlist:", this.tempIRPLocationList);
      // console.log("IRPlocationlist:", this.IRPLocationList);
      // // console.log("LT:", LTofOrderNToOrderADES);
      // console.log("not ontime");
      // console.log("orderN:", this.orderN);
      // console.log("collecting time", this.collectingTime);
      // console.log("TT from orderN to ADES:", moment(this.collectingTime).add(LTofOrderNToOrderADES, 'seconds').toDate());
      // console.log("A AT:", moment(orderADES.arrivingTime).add(0, 'minutes').toDate())                                        
      return false;
    }
  }

  async updateTempIRPOrderDESStatus(orderNID, status) {
    this.tempIRPList.forEach(order => {
      if(order.id === orderNID && order.type === "DES"){
        order.status = status;
      }
    });
  }

  async updateIRPOrderDESStatus(orderNID, status) {
    this.IRPList.forEach(order => {
      if(order.id === orderNID && order.type === "DES"){
        order.status = status;
      }
    });
  }

  async updateNewATForConsolidation(tempIRPConsolidationList) {
    let i = 0;
    const orderORIAndDESDeliveredList = [...tempIRPConsolidationList.filter(order => order.type === 'ORI'
                        || order.status === 'DELIVERED')];

    const orderDESDeliveringList = [...tempIRPConsolidationList.filter(order => order.type === 'DES'
                        && order.status === 'DELIVERING')];

    const tempIRPDES = _.orderBy([...orderDESDeliveringList], ['arrivingTime'], ['ASC']);

    if(tempIRPDES.length > 0){
      while (i !== tempIRPDES.length - 1) {
        const lastIndex = tempIRPDES.length - 1;
        const orderX = { ...tempIRPDES[lastIndex - i - 1] };
        const orderZ = { ...tempIRPDES[lastIndex - i] };
  
        const TT = await this.getSmartDuration(orderX.placeId, orderZ.placeId, moment(orderX.collectingTime).toDate());
        const newAT = moment(orderZ.arrivingTime).add(-TT, 'seconds').toDate();
        
        if (moment(newAT).toDate() < moment(orderX.arrivingTime).toDate()) {
          if (moment(newAT).toDate() > moment(tempIRPDES[lastIndex - i - 1].realArrivingTime).toDate()) {
            tempIRPDES[lastIndex - i - 1].arrivingTime = moment(orderX.realArrivingTime).toDate();
          } else {
            tempIRPDES[lastIndex - i - 1].arrivingTime = moment(newAT).toDate();
          }
        }
        i += 1;
      }
    }
    
    tempIRPConsolidationList = [
      ...orderORIAndDESDeliveredList,
      ...orderDESDeliveringList,
    ];

    return await this.sortTempDESByPlaceTypeAndATConsolidation(tempIRPConsolidationList);
  }

  async updateNewATForBeforeCheckingAvailableDropoff() {
    let i = 0;
    const orderORIAndDESDeliveredList = [...this.tempIRPList.filter(order => order.type === 'ORI'
                        || order.status === 'DELIVERED')];

    const orderDESDeliveringList = [...this.tempIRPList.filter(order => order.type === 'DES'
                        && order.status === 'DELIVERING')];

    const tempIRPDES = _.orderBy([...orderDESDeliveringList], ['arrivingTime'], ['ASC']);

    if(tempIRPDES.length > 0){
      while (i !== tempIRPDES.length - 1) {
        const lastIndex = tempIRPDES.length - 1;
        const orderX = { ...tempIRPDES[lastIndex - i - 1] };
        const orderZ = { ...tempIRPDES[lastIndex - i] };
  
        const TT = await this.getSmartDuration(orderX.placeId, orderZ.placeId, moment(orderX.collectingTime).toDate());
        const newAT = moment(orderZ.arrivingTime).add(-TT, 'seconds').toDate();
        
        if (moment(newAT).toDate() < moment(orderX.arrivingTime).toDate()) {
          if (moment(newAT).toDate() > moment(tempIRPDES[lastIndex - i - 1].realArrivingTime).toDate()) {
            tempIRPDES[lastIndex - i - 1].arrivingTime = moment(orderX.realArrivingTime).toDate();
          } else {
            tempIRPDES[lastIndex - i - 1].arrivingTime = moment(newAT).toDate();
          }
        }
        i += 1;
      }
    }
    
    this.tempIRPList = [
      ...orderORIAndDESDeliveredList,
      ...orderDESDeliveringList,
    ];

    await this.sortTempDESByPlaceTypeAndAT();
  }

  async updateNewATForBeforeCheckingAvailable() {
    let i = 0;
    const orderORIAndDESDeliveredList = [...this.tempIRPList.filter(order => order.type === 'ORI'
                        || order.status === 'DELIVERED')];

    const orderDESDeliveringList = [...this.tempIRPList.filter(order => order.type === 'DES'
                        && order.status === 'DELIVERING')];

    const tempIRPDES = _.orderBy([...orderDESDeliveringList], ['arrivingTime'], ['ASC']);

    while (i !== tempIRPDES.length - 1) {
      const lastIndex = tempIRPDES.length - 1;
      const orderX = { ...tempIRPDES[lastIndex - i - 1] };
      const orderZ = { ...tempIRPDES[lastIndex - i] };
      let departureTime = null;
      if(orderZ.collectingTime === null){
        departureTime = moment().toDate();
      }else{
        departureTime = moment(orderX.collectingTime).toDate();
      }
      const TT = await this.getSmartDuration(orderX.placeId, orderZ.placeId, departureTime);
      const newAT = moment(orderZ.arrivingTime).add(-TT, 'seconds').toDate();

      if (moment(newAT).toDate() < moment(orderX.arrivingTime).toDate()) {
        tempIRPDES[lastIndex - i - 1].arrivingTime = moment(newAT).toDate();
      }
      i += 1;

    }

    this.tempIRPList = [
      ...orderORIAndDESDeliveredList,
      ...orderDESDeliveringList,
    ];


    await this.sortTempDESByPlaceTypeAndAT();
  }

  async removeOrderFromCalculating(orderN) {
    this.tempOrderList = this.tempOrderList.filter(
      order => !((order.id === orderN.id) && (order.type === 'ORI')),
    );
  }

  async removeNOrderByTypeFromSpotList(orderNID, type) {
    this.spotList = this.spotList.filter(
      order => !((order.id === orderNID) && (order.type === type)),
    );
  }

  async removeNOrderByTypeFromTempOrderList(orderNID, type) {
    this.tempOrderList = this.tempOrderList.filter(
      order => !((order.id === orderNID) && (order.type === type)),
    );
  }
}

const getOrderDetails = async (orderID) => {

  const orderDetails = await Orders.findOne({
    where:{
      id: orderID
    }
  });

  return orderDetails;
};

const getCalculatingOrders = async () => {
  const calculatingOrders = await Orders.findAll({
    attributes: {
      include: [
        [
          sequelize.literal(
            '(SELECT COUNT(*) FROM plan_orders WHERE plan_orders.orderId = orders.id)',
          ),
          'planCount',
        ],
      ],
    },
    include: [
      {
        model: Places,
        as: 'originPlace',
        include: [{ model: PlaceTypes, as: 'type' }],
      },
      {
        model: Places,
        as: 'destinationPlace',
        include: [{ model: PlaceTypes, as: 'type' }],
      },
      {
        model: Plans,
        as: 'plan',
      },
    ],
    where: {
      status: {[Op.in]: [1]}, // [1, 2]
      originPlaceId: { [Op.ne]: null },
      destinationPlaceId: { [Op.ne]: null },

      dropTime: {
        [Op.gte]: moment()
          .startOf('day')
          .add(testDiffDay, 'days')
          .add(timeZoneDiff, 'hours')
          .add(6, 'hours')
          .toDate(),
      },
      // pickupTime: {
      //   [Op.gte]: moment().startOf("day").toDate()
      // }
    },
  });

  if (calculatingOrders.length === 0) throw new Error('Is empty orders');
  const result = calculatingOrders
    .map(order => order.toJSON())
    .filter(order => order.planCount === 0);
  return result;
};

const getALLOrdersAndTheirDetails = async () => {
  const calculatingOrders = await Orders.findAll({
    attributes: {
      include: [
        [
          sequelize.literal(
            '(SELECT COUNT(*) FROM plan_orders WHERE plan_orders.orderId = orders.id)',
          ),
          'planCount',
        ],
      ],
    },
    include: [
      {
        model: Places,
        as: 'originPlace',
        include: [{ model: PlaceTypes, as: 'type' }],
      },
      {
        model: Places,
        as: 'destinationPlace',
        include: [{ model: PlaceTypes, as: 'type' }],
      },
      {
        model: Plans,
        as: 'plan',
      },
    ],
    where: {
      originPlaceId: { [Op.ne]: null },
      destinationPlaceId: { [Op.ne]: null },

      dropTime: {
        [Op.gte]: moment()
          .startOf('day')
          .add(testDiffDay, 'days')
          .add(timeZoneDiff, 'hours')
          .add(6, 'hours')
          .toDate(),
      },
      // pickupTime: {
      //   [Op.gte]: moment().startOf("day").toDate()
      // }
    },
  });

  if (calculatingOrders.length === 0) throw new Error('Is empty orders');
  const result = calculatingOrders
    .map(order => order.toJSON())
    .filter(order => order.planCount === 0);
  return result;
};

const getDriverToPlan = async (driverId) => {
  const driver = await Drivers.findOne({
    where: { id: driverId },
    include: [{ model: Cars }],
  });
  if (!driver) throw new Error('Not found driver');
  if (!driver.car) throw new Error('Not found car');
  if (driver.status === 'offline') throw new Error('Driver is offline');
  return driver;
};

const findClosestOrder = async (origin, orders) => {
  const ordersWithDistance = await Promise.all(
    orders.map(async (order) => {
      const destination = {
        latitude: order.originPlace.latitude,
        longitude: order.originPlace.longitude,
      };
      const distance = await getDistanceMatrix({
        origin,
        destination,
        arrivalTime: order.dropTime,
      });
      order.distance = distance.data;
      return order;
    }),
  );
  const [closestOrder] = _.orderBy(
    ordersWithDistance,
    ['distance.duration.value'],
    ['ASC'],
  );
  return closestOrder;
};

module.exports = {
  IRP,
  getCalculatingOrders,
  getDriverToPlan,
  findClosestOrder
};
