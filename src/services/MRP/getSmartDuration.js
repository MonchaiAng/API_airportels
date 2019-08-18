async getSmartDuration(originPlaceId, destinationPlaceId, startDateTime) {

    if(originPlaceId === destinationPlaceId){
      return 0;
    }else{
      
      const startTime = moment(startDateTime).format("HH:mm:ss");
      const result = await this.checkRouteIsExistByPlaceId(originPlaceId, destinationPlaceId);
      if(result === null){
        //insert to Routes
        
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
        //find distance and duration
        const inputPlaces = {origin, destination, departureTime};
        const durationDetails = await getDistanceMatrix(inputPlaces);
        
        //find schedule id from db
        const scheduleId = await this.findDepartureTimeSchedule(startTime);
        console.log(durationDetails);
        //insert data to gg_routes
        await GGRoutes.create({
          routeId: routeDetails.id,
          scheduleId: scheduleId,
          ggDuration: durationDetails.data.duration.value,
          trafficDuration: durationDetails.data.duration_in_traffic.value,
          departureTime: moment(startDateTime)
        });
        
        return durationDetails.data.duration.value + durationDetails.data.duration_in_traffic.value;
        console.log("Get From GG API Because of not exist before.");
        console.log("Duration included traffic index: ", durationDetails.data.duration.value + durationDetails.data.duration_in_traffic.value);

      }else{
        
        const scheduleId = await this.findDepartureTimeSchedule(startTime);
        const routeId = result.id;
        
        //check is there that routeId and scheduleId is exist?
        const ggRoutesDetails = await GGRoutes.findAll({
          where: {
            scheduleId: scheduleId,
            routeId: routeId
          }
        });
        //console.log(ggRoutesDetails);
        if(ggRoutesDetails.length >= 1){
          const historicRouteDetails = await this.checkHistoricRouteIsExistByPlaceId(this.driver.id, routeId, scheduleId);
          
          if(historicRouteDetails.length > 0){
            
            //gg database same route and schedule
            const ggRouteDB = await GGRoutes.findOne({
              where: {
                scheduleId: scheduleId,
                routeId: routeId
              }
            });
            //historic database same driver, route and any schedules 
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
            
            console.log("Get From HistoricRoute Database.");
            console.log("Duration included traffic index:", estimateTime); 
            return estimateTime;
          }else{
            
            const ggRoutesDetails = await GGRoutes.findOne({
              where: {
                scheduleId: scheduleId,
                routeId: routeId
              }
            });
            console.log("Get From GGRoute Database Because there is not any information in HistoricRoute.");
            console.log("Duration included traffic index: ", ggRoutesDetails.ggDuration + ggRoutesDetails.trafficDuration); 
            return ggRoutesDetails.ggDuration + ggRoutesDetails.trafficDuration;
          }
        }else{
          //create new gg_route for that schedule
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
          console.log("Get From GG API Because there is not same schedule in GGRoute.");
          console.log("Duration included traffic index: ", durationDetails.data.duration.value + durationDetails.data.duration_in_traffic.value);
          return durationDetails.data.duration.value + durationDetails.data.duration_in_traffic.value;
        }
      }
    }
  }