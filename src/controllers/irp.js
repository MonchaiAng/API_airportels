const moment = require('moment');
const _ = require("lodash");
const { Op } = require('sequelize');
const { Drivers, Plans, PlanLocations, Orders} = require('../models');
const { timeZoneDiff } = require('../config');
const { IRP } = require("../services/MRP/index");

module.exports = {
    updateWorkingStatus: async (req, res, next) => {
    try {
      const { driverId, planId } = req.params;

      try {
        const driver = await Drivers.findById(driverId);
        if (!driver) throw new Error('Not found driver');

        const plan = await Plans.findById(planId);
        if (!plan) throw new Error('Not found plan id '+ planId);
        
        await Plans.update({
            status: "WORKING"
        }, {
          where: {
            id: planId,
            driverId: driverId
          },
        });

        let ordersInPlan = await PlanLocations.findAll({
            where: {
                planId: planId
            }
        });
        ordersInplan = _.orderBy(ordersInPlan, ['collectingTime'], ['ASC']);
        let checkGroupOne = false;
        let checkGroupTwo = false;
        let samePlaceGroupOne = [];
        let samePlaceGroupTwo = [];

        let selectedOrder = ordersInPlan[0];
        let i = 0;
        let j = 0;
        while(ordersInplan.length !== i && checkGroupOne === false){
          if(selectedOrder.placeId === ordersInPlan[i].placeId && checkGroupOne === false){
            samePlaceGroupOne.push(ordersInPlan[i].orderId);
          }else{
            checkGroupOne = true;
            j = i;
          }
          i++;
        }
        selectedOrder = ordersInPlan[j];

        while(ordersInplan.length !== j && checkGroupTwo === false){
          if(selectedOrder.placeId === ordersInPlan[j].placeId && checkGroupTwo === false){
            samePlaceGroupTwo.push(ordersInPlan[j].orderId);
          }else{
            checkGroupTwo = true;
          }
          j++;
        }
        const lockOrders = [...samePlaceGroupOne, ...samePlaceGroupTwo];
        await Orders.update({
                status: 3
            },{
                where: {
                    id: {[Op.in]: lockOrders}
                }
            }
        );

        res.json({
          ok: true,
          data: {
            message: "successfully locked the order id: " + lockOrders,
          },
        });
      } catch (err) {
        next(err);
      }
    } catch (err) {
      next(err);
    }
  },
  refreshmentIRP: async (req, res, next) => {
    try{
      const { orderId } = req.params;
      const irp = new IRP();
      await irp.IRPRefreshmentAdjustment(orderId);

      res.status(200).json({
        status: 200,
        data: {
          orderId: orderId
        },
        message: 'refreshing IRP...',
      });
    }catch (err) {
      next(err);
    }
  }
};
