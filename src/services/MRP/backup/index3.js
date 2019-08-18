const _ = require("lodash");
const moment = require("moment");
const sequelize = require("sequelize");
const {
  Orders,
  Drivers,
  Cars,
  Places,
  PlaceTypes,
  Plans,
  PlanOrders,
  PlanLocations
} = require("../../models");

const { getDistanceMatrix } = require("../../helpers/googleMap");

const { Op } = sequelize;

class IRP {
  constructor({ type, driver, driverLocation, capacity, emergency }) {
    this.type = type || null;

    this.orderN = null;
    this.orderNDES = null;

    this.plan = null;

    this.calculatingOrders = [];
    this.spotList = []; //copy all orders and refference those orders by type "ORI"/ "DES"
    this.tempOrderList = []; // sturcture is as same as SPOT List // A copy of SPOT List
    this.copyTempIRPList = [];

    this.IRPList = []; //list of N Order that is selected
    this.IRPLocationList = []; //list of locations order in IRP in sequence
    this.tempIRPList = [];

    this.driver = driver || null;
    this.driverLocation = driverLocation || null; // { latitude, longitude }

    this.currentCarCap = capacity || 0;

    this.emergency = emergency || false;

    this.collectingTime = null;
    this.arrivingTimeOfIRP = null;
    this.landingTime = null;

    this.error = null;

    this.startTime = moment("2019-04-05T09:30:00.000Z").toDate();
    
    this.running = 2;
    this.orderCheck = null;

    this.endIRPProcess = false;
  }
  async startProcess() {
    //console.log(this.startTime);
    this.calculatingOrders = await getCalculatingOrders();
    this.calculatingOrders = [...this.calculatingOrders.filter(order => order.originPlace.type.type !== "AIRPORT" )];
    console.log("Number of Calulating Orders:", this.calculatingOrders.length);
    this.spotList = this.calculatingOrders.map(order => {
      
      order.type = "ORI";
      order.placeId = order.originPlace.placeId;
      order.latitude = order.originPlace.latitude;
      order.longitude = order.originPlace.longitude;
      order.time = moment(order.dropTime).toDate();
      order.placeType = order.originPlace.type.type;
      order.collectingTime = null;
      order.transportationTime = null;
      order.status = "COLLECTING";
      order.placeName = order.originPlace.name;
      order.realArrivingTime = moment(order.arrivingTime).toDate()
      
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
    await this.calculateTranportationAllOrders(this.driverLocation.latitude, this.driverLocation.longitude, moment(this.startTIme).toDate());
    
    while (this.tempOrderList.length !== 0) {
      this.tempOrderList = _.orderBy(
        this.tempOrderList,
        ["transportationTime", "arrivingTime"],
        ["ASC", "ASC"]                                                            
      );
      
      this.orderN = {...this.tempOrderList[0]};
      await this.createNOrderDES();
      this.collectingTime = moment(this.startTime).add(this.orderN.transportationTime, "seconds").toDate(); 

      const orderADES = {...this.orderNDES};
      const LTOforderNToOrderADES = await getDuration({
        origin: {
          latitude: this.orderN.latitude,
          longitude: this.orderN.longitude
        },
        destination: {
          latitude: orderADES.latitude,
          longitude: orderADES.longitude
        },
        departureTime: moment(this.collectingTime).toDate()
      });

      if (this.orderN.numberOfLuggage > this.currentCarCap) {
        await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
        continue;
      }
      if (moment(this.collectingTime).toDate() < moment(this.orderN.time).add(-15, "minutes").toDate()) {
        this.orderN.collectingTime = null;
        this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
        continue;
      }

      await this.updateCollectingTime();

      if (moment(this.orderN.arrivingTime).toDate() < moment(this.collectingTime).add(LTOforderNToOrderADES, "seconds").toDate()) {
        this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
        continue;
      }

      console.log("RUN#1 Order id:", this.orderN);
      await this.takeNOrderToIRP();
      //this.currentCarCap = this.currentCarCap - this.orderN.numberOfLuggage;
      this.arrivingTimeOfIRP = moment(this.orderN.arrivingTime).toDate();
      
      if (this.currentCarCap > 0) {
        await this.processSecondRun();
        return;
      } else {
        if (this.orderNDES.placeType === "AIRPORT") {
          await this.endProcess();
          //have to check
          //driver location here
          //send them
          return;
        } else {
          this.driverLocation = {
            latitude: this.orderNDES.latitude,
            longitude: this.orderNDES.longitude,
          };
          await this.processSecondRun();
          return;
        }
      }
    }
    await this.endProcess();
    return;
  }
  
  async processSecondRun() {
    if(this.endIRPProcess === false){
      this.tempOrderList = [...this.spotList];
      this.tempIRPList = [...this.IRPList];
    }
    
    while (this.tempOrderList.length !== 0) {
      
      const orderZ = await this.findOrderZDES();
      const previousOrder = await this.findPreviousOrder();
      
      await this.calculateTranportationAllOrders(previousOrder.latitude, previousOrder.longitude, moment(previousOrder.collectingTime).toDate());
      this.tempOrderList = _.orderBy(
        this.tempOrderList,
        ["transportationTime", "arrivingTime"],
        ["ASC", "ASC"]                                                            
      );
      
      await this.orderNConsideration();
      await this.createNOrderDES();
      console.log("consider order id:", this.orderN.id, "PL:"+this.orderN.placeName, "TT:"+this.orderN.transportationTime);
      
      if(this.orderN.type === "ORI"){
        const dropTime = moment(this.orderN.time).toDate();
        this.arrinvigTime = moment(this.orderN.arrivingTime).toDate();
        console.log("duration line: 193");
        const TTPreviousOrderToOrderN = await getDuration({
          origin: {
            latitude: previousOrder.latitude,
            longitude: previousOrder.longitude
          },
          destination: {
            latitude: this.orderN.latitude,
            longitude: this.orderN.longitude
          },
          departureTime: moment(previousOrder.collectingTime).toDate()
        });

        this.collectingTime = moment(previousOrder.collectingTime).add(TTPreviousOrderToOrderN, "seconds").toDate();
        this.orderN.collectingTime = moment(this.collectingTime).toDate();
        if(this.orderN.numberOfLuggage <= this.currentCarCap){
          if(moment(this.collectingTime).toDate() > moment(dropTime).add(-15, "minutes").toDate()){
            await this.updateCollectingTime();
            await this.createNOrderDES();
            
            if(this.orderNDES.placeType === "AIRPORT"){
              if(orderZ !== null){  
                if(orderZ.placeType === "AIRPORT"){
                  if(orderZ.placeId === this.orderNDES.placeId){
                    if(moment(this.orderNDES.arrivingTime).toDate() >= moment(orderZ.arrivingTime).toDate()){
                      const orderADES = await this.findOrderADES();
                      const LTofOrderNToOrderADES = await getDuration({
                        origin: {
                          latitude: this.orderN.latitude,
                          longitude: this.orderN.longitude
                        },
                        destination: {
                          latitude: orderADES.latitude,
                          longitude: orderADES.longitude
                        },
                        departureTime: moment(this.collectingTime).toDate() 
                      });

                      if(moment(orderADES.arrivingTime).toDate() > moment(this.collectingTime).add(LTofOrderNToOrderADES, "seconds").toDate()){
                        //this.updateCollectingTime();
                        await this.takeNOrderToIRP();
                        await this.sortTempDESByPlaceTypeAndAT();
                        await this.sortDESByPlaceTypeAndAT();
                        // /////////////////////////////////////////////////////////////////
                        console.log("---------------------------------------------------");
                        console.log("ORI SAME AIRPORT DES, oderN AT is more than order Z");
                        console.log("choose order #1:", this.orderN.id);
                        console.log("---------------------------------------------------");
                        // /////////////////////////////////////////////////////////////////
                        await this.processSecondRun();
                        return;
                      }else{
                        // /////////////////////////////////////////////////////////////////
                        console.log("---------------------------------------------------");
                        console.log("Cannot go to orderA DES ontime #1");
                        console.log("choose order #1:", this.orderN.id);
                        console.log("---------------------------------------------------");
                        // /////////////////////////////////////////////////////////////////
                        await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
                        continue;
                      }
                    }else{
                      //checking
                      this.updateTempIRPListAT();
                      this.sortTempDESByPlaceTypeAndAT();
                      await this.updateNewATForBeforeCheckingAvailable();
                      const result = await this.checkOrderNIsAvailable();
                      if(result === true ){
                        this.updateCollectingTime();
                        await this.takeNOrderToIRP();
                        this.sortDESByPlaceTypeAndAT();
                        // /////////////////////////////////////////
                        console.log("--------------------------------");
                        console.log("choose order #2:", this.orderN.id);
                        console.log("--------------------------------");
                        // /////////////////////////////////////////
                        await this.processSecondRun();
                        return;
                      }else{
                        // this.tempIRPList = [...this.copyTempIRPList ];
                        // this.IRPList = [...this.tempIRPList];
                        
                        console.log("After update All AT is not Available#2");
                        this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
                        this.tempIRPList = [...this.tempIRPList.filter(order => {
                          if(order.id === this.orderNDES.id && order.type === "DES"){
                            return false;
                          }else{
                            return true;
                          }
                        })];
                        
                        continue;
                      }
                    }
                  }else{
                    console.log("Not same airport");
                    this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
                    continue;
                  }
                }else{
                  this.updateTempIRPListAT();
                  this.sortTempDESByPlaceTypeAndAT();
                  await this.updateNewATForBeforeCheckingAvailable();

                  const result = await this.checkOrderNIsAvailable();
                  if(result === true ){
                    console.log("--------------------------------");
                    console.log("choose order #3:", this.orderN.id);
                    console.log("--------------------------------");
                    this.updateCollectingTime();
                    await this.takeNOrderToIRP();
                    this.sortDESByPlaceTypeAndAT();
                    await this.processSecondRun();
                    return;
                  }else{
                    console.log("After update All AT is not Available #3")
                    this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
                    continue;
                  }
                }
                
              }else{
                return;
              }
            }else{
              const orderADES = await this.findOrderADES();
              if(moment(this.orderNDES.arrivingTime).toDate() < moment(orderADES.arrivingTime).toDate()){
                const TTOrderNToOrderADES = await getDuration({
                                                      origin: {
                                                        latitude: this.orderN.latitude,
                                                        longitude: this.orderN.longitude
                                                      },
                                                      destination: {
                                                        latitude: orderADES.latitude,
                                                        longitude: orderADES.longitude
                                                      },
                                                      departureTime: moment(this.collectingTime).toDate()
                                                    });
                let diffOfAT = moment(orderADES.arrivingTime).diff(this.orderN.arrivingTime, "seconds");
                if(TTOrderNToOrderADES >= diffOfAT){
                  this.orderNDES.arrivingTime = moment(this.orderNDES.arrivingTime).add(diffOfAT, "seconds").toDate();
                }
                const LTOrderNToOrderADES = await getDuration({
                  origin: {
                    latitude: this.orderN.latitude,
                    longitude: this.orderN.longitude
                  },
                  destination: {
                    latitude: orderADES.latitude,
                    longitude: orderADES.longitude
                  },
                  departureTime: moment(this.collectingTime).toDate()
                });
                if(moment(this.collectingTime).add( LTOrderNToOrderADES, "seconds").toDate() >= moment(this.orderNDES.arrivingTime).toDate()){
                
                  this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
                  continue;
                }

                this.tempIRPList.push(this.orderNDES);
                this.sortTempDESByPlaceTypeAndAT();
                this.updateCollectingTime();
                await this.takeNOrderToIRP();
                this.sortDESByPlaceTypeAndAT();
                // /////////////////////////////////////////
                console.log("--------------------------------");
                console.log("choose order #4:", this.orderN.id);
                console.log("--------------------------------");
                // console.log("IRP Location:", this.IRPLocationList);
                // return;
                // /////////////////////////////////////////
                await this.processSecondRun();
                return;
              }else{
                this.tempIRPList.push(this.orderNDES);
                this.sortTempDESByPlaceTypeAndAT();
                await this.updateNewATForBeforeCheckingAvailable();

                const result = await this.checkOrderNIsAvailable();
                if(result === true ){
                  this.updateCollectingTime();
                  await this.takeNOrderToIRP();
                  this.sortDESByPlaceTypeAndAT();
                  // /////////////////////////////////////////
                  console.log("--------------------------------");
                  console.log("choose order #5:", this.orderN.id);
                  console.log("--------------------------------");
                  // /////////////////////////////////////////
                  await this.processSecondRun();
                  return;
                }else{
                  console.log("After update All AT is not Available #5")
                  this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
                  continue;
                }
              }
            }
          }else{
            console.log("Customer is not drop LG yet")
            this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
            continue;
          }
        }else{
          console.log("LG is not Available")
          this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
          continue;
        }
      } else {
        console.log("drop off case#2");
        const previousOrder = await this.findPreviousOrder();

        const TTPrevoiusOrderToOrderN = await getDuration({
          origin: {
            latitude: previousOrder.latitude,
            longitude: previousOrder.longitude
          },
          destination: {
            latitude: this.orderN.latitude,
            longitude: this.orderN.longitude
          },
          departureTime: moment(previousOrder.collectingTime).toDate()
        });
        
        this.collectingTime = moment(previousOrder.collectingTime).add(TTPrevoiusOrderToOrderN, "seconds").toDate();

        this.sortTempDESByPlaceTypeAndAT();
        const orderADES = await this.findOrderADES();
        await this.updateTempIRPOrderDESStatus(this.orderN.id, "DELIVERED");

        await this.updateNewATForBeforeCheckingAvailableDropoff();

        const tempOrderADES = {...this.tempIRPList.find(order => order.id === orderADES.id && order.type === "DES")};
        
        const result = await this.checkOrderNDESIsAvailableDropoff(tempOrderADES);

        if (result === false) {
          console.log(
            "orderN:", this.orderN.id
          );
          console.log("update new AT then check it's not available");
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
                await this.endProcess();
                return;
              }else{
                this.endIRPProcess = true;
                await this.processSecondRun();
              }
          }else{
            await this.processSecondRun();
          }
          return;
        }
      }
      this.endProcess();
      return;
    }
    // End IRP
    this.endProcess();
    return; 
  }

