const {getDistanceMatrix} = require("./src/helpers/googleMap");
const call = async () => {
  const origin = {
    latitude: "13.7287024",
    longitude: "100.5680943"
  }
  const destination = {
    latitude: "13.7375512",
    longitude: "100.5588206"
  }

  const arrivalTime = {arrivalTime: "09:30:00"};
  const departureTime = {departureTime : "09:30:00"};
  const distance = await getDistanceMatrix({
    origin,
    destination,
    departureTime
  });
  console.log("distance:", distance);
}
call();