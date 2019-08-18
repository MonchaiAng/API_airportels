const moment = require('moment');

class Order {
  constructor(props) {
    this.setup(props);
    this.criticalTime = null;
  }

  setup(props) {
    Object.keys(props).map(key => (this[key] = props[key]));
  }

  async getCriticalTime() {
    if (this.criticalTime === null) {
      this.criticalTime = moment(this.pickupTime).add(-30, 'minutes');
    }
    return this.criticalTime;
  }
}

module.exports = Order;