  async endIRPProcess(){
    
  }

  findOrderDetailsById(originalID, destination){
    return {...destination.find(order => order.id === originalID && order.type === "DES")};
  }

  async endProcess() {
    // this.printDetails(this.IRPList, "IRP List");
    // this.printDetails(this.IRPLocationList, "IRP Location List");
    
    console.log("IRP Location:", this.IRPLocationList);

    this.plan = await Plans.create({
      driverId: this.driver.id,
      updatedBy: 1, //manager id
      createdBy: 1  //manager id
    });

    const tempIRPLocationList = [...this.IRPLocationList];
    const tempIRPLocationORI = [...tempIRPLocationList.filter(order => order.type === "ORI" && order.status === "COLLECTED")];
    const tempIRPLocationDES = [...tempIRPLocationList.filter(order => order.type === "DES" && order.status === "DELIVERED")];
    //const tempIRPLocationDES = [...tempIRPLocationList.filter(order => order.type === "DES" && order.status === "DELIVERED")];

    let createOrders = [];
    tempIRPLocationORI.forEach(order => {
      const tempDESDetails = this.findOrderDetailsById(order.id, tempIRPLocationDES);

      let orderORI = {
        planId: this.plan.id,
        orderId: order.id,
        collectingTime: moment(order.collectingTime).toDate(),
        arrivingTime: moment(order.arrivingTime).toDate(),
        type: "ORI",
        placeId: order.placeId,
        isOnPlaned: true,
        isOriginal: true
      };

      let orderDES = {
        planId: this.plan.id,
        orderId: order.id,
        collectingTime: moment(tempDESDetails.collectingTime).toDate(),
        arrivingTime: moment(order.arrivingTime).toDate(),
        type: "DES",
        placeId: tempDESDetails.placeId,
        isOnPlaned: true,
        isOriginal: true
      };
      //console.log(orderORI, orderDES)
      createOrders.push(orderORI);
      createOrders.push(orderDES);

    });

    PlanLocations.bulkCreate(createOrders);
    //PlanOrders.bulkCreate(data);

    const ordersId = this.IRPLocationList.map(order => order.id)
    await Orders.update(
      { status: 2, }, // PLANED
      {
        where: {
          id: { [Op.in]: ordersId }
        }
      }
    );
    return;
  }

  
  async calculateTranportationAllOrders(oriLat, oriLng, previousOrderLocationCL){
    this.tempOrderList = await Promise.all(
      this.tempOrderList.map(async order => {
        order.transportationTime = await getDuration({
          origin: {
            latitude: oriLat,
            longitude: oriLng
          },
          destination: {
            latitude: order.latitude,
            longitude: order.longitude
          },
          departureTime: moment(previousOrderLocationCL).toDate()
        });
        return order;
      })
    );
  }

