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
  PlanOrders
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

    this.startTime = "2019-04-04T02:30:00.000Z";
    this.running = 2;

  }
  async startProcess() {
    this.calculatingOrders = await getCalculatingOrders();
    this.spotList = this.calculatingOrders.map(order => {
      
      order.type = "ORI";
      order.placeId = order.originPlace.placeId;
      order.latitude = order.originPlace.latitude;
      order.longitude = order.originPlace.longitude;
      order.time = order.dropTime;
      order.placeType = order.originPlace.type.type;
      order.collectingTime = null;
      order.transportationTime = null;
      order.status = "COLLECTING";
      order.placeName = order.originPlace.name;
      order.realArrivingTime = order.arrivingTime
      
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
    await this.calculateTranportationAllOrders(this.driverLocation.latitude, this.driverLocation.longitude, moment(this.startTIme));
    
    while (this.tempOrderList.length !== 0) {
      this.tempOrderList = _.orderBy(
        this.tempOrderList,
        ["transportationTime", "arrivingTime"],
        ["ASC", "ASC"]                                                            
      );
      this.orderN = {...this.tempOrderList[0]};
      this.createNOrderDES();
      this.collectingTime = moment(this.startTime).add(this.orderN.transportationTime, "seconds"); 
      this.landingTime = await getDuration({
        origin: {
          latitude: this.orderN.latitude,
          longitude: this.orderN.longitude
        },
        destination: {
          latitude: this.orderNDES.latitude,
          longitude: this.orderNDES.longitude
        },
        departureTime: this.collectingTime
      });
      if (this.orderN.numberOfLuggage > this.currentCarCap) {
        await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
        continue;
      }
      if (this.collectingTime < moment(this.orderN.time).add(-15, "minutes")) {
        this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
        continue;
      }
      if (moment(this.orderN.arrivingTime) < moment(this.orderN.time).add(this.orderN.transportationTime + this.landingTime, "seconds")) {
        this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
        continue;
      }
      this.plan = await Plans.create({
        driverId: this.driver.id,
        updatedBy: 1, //manager id
        createdBy: 1  //manager id
      });
      console.log("Order N:", this.orderN);
      await this.updateCollectingTime();
      await this.takeNOrderToIRP();
      console.log("----------- #RUN1 ------------");
      console.log("Order N ID: ", this.orderN.id);
      this.currentCarCap = this.currentCarCap - this.orderN.numberOfLuggage;
      this.arrivingTimeOfIRP = this.orderN.arrivingTime;

      if (this.orderNDES.placeType === "AIRPORT") {
        //this.destinationListOfIRP.push(this.orderNDES);
      }
      if (this.currentCarCap > 0) {
        await this.processSecondRun();
        return;
      } else {
        if (this.orderNDES.placeType === "AIRPORT") {
          await this.endProcess();
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
    
    console.log("RUN#2 start process...");
    
    
    // await this.printDetails(this.spotList, "SPOT LIST");
    // await this.printDetails(this.tempOrderList, "Temp Order List");
    // await this.printDetails(this.IRPList, "IRP List");
    // await this.printDetails(this.IRPLocationList, "IRPLocationList");
    
    this.tempOrderList = [...this.spotList];
    this.tempIRPList = [...this.IRPList];
    //console.log("TEMP ORDER LIST", this.tempOrderList.length)
    while (this.tempOrderList.length !== 0) {
      const orderN11 = {...this.IRPList.find(order => order.id === 11 && order.type === "ORI")};
      //console.log("order N ID[11]: ", orderN11.arrivingTime);

      const orderZ = await this.findOrderZDES();
      const previousOrder = await this.findPreviousOrder();
      await this.calculateTranportationAllOrders(previousOrder.latitude, previousOrder.longitude, moment(previousOrder.collectingTime));
      this.tempOrderList = _.orderBy(
        this.tempOrderList,
        ["transportationTime", "arrivingTime"],
        ["ASC", "ASC"]                                                            
      );
      
      await this.orderNConsideration();
      console.log("Condiser Order N id "+this.orderN.id+" ["+this.orderN.type+"]")

      if(this.orderN.type === "ORI"){
        const dropTime = moment(this.orderN.time);
        this.arrivingTime = moment(this.orderN.arrivingTime);
        const TTPreviousOrderToOrderN = await getDuration({
          origin: {
            latitude: previousOrder.latitude,
            longitude: previousOrder.longitude
          },
          destination: {
            latitude: this.orderN.latitude,
            longitude: this.orderN.longitude
          },
          departureTime: previousOrder.collectingTime 
        });

        this.collectingTime = moment(previousOrder.collectingTime).add(TTPreviousOrderToOrderN, "seconds");
        this.orderN.collectingTime = this.collectingTime;

        if(this.orderN.numberOfLuggage <= this.currentCarCap){
          if(this.collectingTime > moment(dropTime).add(-15, "minutes")){
            this.createNOrderDES();

            if(this.orderNDES.placeType === "AIRPORT"){
              if(orderZ !== null){
                if(orderZ.placeType === "AIRPORT"){
                  if(orderZ.placeId === this.orderNDES.placeId){
                    if(this.orderN.arrivingTime >= orderZ.arrivingTime){
                      const orderADES = await this.findOrderADES(); //orderADES is always not null
                      const LTofOrderNToOrderADES = await getDuration({
                        origin: {
                          latitude: this.orderN.latitude,
                          longitude: this.orderN.longitude
                        },
                        destination: {
                          latitude: orderADES.latitude,
                          longitude: orderADES.longitude
                        },
                        departureTime: this.collectingTime  //drop off time
                      });
                      if(orderADES.arrivingTime > moment(this.collectingTime).add(LTofOrderNToOrderADES, "seconds")){
                        this.updateCollectingTime();
                        await this.takeNOrderToIRP();
                        this.sortDESByPlaceTypeAndAT();
                        await this.processSecondRun();
                        return;
                      }else{
                        this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
                        continue;
                      }
                    }else{
                      this.updateTempIRPListAT(orderZ);
                      this.sortTempDESByPlaceTypeAndAT();
                      await this.updateNewATForBeforeCheckingAvailable();

                      const result = await this.checkOrderNIsAvailable();
                      if(result === true ){
                        this.updateCollectingTime();
                        await this.takeNOrderToIRP();
                        this.sortDESByPlaceTypeAndAT();
                        await this.processSecondRun();
                        return;
                      }else{
                        this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
                        continue;
                      }
                    }
                  }else{
                    this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
                    continue;
                  }
                }else{
                  this.updateTempIRPListAT(orderZ);
                  this.sortTempDESByPlaceTypeAndAT();
                  await this.updateNewATForBeforeCheckingAvailable();

                  const result = await this.checkOrderNIsAvailable();
                  if(result === true ){
                    this.updateCollectingTime();
                    await this.takeNOrderToIRP();
                    this.sortDESByPlaceTypeAndAT();
                    await this.processSecondRun();
                    return;
                  }else{
                    this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
                    continue;
                  }
                }
                
              }else{
                console.log("There is not any order in IRP LIST (DES)");
                console.log("go on / finish job!!!!");
                //todo
                return;
              }
            }else{
              const orderADES = await this.findOrderADES();
              if(this.orderNDES.arrivingTime < orderADES.arrivingTime){
                const TTOrderNToOrderADES = await getDuration({
                                                      origin: {
                                                        latitude: this.orderN.latitude,
                                                        longitude: this.orderN.longitude
                                                      },
                                                      destination: {
                                                        latitude: orderADES.latitude,
                                                        longitude: orderADES.longitude
                                                      },
                                                      departureTime: this.collectingTime
                                                    });
                let diffOfAT = moment(orderADES.arrivingTime).diff(this.orderN.arrivingTime, "seconds");
                if(TTOrderNToOrderADES >= diffOfAT){
                  this.orderNDes.arrivingTime = moment(this.orderNDES.arrivingTime).add(diffOfAT, "seconds");
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
                  arrivalTime: this.collectingTime 
                });
                if(moment(this.collectingTime).add( LTOrderNToOrderADES, "seconds") >= this.orderNDes.arrivingTime){
                  this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
                  continue;
                }

                this.tempIRPList.push(this.orderNDES);
                this.sortTempDESByPlaceTypeAndAT();
                this.updateCollectingTime();
                await this.takeNOrderToIRP();
                this.sortDESByPlaceTypeAndAT();
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
                  await this.processSecondRun();
                  return;
                }else{
                  this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
                  continue;
                }
              }
            }
          }else{
            this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
            continue;
          }
        }else{
          this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
          continue;
        }
      } else {
        // DES
        const previousOrder = {...this.IRPLocationList[this.IRPLocationList.length-1]};
        const TTPrevoiusOrderToOrderN = await getDuration({
          origin: {
            latitude: previousOrder.latitude,
            longitude: previousOrder.longitude
          },
          destination: {
            latitude: this.orderN.latitude,
            longitude: this.orderN.longitude
          },
          departureTime: previousOrder.collectingTime
        });
        
        this.collectingTime = moment(previousOrder.collectingTime).add(TTPrevoiusOrderToOrderN, "seconds");
        this.orderN.collectingTime = this.collectingTime.toDate();

        this.sortTempDESByPlaceTypeAndAT();
        //console.log("TEMP IRP LIST", this.IRPList)
        if (this.tempIRPList.length <= 2) {
        } else {
          await this.updateNewATForBeforeCheckingAvailable();

          const result = await this.checkOrderNDESIsAvailable();
          console.log("Result:", result === true ? "Avialable" : "Failed");
          if (result === false) {
            this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "DES");
            continue;
          }
        }

        this.orderN.status = "DELIVERED";
        this.IRPLocationList.push(this.orderN);
        this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "DES");
        this.removeNOrderByTypeFromSpotList(this.orderN.id, "DES");
        console.log("Order N is delivered: ", this.orderN);

        await this.processSecondRun();
        return;
      }
      this.endProcess();
      return;
    }
    // End IRP
    this.endProcess();
    return; 
  }

  async endProcess() {
    console.log("END PROCESS");
    this.printDetails(this.IRPList, "IRP List");
    this.printDetails(this.IRPLocationList, "IRP Location List");
    console.log(this.IRPLocationList);
    // process.exit();
    return;
  }

  async calculateTranportationAllOrders(oriLat, oriLng, startTime){
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
          departureTime: startTime
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

  async createNOrderDES(){
    const orderNDetails = {...this.calculatingOrders.find(order => order.id === this.orderN.id)};
    const tempOrderN = {...this.orderN};

    this.orderNDES = {
      id: this.orderN.id,
      type: "DES",
      arrivingTime: tempOrderN.arrivingTime,
      realArrivingTime: tempOrderN.arrivingTime,
      code: tempOrderN.code,
      numberOfLuggage: tempOrderN.numberOfLuggage,
      placeId: orderNDetails.destinationPlaceId,
      time: orderNDetails.pickupTime,
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
    const planOrder = await PlanOrders.create({
      planId: this.plan.id,
      orderId: this.orderN.id,
      collectingTime: this.orderN.collectingTime,
      embarkingTime: this.orderN.arrivingTime
    });
    this.removeNOrderByTypeFromSpotList(this.orderN.id, "ORI");
    this.spotList.push(this.orderNDES);
    this.orderN.status = "COLLECTED";
    this.IRPList.push(this.orderN);
    this.IRPLocationList.push(this.orderN);
    
    const orderNDESIsExist = this.IRPList.filter(order => 
      order.id === this.orderNDES.id && 
      order.type === "DES");

    if(orderNDESIsExist.length === 0){
      this.IRPList.push(this.orderNDES);
    }else{
    }
    
    return planOrder;
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
      console.log((i+1) + ". id: " + myArray[i].id+"["+myArray[i].type+"]["+myArray[i].status+"]");
    }
  }

  async orderNConsideration() {
    this.orderN = {...this.tempOrderList[0]}; 
    const sameTransportationList = this.tempOrderList.filter(order => order.transportationTime === this.orderN.transportationTime);
    const sameTransportationListDES = sameTransportationList.filter(order => order.type === "DES"); //order des no have status yet
    if(sameTransportationListDES.length > 0){
      this.orderN = {...sameTransportationListDES[0]};
    }else{
      const sameTransportationListORI = sameTransportationList.filter(order => order.type === "ORI");
      const IRPDESList = this.IRPList.filter(order => order.type === "DES" && order.status === "DELIVERING");
      let flag = true;

      if(sameTransportationListORI.length > 0){
        for(let i = 0; i < sameTransportationListORI.length && flag === true; i++){
          this.orderN = {...sameTransportationListORI[i]};
          this.createNOrderDES();
          let sameIRPDES = IRPDESList.filter(order => order.placeId === this.orderNDES.placeId);
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
    const dropTime = this.orderN.time;
    if (this.collectingTime > moment(dropTime)) {
    } else {
      this.collectingTime = moment(dropTime);
    }
    this.orderN.collectingTime = this.collectingTime.toDate();
  }

  async findOrderZDES(){
    const orderDES = [...this.IRPList.filter(order => order.type === "DES" && order.status === "DELIVERING")];
    if(orderDES.length > 0){
      const orderZDES = {...orderDES[orderDES.length - 1]};
      return orderZDES;
    }else{
      return null;
    }
  }

  async findOrderADES(){
    const orderDES = [...this.IRPList.filter(order => order.type === "DES" && order.status === "DELIVERING")];
    if(orderDES.length > 0){
      const orderADES = {...orderDES[0]};
      return orderADES;
    }else{
      return null;
    }
  }

  async findTempOrderADES(){
    const tempOrderDES = [...this.IRPList.filter(order => order.type === "DES" && order.status === "DELIVERING")];
    if(tempOrderDES.length > 0){
      return {...tempOrderDES[0]};
    }else{
      return null;
    }
  }

  async findTempOrderPreviousDES() {
    return {...this.IRPLocationList[this.IRPLocationList.length - 1]};
  }

  async findPreviousOrder(){
    const orderIRPLocationList = [...this.IRPLocationList];
    return orderIRPLocationList[orderIRPLocationList.length - 1];
  }

  async filterOrderByStatus(orders, type, status) {
    return orders.filter(order => order.type === type && order.status === status)
  }

  async updateTempIRPListAT(orderZ){
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
            order.arrivingTime = this.orderNDES.arrivingTime
          }
        }
        return order;
      });
    }else{
      this.tempIRPList.push(this.orderNDES);
    }
  }

  async sortDESByPlaceTypeAndAT() {
    const IRPORI = [...this.IRPList.filter(order => order.type === "ORI" || order.status === "COLLECTED")];
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
    const IRPORI = [...this.tempIRPList.filter(order => order.type === "ORI" || order.status === "COLLECTED")];
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
      departureTime: this.orderN.collectingTime
    });

    if (tempOrderADES.arrivingTime > moment(this.orderN.collectingTime).add(LTofOrderNToTempOrderADES, "seconds")) {
      this.arrivingTimeOfIRP = tempOrderADES.arrivingTime;
      this.IRPList = [...this.tempIRPList];
      return true;
    } else {
      return false;
    }
  }

  async checkOrderNDESIsAvailable(){
    const tempOrderADES = await this.findTempOrderPreviousDES();
    // console.group();
    // console.log("CHECK AVALIABLE N DES")
    // console.log(this.IRPLocationList.map(order => order.id));
    // console.log("ORDER A DES", tempOrderADES.id, tempOrderADES.type)
    // console.log("ORDER N", this.orderN.id, this.orderN.type)
    // console.groupEnd()

    const LTofOrderNToTempOrderADES = await getDuration({
      origin: {
        latitude: tempOrderADES.latitude,
        longitude: tempOrderADES.longitude
      },
      destination: {
        latitude: this.orderNDES.latitude,
        longitude: this.orderNDES.longitude,
      },
      departureTime: tempOrderADES.collectingTime
    });

    const orderADES = {...this.IRPList.find(order => !((order.id !== tempOrderADES.id) && (order.type !== "DES")))};
    // console.log("order A DES AT:", orderADES.arrivingTime);
    // console.log("order N CL:", this.collectingTime);
    // console.log("LT:", LTofOrderNToTempOrderADES);
    //return false;
    if (orderADES.arrivingTime > moment(this.collectingTime.toDate()).add(LTofOrderNToTempOrderADES, "seconds")) {
      //this.arrivingTimeOfIRP = orderADES.arrivingTime;
      //this.IRPList = [...this.tempIRPList];
      return true;
    } else {
      return false;
    }
  }

  async updateNewATForBeforeCheckingAvailable() {
    let i = 0;
    while (i !== this.tempIRPList.length - 1) {
      const lastIndex = this.tempIRPList.length - 1;
      const orderZ = {...this.tempIRPList[lastIndex - i]};
      const orderX = {...this.tempIRPList[lastIndex - i - 1]};
      const TT = await getDuration({
        origin: {
          latitude: orderZ.latitude,
          longitude: orderZ.longitude,
        },
        destination: {
          latitude: orderX.latitude,
          longitude: orderX.longitude,
        },
        arrivalTime: orderZ.arrivingTime
      });
      const newAT = moment(orderZ.arrivingTime).add(-TT, "seconds");
      if (newAT < orderX.arrivingTime) {
        this.tempIRPList[lastIndex - i - 1].arrivingTime = newAT.toDate();
      }
      i++;
    }
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
      status: 1, // Waiting,
      // planId: null,
      originPlaceId: { [Op.ne]: null },
      destinationPlaceId: { [Op.ne]: null },
      dropTime: {
        [Op.gte]: moment().startOf("day")
      },
      pickupTime: {
        [Op.lte]: moment().endOf("day")
      }
    }
  });
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
  // if (distance > 30minutes) throw new Error('This order is to far')
  return closestOrder;
};

const getDuration = async ({
  origin,
  destination,
  arrivalTime,
  departureTime
}) => {
  const distance = await getDistanceMatrix({
    origin,
    destination,
    arrivalTime,
    departureTime
  });
  const duration = distance.data.duration.value; // ruturn second
  return duration;
};

module.exports = {
  IRP,
  getCalculatingOrders,
  getDriverToPlan,
  findClosestOrder
};
