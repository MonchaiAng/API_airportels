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

    this.startTime = "2019-04-02T02:30:00.000Z";

  }
  async startProcess() {
    console.log("Prepare all of data...");
    // get orders
    this.calculatingOrders = await getCalculatingOrders();
    // All orders and their details are inside calculating orders

    // Filter only order “ORI” and add status of each order as “ORI” in “SPOT List”
    console.log("Create spotList");
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

      return _.pick(order, ['id', 'type', 'arrivingTime', 
                            'code', 'numberOfLuggage', 'placeId', 
                            'time', 'latitude', 'longitude', 
                            'collectingTime', 'transportationTime',
                            'placeType', 'status', 'realArrivingTime']);
    });
    

    // Get the copy of "SPOT List" and named it as "Temp Order List"
    console.log("Create tempOrderList (copy of SpotList)");
    this.tempOrderList = [...this.spotList];

    // RUN #1
    this.processFirstRun();
  }

  async processFirstRun() {
    console.log("PROCESS RUN#1 start");

    // Get selected driver location
    if (!this.driverLocation) {
      this.driverLocation = {
        latitude: this.driver.latitude,
        longitude: this.driver.longitude,
      };
    }

    // If there is driver then set current car cap as max car cap
    if (this.driver) {
      this.currentCarCap = this.driver.car.carCapacity;
    }

    console.log("Driver Location: " + this.driverLocation.latitude + ", " +this.driverLocation.longitude);
    console.log("Current car cap: " + this.currentCarCap);

    // calculating all transportationTime for all orders in tempOrderList.
    //await this.calculateTranportationAllOrders(this.driverLocation.latitude, this.driverLocation.longitude, moment());
    await this.calculateTranportationAllOrders(this.driverLocation.latitude, this.driverLocation.longitude, moment(this.startTIme));
    
    while (this.tempOrderList.length !== 0) {
      console.log("Finding New Order N");
      console.log("Sort orders in temp order list by TT time and then AT");
      this.tempOrderList = _.orderBy(
        this.tempOrderList,
        ["transportationTime", "arrivingTime"],
        ["ASC", "ASC"]                                                            
      );
      console.log("All order in temp order list is sorted by TT then AT");
      
      console.log("Select Order N(ORI)");
      // Select order with the lowest TT  in “Temp Order List” and Type is equal to “ORI” as N Order
      this.orderN = {...this.tempOrderList[0]};
      console.log("Order N(ORI): ", this.orderN);

      // Create order N DES
      console.log("Find Order N(DES)");
      this.createNOrderDES();
      console.log("Order N(DES): ", this.orderNDES);
      
      //calculating CL = time + tt of driver to order N ORI
      console.log("CL = now() + TT (Driver to Order N ORI)");
      this.collectingTime = moment(this.startTime).add(this.orderN.transportationTime, "seconds"); 
      console.log("Collecting time: ", this.collectingTime.toDate());
      console.log("Current Time: ", moment().toDate());
      
      // Calculate LT of N Order ORI to DES A (N Order DES)
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
      //arrivalTime: this.collectingTime
      console.log("Landing time: ", this.landingTime);
      
      // LG of N Order less than current Car Cap?
      if (this.orderN.numberOfLuggage > this.currentCarCap) {
        console.log("Number of Luggage is greater than Current Car cap");
        await this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
        console.log("Current Car cap: "+this.orderN.numberOfLuggage+"/"+this.currentCarCap);
        continue;
      }
      console.log("Number of Luggage is avialable for Current Car cap");
      console.log("Current Car cap: "+this.orderN.numberOfLuggage+"/"+this.currentCarCap);
      
      // driver location is at the moment
      // The computation is Time at the moment + driver current location to N order location
      // Driver location + TT greater than DT - 15 ?

      console.log("Check Order N CL is available? (CL >= DT - 15 ?)");

      console.log("Order N Collecting Time: ", this.collectingTime.toDate());
      console.log("DropTime - 15 mins: ", moment(this.orderN.time).add(-15, "minutes").toDate());

      //this.collectingTime = moment("2019-04-02T02:00:00.000Z");
      if (this.collectingTime < moment(this.orderN.time).add(-15, "minutes")) {
        this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
        console.log("Driver can not collect the luggages because of its CT");
        continue;
      }

      console.log("Driver can collect the luggages because of its CT");
      // AT of N Order Greater than LT + TT(driver to N Order) of N Order
      console.log("Check Order N AT is available?");
      console.log("Order N AT: ", this.orderN.arrivingTime);
      console.log("Order N ORI to Order N DES: ", moment(this.orderN.time).add(this.orderN.transportationTime + this.landingTime, "seconds").toDate());
      //this.orderN.arrivingTime = moment("2019-04-02T04:00:00.000Z");
      if (moment(this.orderN.arrivingTime) < moment(this.orderN.time).add(this.orderN.transportationTime + this.landingTime, "seconds")) {
        this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
        console.log("Driver can not collect this orders because of its AT");
        continue;
      }
      console.log("Driver can collect this orders because of its AT");
      
      // (A) Process
      console.log("Order N is OK for this IRP");
      // Create IRP
      
      this.plan = await Plans.create({
        driverId: this.driver.id,
        updatedBy: 1, //manager id
        createdBy: 1  //manager id
      });

      await this.updateCollectingTime();
      console.log("Collecting time: ", this.orderN.collectingTime.toDate());

      // Take N Order to “IRP List”
      await this.takeNOrderToIRP();
      console.log("Order N is taken to IRP");

      // Set new current Car Cap
      this.currentCarCap = this.currentCarCap - this.orderN.numberOfLuggage;
      console.log("Update new Current Car Cap");
      console.log("Current Car Cap: ", this.currentCarCap);
      
      // Set AT of N Order as AT of IRP
      this.arrivingTimeOfIRP = this.orderN.arrivingTime;
      console.log("Setting IRP AT as Order N AT");
      console.log("IRP Arriving Time:", this.arrivingTimeOfIRP);
      
      // N Order DES is Airport ?
      if (this.orderNDES.placeType === "AIRPORT") {
        console.log("Destination of Order N is 'Airport'")
        this.destinationListOfIRP.push(this.orderNDES.placeId);
      }

      
      // current Car Cap greater than 0 ?
      console.log("Check current car cap (Available?)");
      if (this.currentCarCap > 0) {
        console.log("Current Car Cap is Available");
        console.log("Finish RUN#1 and go to RUN#2");
        await this.processSecondRun();
        return;
      } else {
        // DES of IRP is Airport
        if (this.orderNDES.placeType === "AIRPORT") {
          console.log("Current Car Cap is not Available");
          await this.endProcess();
          return;
        } else {
          console.log("Driver move to Order A DES");
          this.driverLocation = {
            latitude: this.orderNDES.latitude,
            longitude: this.orderNDES.longitude,
          };
          console.log("Finish RUN#1 and go to RUN#2");
          await this.processSecondRun();
          return;
        }
      }
      
    }

    await this.endProcess();
    return;
  }

  async processSecondRun() {
    
    console.log("IRPList: ", this.IRPLocationList);
    console.log("RUN#2 start process...");
    
    // Get current spot list
    // Get the copy of spot list and named it as temp order list
    console.log("Get Current Spot List");
    console.log("Get temp spot list (copy of Spot List)");
    this.tempOrderList = [...this.spotList];
    this.tempIRPList = [...this.IRPList];

    console.log("Get Order Z from IRPList");
    const orderZ = this.findOrderZDES();
    console.log("OrderZ DES: ", orderZ);

    // Get previous order location (lastest CL)
    console.log("Find previous collecting time (start time)");
    const previousOrder = this.findPreviousOrder();
    console.log("Previous Order: ", previousOrder);

    console.log("Previous Collecting Time: ", previousOrder.collectingTime);
    
    console.log("Calculate TT from last point to every next points");
    await this.calculateTranportationAllOrders(previousOrder.latitude, previousOrder.longitude, moment(previousOrder.collectingTime));
    
    console.log("Sort temp order list by TT then AT");
    this.tempOrderList = _.orderBy(
      this.tempOrderList,
      ["transportationTime", "arrivingTime"],
      ["ASC", "ASC"]                                                            
    );
    console.log("All order in temp order list is sorted by TT then AT: ", this.tempOrderList);

    //console.log("Sorted Temp Order List: ", this.tempOrderList);
    while (this.tempOrderList.length !== 0) {
      
      this.orderNConsideration();

      //we got the order N
      console.log("Order N: ", this.orderN);
      console.log("Order NDES: ", this.orderNDES);

      if(this.orderN.type === "ORI"){
        //select Origin Case
        console.log("'ORI' Case for driver pick up")
        //Get drop time of Order N
        
        const dropTime = moment(this.orderN.time);
        console.log("Order N DT: ", dropTime);

        //Get Arriving time of Order N
        this.arrivingTime = moment(this.orderN.arrivingTime);
        console.log("Order N AT: ", this.arrivingTime);

        //Calculate collecting time of Order N
        //fix bug this.collecting time
        console.log("Calculating collecting time for Order N (previousCollectingTime + TT to Order N)");

        const TTPreviousOrderToOrderN = await getDuration({
          origin: {
            latitude: previousOrder.latitude,
            longitude: previousOrder.longitude
          },
          destination: {
            latitude: this.orderN.latitude,
            longitude: this.orderN.longitude
          },
          arrivalTime: previousCollectingTime 
        });

        this.collectingTime = moment(previousCollectingTime).add(TTPreviousOrderToOrderN, "seconds");
        console.log("Collecting Time: ", this.collectingTime);
        
        console.log("Check LG Order N is available?");
        if(this.orderN.numberOfLuggage <= this.currentCarCap){
          console.log("LG is less then Current Car Cap");

          console.log("Check driver CL is available?");
          if(this.collectingTime > moment(dropTime).add(-15, "minutes")){
            console.log("CL is available driver pick up");

            console.log("Check N Order DES is 'Airport'?");
            this.createNOrderDES();

            if(this.orderNDES.placeType === "AIRPORT"){
              console.log("Case Order N ORI + DES is Airport");

              if(orderZ !== null){
                console.log("There are more than one order (DES)");
                // Order Z is always 'DES type' and status is always 'DELIVERING'

                if(orderZ.placeType === "AIRPORT"){
                  console.log("Order Z DES is equal to 'AIRPORT'");

                  if(orderZ.placeId === this.orderN.placeId){
                    console.log("Order Z is AIPORT DES and placeId is similar to Order N DES");
                    if(this.orderN.arrivingTime >= orderZ.arrivingTime){
                      console.log("order N AT >= order Z AT");
                      console.log("Find Order A DES");
                      const orderADES = this.findOrderADES(); //orderADES is always not null
                      console.log("Order A DES: ", orderADES);
                      //Order N is "ORI"
                      console.log("Calculate LT of Order N to Order A DES");
                      
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

                      console.log("LT(Order N to Order A DES): ", LTofOrderNToOrderADES);

                      if(orderADES.arrivingTime > moment(this.collectingTime).add(LTofOrderNToOrderADES, "seconds")){
                        console.log("ORI, OrderN & OrderZ DES = AIRPORT, OrderZPlaceId = OrderNDESPlaceId, OrderNAT > OrderZAT");
                        console.log("Order N can be taken into IRPList");
                        this.updateCollectingTime();
                        await this.takeNOrderToIRP();
                        this.sortDESByPlaceTypeAndAT();
                        console.log("GO TO RUN#2");
                        await this.processSecondRun();
                      }else{
                        console.log("Order A DES AT <= Order N CL + LT");
                        console.log("Go to process B");
                        continue;
                      }
                    }else{
                      console.log("ORI, OrderN & OrderZ DES = AIRPORT, OrderZPlaceId != OrderNDESPlaceId, OrderNAT > OrderZAT");
                      console.log("order N AT < order Z AT");
                      console.log("Update tempIRPList AT before sorting");
                      this.updateTempIRPListAT(orderZ);
                      console.log("Sort tempIRPList DES List and Airport is always last");
                      this.sortTempDESByPlaceTypeAndAT();
                      console.log("Update temp irp list afer sorting and before avaliable checking");
                      await this.updateNewATForBeforeCheckingAvailable();

                      const result = await this.checkOrderNIsAvailable();
                      if(result === true ){
                        console.log("Order N can be taken into IRPList");
                        this.updateCollectingTime();
                        await this.takeNOrderToIRP();
                        this.sortDESByPlaceTypeAndAT();
                        console.log("GO TO RUN#2");
                        await this.processSecondRun();
                      }else{
                        console.log("Order N is not Available");
                        return;
                      }
                    }
                  }else{
                    console.log("Order Z is AIPORT DES but not same placeId");
                    console.log("Go to process B");
                    continue;
                  }
                }else{
                  console.log("ORI, OrderN DES = AIRPORT & OrderZ DES != AIRPORT, OrderZPlaceId != OrderNDESPlaceId, OrderNAT > OrderZAT");
                  console.log("Update tempIRPList AT before sorting");
                  this.updateTempIRPListAT(orderZ);
                  console.log("Sort tempIRPList DES List and Airport is always last");
                  this.sortTempDESByPlaceTypeAndAT();
                  console.log("Update temp irp list afer sorting and before avaliable checking");
                  await this.updateNewATForBeforeCheckingAvailable();

                  const result = await this.checkOrderNIsAvailable();
                  if(result === true ){
                    console.log("Order N can be taken into IRPList");
                    this.updateCollectingTime();
                    await this.takeNOrderToIRP();
                    this.sortDESByPlaceTypeAndAT();
                    console.log("GO TO RUN#2");
                    await this.processSecondRun();
                  }else{
                    console.log("Order N is not Available");
                    return;
                  }
                }
                
              }else{
                console.log("There is not any order in IRP LIST (DES)");
                console.log("go on / finish job!!!!");
                //todo
                return;
              }
            }else{
              //TODO: tocheck
              console.log("Case Order N ORI + DES is not Airport");
              console.log("Find Order A DES");

              const orderADES = this.findOrderADES();
              console.log("Get orderA DES");
              
              console.log("Check AT of Order N is available?");
              if(this.orderNDES.arrivingTime < this.orderADES.arrivingTime){
                console.log("AT of Order N is available (AT OrderN < AT OrderA DES)");
                //calculate tt of N order des to a order des
                console.log("Find TT from Order N to Order A DES");
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
                //find diff of A order AT and N order AT
                //TO DO:
                console.log("Find differnt of AT (Order A DES and Order N)");
                console.log("The difference is always negative");
                let diffOfAT = moment(orderADES.arrivingTime).diff(this.orderN.arrivingTime, "seconds");

                console.log("Check if TTOrderNToOrderADES >= diffOfAT then change new orderNDES AT");
                if(TTOrderNToOrderADES >= diffOfAT){
                  console.log("Change new OrderN DES AT");
                  //New AT of N Order is equal to AT of N Order + Diff
                  this.orderNDes.arrivingTime = moment(this.orderNDES.arrivingTime).add(diffOfAT, "seconds");
                }
                console.log("orderNDES AT does not change");

                console.log("Calculate LT of Order N to Order A DES");
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

                console.log("Check Order N can go by its AT");
                if(moment(this.collectingTime).add( LTOrderNToOrderADES, "seconds") >= this.orderNDes.arrivingTime){
                  console.log("Can not pick up Order N because its AT is not available");
                  continue;
                }

                this.tempIRPList.push(this.orderNDES);
                console.log("Sort tempIRPList DES List and Airport is always last");
                this.sortTempDESByPlaceTypeAndAT();
                console.log("Order N can be taken into IRPList");
                this.updateCollectingTime();
                await this.takeNOrderToIRP();
                this.sortDESByPlaceTypeAndAT();
                console.log("GO TO RUN#2");
                await this.processSecondRun();
              }else{
                this.tempIRPList.push(this.orderNDES);
                console.log("Sort tempIRPList DES List and Airport is always last");
                this.sortTempDESByPlaceTypeAndAT();
                console.log("Update temp irp list afer sorting and before avaliable checking");
                await this.updateNewATForBeforeCheckingAvailable();

                const result = await this.checkOrderNIsAvailable();
                if(result === true ){
                  console.log("Order N can be taken into IRPList");
                  this.updateCollectingTime();
                  await this.takeNOrderToIRP();
                  this.sortDESByPlaceTypeAndAT();
                  console.log("GO TO RUN#2");
                  await this.processSecondRun();
                }else{
                  console.log("Order N is not Available");
                  return;
                }
              }
            }
          }else{
            //remove N order from temp order list
            console.log("CL is not available driver pick up");
            console.log("Remove Order N from Temp Order List");
            this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
            continue;
          }
        }else{
          //remove N order from temp order list
          console.log("Remove Order N from Temp Order List");
          this.removeNOrderByTypeFromTempOrderList(this.orderN.id, "ORI");
          continue;
        }
      } else {
        // DES


        // // Set AT of “Temp IRP DES” with Real AT (original order)
        // this.tempIRPList = this.tempIRPList.map(order => ({
        //   ...order,
        //   arrivingTime: order.realArrivingTime
        // }));

        this.sortTempDESByPlaceTypeAndAT();
        // Is there less than or equal to 2 orders DES in “Temp IRP DES”
        if (this.tempIRPList.length <= 2) {
          // next;
        } else {
          await this.updateNewATForBeforeCheckingAvailable();

          const result = await this.checkOrderNIsAvailable();
          if (result === true) {
            // next
          } else {
            // Remove N Order from “Temp Order List”
            this.tempOrderList = this.tempOrderList.filter(order => order.id !== orderN.id);
            // (B) Process
            continue;
          }
        }
        
        // Mark the N order DES in IRP list with “Dropped”
        this.deliveredOrderN();
        this.removeNOrderByTypeFromTempOrderList(this.orderN.id, this.orderN.type);
        this.removeNOrderByTypeFromSpotList(this.orderN.id, this.orderN.type);
        // (C) Process
        await this.processSecondRun();
        return;
      }
      
      
      // Select the order and named it N Order
      
      //console.log("order N: ", this.orderN);
      return;
    }
    // End IRP
    console.log("End process creating IRP");
    return; 
  }

  async endProcess() {
    console.log("END PROCESS");
    // process.exit();
    return;
  }

  async calculateTranportationAllOrders(oriLat, oriLng, startTime){
    console.log("Calculate TT from selected order to all locations");
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
  }

  async createNOrderDES(){
    const orderNDetails = this.calculatingOrders.find(order => order.id === this.orderN.id);

    this.orderNDES = {
      id: this.orderN.id,
      type: "DES",
      arrivingTime: this.orderN.arrivingTime,
      realArrivingTime: this.orderN.realArrivingTime,
      code: this.orderN.code,
      numberOfLuggage: this.orderN.numberOfLuggage,
      placeId: orderNDetails.destinationPlaceId,
      time: orderNDetails.pickupTime,
      latitude: orderNDetails.destinationPlace.latitude,
      longitude: orderNDetails.destinationPlace.longitude,
      collectingTime: null,
      transportationTime: null,
      placeType: orderNDetails.destinationPlace.type.type,
      status: "DELIVERING"
    };
  }

  async takeNOrderToIRP() {
    console.log("Take Order N to IRP List");
    // await Orders.update({ planId: this.plan.id }, { where: { id: orderN.id } });
    const planOrder = await PlanOrders.create({
      planId: this.plan.id,
      orderId: this.orderN.id,
      collectingTime: this.orderN.collectingTime,
      embarkingTime: this.orderN.arrivingTime
    });

    console.log("Remove Order N ORI from SPOT List");
    this.removeNOrderByTypeFromSpotList(this.orderN.id, "ORI");
    console.log("Add Order N DES from SPOT List");
    this.spotList.push(this.orderNDES);
    console.log("Change Order N ORI status to 'COLLECTED'");
    this.orderN.status = "COLLECTED";
    console.log("Take Order N ORI to IRPList(as Collected)");
    this.IRPList.push(this.orderN);
    console.log("Take Order N IRPLocationList");
    this.IRPLocationList.push(this.orderN);
    
    const orderNDESIsExist = this.IRPList.filter(order => 
      order.id === this.orderNDES.id && 
      order.type === "DES");

    if(orderNDESIsExist.length === 0){
      console.log("Take Order N DES to IRPList(as DELIVERING)");
      this.IRPList.push(this.orderNDES);
    }else{
      console.log("Order N is already inside IRPList");
    }
    
    return planOrder;
  }

  async orderNConsideration() {
    //first order of sorted list is the lowest TT and then AT
    console.log("Finding the first order with same TT");
    console.log("Finding new Order N");
    console.log("Find refference of Order N");
    this.orderN = {...this.tempOrderList[0]}; 
    console.log("Get Order N ref: ", this.orderN);
    
    // Create the list with lowest Transportation time
    console.log("Find order same lowest TT in tempOrderList");
    const sameTransportationList = this.tempOrderList.filter(order => order.transportationTime === this.orderN.transportationTime);
    console.log("FInd order: Is there any order DES in sameTransportationList ?");
    const sameTransportationListDES = sameTransportationList.filter(order => order.type === "DES"); //order des no have status yet
    if(sameTransportationListDES.length > 0){
      console.log("There is order type DES in same TT List");
      this.orderN = {...sameTransportationListDES[0]};
    }else{
      console.log("There is not any order type DES in same TT List");
      console.log("Find ORI case in sameTransportationList");
      const sameTransportationListORI = sameTransportationList.filter(order => order.type === "ORI");
      console.log("Get all List of IRPList DES");
      const IRPDESList = this.IRPList.filter(order => order.type === "DES" && order.status === "DELIVERING");
      let flag = true;

      if(sameTransportationListORI.length > 0){
        for(let i = 0; i < sameTransportationListORI.length && flag === true; i++){
          console.log("Choose order N in sameTransportationListORI");
          this.orderN = {...sameTransportationListORI[i]};
          console.log("Find order N DES");
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
    console.log("Update Collecting Time process...");
    const dropTime = this.orderN.time;
    console.log("Find Order N DropTime: ", dropTime);
    if (this.collectingTime > moment(dropTime)) {
      console.log("Collecting time does not change");
    } else {
      this.collectingTime = moment(dropTime); //time type ORI
      console.log("Collecting time is changed");
    }
    console.log("Update Collecting Time to Order N");
    this.orderN.collectingTime = this.collectingTime;
  }

  async findOrderZDES(){
    console.log("Find Order Z Process...");
    console.log("Find All Orders their type eqaul to 'DES' and their status is 'DELIVERING'");
    const orderDES = [...this.IRPList.filter(order => order.type === "DES" && order.status === "DELIVERING")];
    console.log("Order Z (DES) is the last one");

    if(orderDES.length > 0){
      const orderZDES = {...orderDES[orderDES.length - 1]};
      return orderZDES;
    }else{
      console.log("There is no Order DES (return Null)");
      console.log("finish/ go on?");
      return null;
    }
  }

  async findOrderADES(){
    console.log("Find Order A Process...");
    console.log("Find All Orders their type eqaul to 'DES' and their status is 'DELIVERING'");
    const orderDES = [...this.IRPList.filter(order => order.type === "DES" && order.status === "DELIVERING")];
    console.log("Order A (DES) is the first one");

    if(orderDES.length > 0){
      const orderADES = {...orderDES[0]};
      return orderADES;
    }else{
      console.log("There is no Order DES (return Null)");
      return null;
    }
  }

  async findTempOrderADES(){
    console.log("Find temp Order A Process...");
    console.log("Find All themp Orders their type eqaul to 'DES' and their status is 'DELIVERING'");
    const tempOrderDES = [...this.IRPList.filter(order => order.type === "DES" && order.status === "DELIVERING")];
    console.log("Order A (DES) is the first one");

    if(tempOrderDES.length > 0){
      return {...tempOrderDES[0]};
    }else{
      console.log("There is no Order DES (return Null)");
      return null;
    }
  }

  async findPreviousOrder(){
    console.log("Find Previous Order Process...");
    const orderIRPLocationList = [...this.IRPLocationList];
    console.log("Previous Order is the last one");
    return orderIRPLocationList[orderIRPLocationList.length - 1];
  }

  async filterOrderByStatus(orders, type, status) {
    return orders.filter(order => order.type === type && order.status === status)
  }

  async updateTempIRPListAT(orderZ){
    console.log("update temp irp list AT before sort");
    console.log("push orderNDES to temp IRPList");
    this.tempIRPList.push(this.orderNDES);

    if(orderZ.placeType === "AIRPORT"){
      //find order N Id
      //same airport route
      console.log("Order Z DES is equal to 'AIRPORT'");
      console.log(
        "Find all orders which type = 'DES', placeType = 'AIRPORT' and status = 'DELIVERING'"
      );
      let allOrderDESSameAirport = [
        ...this.tempIRPList.filter(
          order =>
            order.type === "DES" &&
            order.placeType === "AIRPORT" &&
            order.status === "DELIVERING" &&
            order.placeId === orderNDES.placeId
        )
      ];

      console.log("Sort Same airport order by AT");

      allOrderDESSameAirport = _.orderBy(["arrivingTime"], ["ASC"]);

      console.log("Find index of Order N DES");

      const indexOfOrderNDES = 
        allOrderDESSameAirport.findIndex(
          order =>
            order.id === this.orderNDES.id
        );

      if(orderZ.id !== this.tempIRPList[indexOfOrderNDES + 1].id){
        this.tempIRPList[indexOfOrderNDES + 1].arrivingTime = this.orderNDES.arrivingTime;
        console.log("Order DES Airport which index + 1, its AT is change to this.orderNDES AT");
        console.log("Note that this index + 1 is not Order Z")
      }
    }else{
      console.log("Order Z DES is not equal to 'AIRPORT'");
      this.tempIRPList.push(this.orderNDES);
    }
  }

  async sortDESByPlaceTypeAndAT() {
    console.log("Sort IRP List All ORI/DES");
    const IRPORI = [...this.IRPList.filter(order => order.type === "ORI" || order.status === "DERIVERED")];
    const IRPDES = [...this.IRPList.filter(order => order.type === "DES" && order.status !== "DERIVERED")]; //delivering
    let tempIRPDES = [...IRPDES]; 
    tempIRPDES = _.orderBy(tempIRPDES, ["arrivingTime"], ["ASC"]);
    console.log("IRPList is sorted");
    const tempIRPList = [
      ...IRPORI,
      ...tempIRPDES.filter(order => order.placeType !== "AIRPORT"),
      ...tempIRPDES.filter(order => order.placeType === "AIRPORT")
    ];

    console.log("Update IRPList with tempIRPList");
    this.IRPList = [...tempIRPList];
  }

  async sortTempDESByPlaceTypeAndAT() {
    console.log("Sort temp IRP List All ORI/DES");
    const IRPORI = [...this.tempIRPList.filter(order => order.type === "ORI" || order.status === "DERIVERED")];
    const IRPDES = [...this.tempIRPList.filter(order => order.type === "DES" && order.status !== "DERIVERED")]; //delivering
    let tempIRPDES = [...IRPDES]; // copy array
    tempIRPDES = _.orderBy(tempIRPDES, ["arrivingTime"], ["ASC"]);
    console.log("TempIRPList is sorted");
    this.tempIRPList = [
      ...IRPORI,
      ...tempIRPDES.filter(order => order.placeType !== "AIRPORT"),
      ...tempIRPDES.filter(order => order.placeType === "AIRPORT")
    ]
    console.log("Update IRPList with tempIRPList");
  }
    
  async checkOrderNIsAvailable(){
    console.log("Check Order N DES is Available after update AT");
    const tempOrderADES = this.findTempOrderADES();
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
      console.log("Update IRP AT");
      this.arrivingTimeOfIRP = tempOrderADES.arrivingTime;
      console.log("Update IRPList with tempIRPList");
      this.IRPList = [...this.tempIRPList];
      return true;
    } else {
      console.log("Go to process B");
      return false;
    }
  }

  async updateNewATForBeforeCheckingAvailable() {
    // X is the Z-1 Order index and Set i = 0
    let i = 0;
    // Last Comparation is A Order DES
    while (i !== tempIRPDES.length - 1) {
      const lastIndex = tempIRPDES.length - 1;
      const orderZ = tempIRPDES[lastIndex - i];
      const orderX = tempIRPDES[lastIndex - i - 1];

      // (TT of X-i Order DES to X-1-i Order DES) 
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
      })
      // (AT of X-1-i Order - AT of X-i Order)
      const newAT = moment(orderZ.arrivingTime).add(-TT, "seconds");
      if (newAT < orderX.arrivingTime) {
        tempIRPDES[lastIndex - i - 1].arrivingTime = newAT;
      }
      i++;
    }
  }

  // Remove N Order from “Temp Order List”
  // In the next run, we have to check more that order is ORI or DES
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

//find the order that not exist inside any plan.
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