  async deliveredOrderN() {
    this.IRPList = this.IRPList.map(order => {
      if (order.id === this.orderN.id) order.status = "DERIVERED";
      return order;
    })
    this.IRPLocationList.push(this.orderN);
  }

  async checkAllOrdersWereDropped(){
    const tempIRPDESList = [...this.tempIRPList.filter(order => order.type === "DES" && order.status === "DELIVERING")];
    if(tempIRPDESList.length > 0){
      return this.dropOffStatus = false;
    }else{
      return this.dropOffStatus = true;
    }
  }

  async createNOrderDES(){
    const orderNDetails = {...this.calculatingOrders.find(order => order.id === this.orderN.id)};
    const tempOrderN = {...this.orderN};
    if (!orderNDetails.destinationPlace) {
      console.log("ERROR");
      console.log("order n", this.orderN)
      console.log("orderNDetails", orderNDetails);
    }
    this.orderNDES = {
      id: tempOrderN.id,
      type: "DES",
      arrivingTime: moment(tempOrderN.arrivingTime).toDate(),
      realArrivingTime: moment(tempOrderN.arrivingTime).toDate(),
      code: tempOrderN.code,
      numberOfLuggage: tempOrderN.numberOfLuggage,
      placeId: orderNDetails.destinationPlace.placeId,
      time: moment(orderNDetails.pickupTime).toDate(),
      latitude: orderNDetails.destinationPlace.latitude,
      longitude: orderNDetails.destinationPlace.longitude,
      collectingTime: null,
      transportationTime: null,
      placeType: orderNDetails.destinationPlace.type.type,
      status: "DELIVERING",
      placeName: orderNDetails.destinationPlace.name,
    };
  }

