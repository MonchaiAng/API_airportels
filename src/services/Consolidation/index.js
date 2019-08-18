const moment = require("moment");
const sequelize = require("sequelize");
const {
  Plans,
  Orders,
  Places,
  PlaceTypes,
  PlanOrders,
  OrderStatuses
} = require("../../models");

const { Op } = sequelize;

const Consolidation = () => {
  console.log("CONSTRUCTOR CONSOLIDATION");
  return {
    plans: [],
    async start() {
      console.log("START");
      this.process();
    },
    async process() {
      console.log("PROCESSING");
      this.plans = await getPlansAreDelivering();
      console.log("PLANS LENGTH", this.plans);

      console.log("END PROCESS");
      // setTimeout(() => this.process(), 3000);
    }
  };
};

const getPlansAreDelivering = async () => {
  const plans = await Plans.findAll({
    attributes: {
      include: [
        [
          sequelize.literal(
            ` (SELECT COUNT(collectingTime)
              FROM plan_orders 
              WHERE plan_orders.planId = plans.id)`
          ),
          "collectingCount"
        ]
      ]
    },
    // ต้องหา plans ที่มี order เวลาปัจจุบันอยู่ระหว่างการขนส่ง (collectingTime กับ embarkingTime)
    include: [
      {
        model: PlanOrders
        // where: {
        //   collectingTime: {
        //     [Op.gte]: moment().startOf("day").toDate(),
        //   },
        //   embarkingTime: {
        //     [Op.lte]: moment().endOf("day").toDate(),
        //   },
        // },
      },
      {
        model: Orders,
        as: "order",
        // where: {
        // createdAt: {
        //   [Op.gte]: moment().startOf("day").toDate(),
        //   [Op.lte]: moment().endOf("day").toDate(),
        // }
        // status: 1,
        // },
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
          }
          // {
          //   model: OrderStatuses,
          //   as: "statusData"
          // }
        ]
      }
    ]
  });
  return plans.map(plan => plan.toJSON());
};

module.exports = Consolidation;
