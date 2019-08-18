const set1 = [
  {"id":"1","planId":"1","orderId":"20","placeId":"hotel15","collectingTime":"2019-04-05 09:30:00","arrivingTime":"2019-04-05 14:30:00","type":"ORI","isOriginal":"1","isOnPlaned":"1","createdAt":"2019-04-17 08:00:19","updatedAt":"2019-04-17 08:00:19"},
  {"id":"2","planId":"1","orderId":"20","placeId":"AirportBKK","collectingTime":"2019-04-05 13:06:36","arrivingTime":"2019-04-05 14:30:00","type":"DES","isOriginal":"1","isOnPlaned":"1","createdAt":"2019-04-17 08:00:19","updatedAt":"2019-04-17 08:00:19"},
  {"id":"3","planId":"1","orderId":"2","placeId":"hotel5","collectingTime":"2019-04-05 09:45:21","arrivingTime":"2019-04-05 14:30:00","type":"ORI","isOriginal":"1","isOnPlaned":"1","createdAt":"2019-04-17 08:00:19","updatedAt":"2019-04-17 08:00:19"},
  {"id":"4","planId":"1","orderId":"2","placeId":"AirportBKK","collectingTime":"2019-04-05 13:06:36","arrivingTime":"2019-04-05 14:30:00","type":"DES","isOriginal":"1","isOnPlaned":"1","createdAt":"2019-04-17 08:00:19","updatedAt":"2019-04-17 08:00:19"},
  {"id":"5","planId":"1","orderId":"17","placeId":"hotel13","collectingTime":"2019-04-05 10:05:26","arrivingTime":"2019-04-05 17:30:00","type":"ORI","isOriginal":"1","isOnPlaned":"1","createdAt":"2019-04-17 08:00:19","updatedAt":"2019-04-17 08:00:19"},
  {"id":"6","planId":"1","orderId":"17","placeId":"AirportBKK","collectingTime":"2019-04-05 13:06:36","arrivingTime":"2019-04-05 17:30:00","type":"DES","isOriginal":"1","isOnPlaned":"1","createdAt":"2019-04-17 08:00:19","updatedAt":"2019-04-17 08:00:19"},
  {"id":"7","planId":"1","orderId":"21","placeId":"hotel16","collectingTime":"2019-04-05 10:15:04","arrivingTime":"2019-04-05 17:30:00","type":"ORI","isOriginal":"1","isOnPlaned":"1","createdAt":"2019-04-17 08:00:19","updatedAt":"2019-04-17 08:00:19"},
  {"id":"8","planId":"1","orderId":"21","placeId":"AirportBKK","collectingTime":"2019-04-05 13:06:36","arrivingTime":"2019-04-05 17:30:00","type":"DES","isOriginal":"1","isOnPlaned":"1","createdAt":"2019-04-17 08:00:19","updatedAt":"2019-04-17 08:00:19"},
  {"id":"9","planId":"1","orderId":"16","placeId":"hotel11","collectingTime":"2019-04-05 10:22:41","arrivingTime":"2019-04-05 11:00:00","type":"ORI","isOriginal":"1","isOnPlaned":"1","createdAt":"2019-04-17 08:00:19","updatedAt":"2019-04-17 08:00:19"},
  {"id":"10","planId":"1","orderId":"16","placeId":"hotel12","collectingTime":"2019-04-05 10:53:10","arrivingTime":"2019-04-05 11:00:00","type":"DES","isOriginal":"1","isOnPlaned":"1","createdAt":"2019-04-17 08:00:19","updatedAt":"2019-04-17 08:00:19"},
  {"id":"11","planId":"1","orderId":"14","placeId":"hotel8","collectingTime":"2019-04-05 10:34:50","arrivingTime":"2019-04-05 17:30:00","type":"ORI","isOriginal":"1","isOnPlaned":"1","createdAt":"2019-04-17 08:00:19","updatedAt":"2019-04-17 08:00:19"},
  {"id":"12","planId":"1","orderId":"14","placeId":"hotel7","collectingTime":"2019-04-05 11:13:03","arrivingTime":"2019-04-05 17:30:00","type":"DES","isOriginal":"1","isOnPlaned":"1","createdAt":"2019-04-17 08:00:19","updatedAt":"2019-04-17 08:00:19"},
  {"id":"13","planId":"1","orderId":"10","placeId":"hotel6","collectingTime":"2019-04-05 11:31:48","arrivingTime":"2019-04-05 17:30:00","type":"ORI","isOriginal":"1","isOnPlaned":"1","createdAt":"2019-04-17 08:00:19","updatedAt":"2019-04-17 08:00:19"},
  {"id":"14","planId":"1","orderId":"10","placeId":"AirportBKK","collectingTime":"2019-04-05 13:06:36","arrivingTime":"2019-04-05 17:30:00","type":"DES","isOriginal":"1","isOnPlaned":"1","createdAt":"2019-04-17 08:00:19","updatedAt":"2019-04-17 08:00:19"},
  {"id":"15","planId":"1","orderId":"12","placeId":"MallMBK","collectingTime":"2019-04-05 12:00:00","arrivingTime":"2019-04-05 14:30:00","type":"ORI","isOriginal":"1","isOnPlaned":"1","createdAt":"2019-04-17 08:00:19","updatedAt":"2019-04-17 08:00:19"},
  {"id":"16","planId":"1","orderId":"12","placeId":"AirportBKK","collectingTime":"2019-04-05 13:06:36","arrivingTime":"2019-04-05 14:30:00","type":"DES","isOriginal":"1","isOnPlaned":"1","createdAt":"2019-04-17 08:00:19","updatedAt":"2019-04-17 08:00:19"},
  {"id":"17","planId":"1","orderId":"22","placeId":"hotel17","collectingTime":"2019-04-05 12:15:25","arrivingTime":"2019-04-05 18:30:00","type":"ORI","isOriginal":"1","isOnPlaned":"1","createdAt":"2019-04-17 08:00:19","updatedAt":"2019-04-17 08:00:19"},
  {"id":"18","planId":"1","orderId":"22","placeId":"AirportBKK","collectingTime":"2019-04-05 13:06:36","arrivingTime":"2019-04-05 18:30:00","type":"DES","isOriginal":"1","isOnPlaned":"1","createdAt":"2019-04-17 08:00:19","updatedAt":"2019-04-17 08:00:19"},
  {"id":"19","planId":"1","orderId":"4","placeId":"MallT21","collectingTime":"2019-04-05 12:31:41","arrivingTime":"2019-04-05 16:49:00","type":"ORI","isOriginal":"1","isOnPlaned":"1","createdAt":"2019-04-17 08:00:19","updatedAt":"2019-04-17 08:00:19"},
  {"id":"20","planId":"1","orderId":"4","placeId":"AirportBKK","collectingTime":"2019-04-05 13:06:36","arrivingTime":"2019-04-05 16:49:00","type":"DES","isOriginal":"1","isOnPlaned":"1","createdAt":"2019-04-17 08:00:19","updatedAt":"2019-04-17 08:00:19"}
];

module.exports = {
  set1
};