  async takeNOrderToIRP() {
    this.currentCarCap = this.currentCarCap - this.orderN.numberOfLuggage;
    await this.removeNOrderByTypeFromSpotList(this.orderN.id, "ORI");
    this.spotList.push(this.orderNDES);
    this.orderN.status = "COLLECTED";
    this.IRPList.push(this.orderN);
    this.IRPLocationList.push(this.orderN);
    
    const orderNDESIsExistIRP = [...this.IRPList.filter(order => 
      order.id === this.orderNDES.id && 
      order.type === "DES")];
    
    const orderNDESIsExistTempIRP = [...this.tempIRPList.filter(order => 
      order.id === this.orderNDES.id && 
      order.type === "DES")];

    if(orderNDESIsExistIRP.length === 0){
      this.IRPList.push(this.orderNDES);
    }

    if(orderNDESIsExistTempIRP.length === 0){
      this.tempIRPList.push(this.orderNDES);
    }
    
    //return planOrder;
  }

  async printDetails(myArray, arrayName){
    const count = myArray.length;
    console.log("-------"+arrayName+"-------");
    if(count > 0){
      if(count === 1){
        console.log("There is "+count+" item");
      }else{
        console.log("There are "+count+" items");
      }
    }else{
      console.log("There is not any items");
    }
    
    for(let i = 0; i < count ; i++){
      if(myArray.type === "ORI"){
        console.log((i+1) + ". id: " + myArray[i].id+"["+myArray[i].type+"]["+myArray[i].status+"]");
      }else{
        console.log((i+1) + ". id: " + myArray[i].id+"["+myArray[i].type+"]["+myArray[i].status+"]");
      }
      
    }
  }

  async orderNConsideration() {
    this.orderN = {...this.tempOrderList[0]}; 
    const sameTransportationList = [...this.tempOrderList.filter(order => order.transportationTime === this.orderN.transportationTime)];
    const sameTransportationListDES = [...sameTransportationList.filter(order => order.type === "DES")]; //order des no have status yet
    if(sameTransportationListDES.length > 0){
      this.orderN = {...sameTransportationListDES[0]};
      console.log("drop off case#1");
    }else{
      const sameTransportationListORI = [...sameTransportationList.filter(order => order.type === "ORI")];
      const IRPDESList = [...this.IRPList.filter(order => order.type === "DES" && order.status === "DELIVERING")];
      
      let flag = true;
      console.log("pick up case");
      if(sameTransportationListORI.length > 0){
        for(let i = 0; i < sameTransportationListORI.length && flag === true; i++){
          this.orderN = {...sameTransportationListORI[i]};
          this.createNOrderDES();  //changed
          let sameIRPDES = [...IRPDESList.filter(order => order.placeId === this.orderNDES.placeId)];
          if(sameIRPDES.length > 0){
            flag = false;
          }
        }
      }else{
        this.orderN = {...sameTransportationList[0]};
      }
    }
  }

  async updateCollectingTime(){
    const dropTime = moment(this.orderN.time).toDate();
    if (moment(this.collectingTime).toDate() > moment(dropTime).toDate()) {
    } else {
      this.collectingTime = moment(dropTime).toDate();
    }
    this.orderN.collectingTime = moment(this.collectingTime).toDate();
  }

  async findTempOrderADES(){
    const tempOrderDES = [...this.IRPList.filter(order => order.type === "DES" && order.status === "DELIVERING")];
    if(tempOrderDES.length > 0){
      return {...tempOrderDES[0]};
    }else{
      return null;
    }
  }

  async findPreviousOrderDES() {
    const previousOrder = await this.findPreviousOrder();
    const previousOrderDES = {...this.IRPList.find(order => order.id === previousOrder.id && 
                                                            order.type === "DES")};
    return previousOrderDES;
  }

  async findOrderADES() {
    await this.sortTempDESByPlaceTypeAndAT();
    const tempIRPList = [...this.tempIRPList];
    const tempIRPDESDeliveringList = [...tempIRPList.filter(order => order.type === "DES"  && 
                                                                     order.status === "DELIVERING")];
    const orderADES = {...tempIRPDESDeliveringList[0]};
    if(tempIRPDESDeliveringList.length > 0){
      return orderADES;
    }else{
      return null;
    }
  }

  async findOrderZDES() {
    await this.sortTempDESByPlaceTypeAndAT();
    const tempIRPList = [...this.tempIRPList];
    const tempIRPDESDeliveringList = [...tempIRPList.filter(order => order.type === "DES"  && order.status === "DELIVERING")];
    const orderZDES = {...tempIRPDESDeliveringList[tempIRPDESDeliveringList.length - 1]};
    if(tempIRPDESDeliveringList.length > 0){
      return orderZDES;
    }else{
      return null;
    }
  }

  async findPreviousOrder(){
    const orderIRPLocationList = [...this.IRPLocationList];
    return orderIRPLocationList[orderIRPLocationList.length - 1];
  }

  async filterOrderByStatus(orders, type, status) {
    return orders.filter(order => order.type === type && order.status === status)
  }

  async updateTempIRPListAT(){
    const orderZ = {...this.findOrderZDES()};
    this.tempIRPList.push(this.orderNDES);

    if(orderZ.placeType === "AIRPORT"){
      let allOrderDESSameAirport = [
        ...this.tempIRPList.filter(
          order =>
            order.type === "DES" &&
            order.placeType === "AIRPORT" &&
            order.status === "DELIVERING" &&
            order.placeId === this.orderNDES.placeId
        )
      ];
      allOrderDESSameAirport = _.orderBy(["arrivingTime"], ["ASC"]);
      const indexOfOrderNDES = allOrderDESSameAirport.findIndex(order => order.id === this.orderNDES.id);
      this.tempIRPList = this.tempIRPList.map((order, index) => {
        if (index >= indexOfOrderNDES) {
          if (this.orderNDES.placeId === order.placeId){
            order.arrivingTime = moment(this.orderNDES.arrivingTime).toDate();
          }
        }
        return order;
      });
    }else{
      //this.tempIRPList.push(this.orderNDES); //edit
    }
  }

  async sortDESByPlaceTypeAndAT() {
    const IRPORI = [...this.IRPList.filter(order => order.type === "ORI" || order.status === "DELIVERED")];
    const IRPDES = [...this.IRPList.filter(order => order.type === "DES" && order.status === "DELIVERING")]; //delivering
    let tempIRPDES = [...IRPDES]; 
    tempIRPDES = _.orderBy(tempIRPDES, ["arrivingTime"], ["ASC"]);
    const tempIRPList = [
      ...IRPORI,
      ...tempIRPDES.filter(order => order.placeType !== "AIRPORT"),
      ...tempIRPDES.filter(order => order.placeType === "AIRPORT")
    ];
    this.IRPList = [...tempIRPList];
  }

  async sortTempDESByPlaceTypeAndAT() {
    const IRPORI = [...this.tempIRPList.filter(order => order.type === "ORI" || order.status === "DELIVERED")];
    const IRPDES = [...this.tempIRPList.filter(order => order.type === "DES" && order.status === "DELIVERING")];
    let tempIRPDES = [...IRPDES]; 
    tempIRPDES = _.orderBy(tempIRPDES, ["arrivingTime"], ["ASC"]);
    this.tempIRPList = [
      ...IRPORI,
      ...tempIRPDES.filter(order => order.placeType !== "AIRPORT"),
      ...tempIRPDES.filter(order => order.placeType === "AIRPORT")
    ];
  }
    
  async checkOrderNIsAvailable(){
    const tempOrderADES = await this.findTempOrderADES();
    const LTofOrderNToTempOrderADES = await getDuration({
      origin: {
        latitude: this.orderN.latitude,
        longitude: this.orderN.longitude
      },
      destination: {
        latitude: tempOrderADES.latitude,
        longitude: tempOrderADES.longitude,
      },
      departureTime: moment(this.orderN.collectingTime).toDate()
    });

    if (moment(tempOrderADES.arrivingTime).toDate() > moment(this.orderN.collectingTime).add(LTofOrderNToTempOrderADES, "seconds").toDate()) {
      this.arrivingTimeOfIRP = moment(tempOrderADES.arrivingTime).toDate();
      this.IRPList = [...this.tempIRPList];
      return true;
    } else {
      return false;
    }
  }

  async checkOrderNDESIsAvailable(){
    const orderADES = await this.findOrderADES();
    //console.log(orderADES);
    const LTofOrderNToOrderADES = await getDuration({
      origin: {
        latitude: this.orderN.latitude,
        longitude: this.orderN.longitude
      },
      destination: {
        latitude: orderADES.latitude,
        longitude: orderADES.longitude,
      },
      arrivalTime: moment(orderADES.arrivingTime).toDate()
    });

    if (moment(orderADES.arrivingTime).toDate() >= moment(this.collectingTime).add(LTofOrderNToOrderADES, "seconds").toDate()) {
      return true;
    } else {
      return false;
    }
  }

  async checkOrderNDESIsAvailableDropoff(orderADES){
    const LTofOrderNToOrderADES = await getDuration({
      origin: {
        latitude: this.orderN.latitude,
        longitude: this.orderN.longitude
      },
      destination: {
        latitude: orderADES.latitude,
        longitude: orderADES.longitude,
      },
      arrivalTime: moment(orderADES.arrivingTime).toDate()
    });
    console.log("A AT:", orderADES);
    console.log("N CL + TT", moment(this.collectingTime).add(LTofOrderNToOrderADES, "seconds").toDate(), this.collectingTime, LTofOrderNToOrderADES);
    if (moment(orderADES.arrivingTime).add(0, "minutes").toDate() >= moment(this.collectingTime).add(LTofOrderNToOrderADES, "seconds").toDate()) {
      console.log("on time");
      return true;
    } else {
      console.log("not on time");
      return false;
    }
  }

  async updateTempIRPOrderDESStatus(orderNID, status){
    for(let i = 0; i < this.tempIRPList.length - 1; i++){
      if(this.tempIRPList[i].id === orderNID && this.tempIRPList[i].type === "DES"){
        this.tempIRPList[i].status = status;
      }
    }
  }

  async updateIRPOrderDESStatus(orderNID, status){
    for(let i = 0; i < this.IRPList.length - 1; i++){
      if(this.IRPList[i].id === orderNID && this.IRPList[i].type === "DES"){
        this.IRPList[i].status = status;
      }
    }
  }

  async updateNewATForBeforeCheckingAvailableDropoff() {
    let i = 0;
    const orderORIAndDESDeliveredList = [...this.tempIRPList.filter(order => 
                        order.type === "ORI" || 
                        order.status === "DELIVERED")];
                        
    const orderDESDeliveringList = [...this.tempIRPList.filter(order => 
                        order.type === "DES" && 
                        order.status === "DELIVERING")];

    let tempIRPDES = _.orderBy([...orderDESDeliveringList], ["arrivingTime"], ["ASC"]);
    
    while (i !== tempIRPDES.length - 1) {
      const lastIndex = tempIRPDES.length - 1;
      const orderX = {...tempIRPDES[lastIndex - i - 1]};
      const orderZ = {...tempIRPDES[lastIndex - i]};

      const TT = await getDuration({
        origin: {
          latitude: orderX.latitude,
          longitude: orderX.longitude,
        },
        destination: {
          latitude: orderZ.latitude,
          longitude: orderZ.longitude,
        },
        arrivalTime: moment(orderZ.arrivingTime).toDate()
      });
      const newAT = moment(orderZ.arrivingTime).add(-TT, "seconds").toDate();

      if (moment(newAT).toDate() < moment(orderX.arrivingTime).toDate()) {
        if( moment(newAT).toDate() > moment(tempIRPDES[lastIndex - i - 1].realArrivingTime).toDate() ){
          tempIRPDES[lastIndex - i - 1].arrivingTime = moment(orderX.realArrivingTime).toDate();
        }else{
          tempIRPDES[lastIndex - i - 1].arrivingTime = moment(newAT).toDate();
        }
      }
      i++;
    }
    
    this.tempIRPList = [
      ...orderORIAndDESDeliveredList,
      ...orderDESDeliveringList
    ];

    await this.sortTempDESByPlaceTypeAndAT();
  }

  async updateNewATForBeforeCheckingAvailable() {
    let i = 0;
    const orderORIAndDESDeliveredList = [...this.tempIRPList.filter(order => 
                        order.type === "ORI" || 
                        order.status === "DELIVERED")];
                        
    const orderDESDeliveringList = [...this.tempIRPList.filter(order => 
                        order.type === "DES" && 
                        order.status === "DELIVERING")];

    let tempIRPDES = _.orderBy([...orderDESDeliveringList], ["arrivingTime"], ["ASC"]);
    
    while (i !== tempIRPDES.length - 1) {
      const lastIndex = tempIRPDES.length - 1;
      const orderX = {...tempIRPDES[lastIndex - i - 1]};
      const orderZ = {...tempIRPDES[lastIndex - i]};

      const TT = await getDuration({
        origin: {
          latitude: orderX.latitude,
          longitude: orderX.longitude,
        },
        destination: {
          latitude: orderZ.latitude,
          longitude: orderZ.longitude,
        },
        arrivalTime: moment(orderZ.arrivingTime).toDate()
      });
      const newAT = moment(orderZ.arrivingTime).add(-TT, "seconds").toDate();

      if (moment(newAT).toDate() < moment(orderX.arrivingTime).toDate()) {
        tempIRPDES[lastIndex - i - 1].arrivingTime = moment(newAT).toDate();
      }
      i++;
    }
    
    this.tempIRPList = [
      ...orderORIAndDESDeliveredList,
      ...orderDESDeliveringList
    ];

    await this.sortTempDESByPlaceTypeAndAT();
  }

  async removeOrderFromCalculating(orderN) {
    this.tempOrderList = this.tempOrderList.filter(
      order => !((order.id === orderN.id) && (order.type === "ORI"))
    );
  }

  async removeNOrderByTypeFromSpotList(orderNID, type) {
    this.spotList = this.spotList.filter(
      order => !((order.id === orderNID) && (order.type === type))
    );
  }

  async removeNOrderByTypeFromTempOrderList(orderNID, type) {
    this.tempOrderList = this.tempOrderList.filter(
      order => !((order.id === orderNID) && (order.type === type))
    );
  }
}

const getCalculatingOrders = async () => {
  const calculatingOrders = await Orders.findAll({
    attributes: {
      include: [
        [
          sequelize.literal(
            "(SELECT COUNT(*) FROM plan_orders WHERE plan_orders.orderId = orders.id)"
          ),
          "planCount"
        ]
      ]
    },
    include: [
      {
        model: Places,
        as: "originPlace",
        include: [{ model: PlaceTypes, as: "type" }]
      },
      {
        model: Places,
        as: "destinationPlace",
        include: [{ model: PlaceTypes, as: "type" }]
      },
      {
        model: Plans,
        as: "plan"
      }
    ],
    where: {
      status: 1, 
      originPlaceId: { [Op.ne]: null },
      destinationPlaceId: { [Op.ne]: null },
      
    }
  });

  /*dropTime: {
    [Op.gte]: moment().startOf("day")
  },
  pickupTime: {
    [Op.lte]: moment().endOf("day")
  } */

  if (calculatingOrders.length === 0) throw new Error("Is empty orders");
  const result = calculatingOrders
    .map(order => order.toJSON())
    .filter(order => order.planCount === 0);
  return result;
};

const getDriverToPlan = async driverId => {
  const driver = await Drivers.findOne({
    where: { id: driverId },
    include: [{ model: Cars }]
  });
  if (!driver) throw new Error("Not found driver");
  if (!driver.car) throw new Error("Not found car");
  if (driver.status === "offline") throw new Error("Driver is offline");
  return driver;
};

const findClosestOrder = async (origin, orders) => {
  const ordersWithDistance = await Promise.all(
    orders.map(async order => {
      const destination = {
        latitude: order.originPlace.latitude,
        longitude: order.originPlace.longitude
      };
      const distance = await getDistanceMatrix({
        origin,
        destination,
        arrivalTime: order.dropTime
      });
      order.distance = distance.data;
      return order;
    })
  );
  const [closestOrder] = _.orderBy(
    ordersWithDistance,
    ["distance.duration.value"],
    ["ASC"]
  );
  return closestOrder;
};

const getDuration = async ({
  origin,
  destination,
  arrivalTime,
  departureTime
}) => {
  let duration = 0;

  if(origin.latitude !== destination.latitude || origin.longitude !== destination.longitude){
    const distance = await getDistanceMatrix({
      origin,
      destination,
      arrivalTime,
      departureTime
    });
    
    duration = distance.data.duration.value; 
    //console.log(distance.data.duration_in_traffic);

    if(distance.data.duration_in_traffic != null){
      duration += distance.data.duration_in_traffic.value;
    }
  }

  return duration;
};

module.exports = {
  IRP,
  getCalculatingOrders,
  getDriverToPlan,
  findClosestOrder
};
