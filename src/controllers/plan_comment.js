const _ = require('lodash');
const { Op } = require('sequelize');

const { Plans, Users, PlanComments, Roles } = require('../models');

module.exports = {
  get: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { query } = req;
      let where = {};
      let plans = [];

      if (query.date) {
        const dateSelected = query.date;
        const dateStart = `${dateSelected} 00:00:01`;
        const dateEnd = `${dateSelected} 23:59:59`;

        const allPlans = await Plans.findAll({
          attributes: ['id'],
          where: {
            createdAt: {
              [Op.gt]: dateStart,
              [Op.lt]: dateEnd,
            },
          },
        });

        plans = allPlans.map(plan => plan.id);

        where = {
          planId: {
            [Op.in]: plans,
          },
        };
      } else {
        where = { id };
      }

      const planComments = await PlanComments.findAll({
        attributes: ['id', 'planId', 'comment', 'createdAt', 'updatedAt'],
        include: [
          {
            attributes: ['id', 'firstname', 'lastname'],
            model: Users,
            as: 'createBy',
            include: [{ model: Roles, attributes: ['name'] }],
          },
          {
            attributes: ['id', 'firstname', 'lastname'],
            model: Users,
            as: 'updateBy',
            include: [{ model: Roles, attributes: ['name'] }],
          },
        ],
        where,
      });

      res.json({
        ok: true,
        data: {
          planComments,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  post: async (req, res, next) => {
    try {
      const data = req.body;
      const { user } = req;

      data.createdBy = user.id;
      data.updatedBy = user.id;

      const plan = await Plans.findById(data.planId);

      if (!plan) throw new Error('This plan is not exist.');

      const numberOfPlanId = await PlanComments.count({
        where: {
          planId: data.planId,
        },
      });

      if (numberOfPlanId >= 1) throw new Error('This plan already have a comment.');

      const planComment = await PlanComments.create(data);

      res.json({
        ok: true,
        data: {
          planComment,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { user } = req;
      const data = req.body;
      data.updatedBy = user.id;
      const planComment = await PlanComments.findById(id);
      if (!planComment) throw new Error('This comment is not exist');

      const plan = await Plans.findById(planComment.planId);
      if (!plan) throw new Error('This plan is not exitst.');

      await planComment.update(data);

      res.json({
        ok: true,
        data: {
          planComment,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      const planComment = await PlanComments.findById(id);
      if (!planComment) throw new Error('This comment is not exist.');

      await planComment.destroy();

      res.json({
        ok: true,
        message: 'Delete successfully.',
      });
    } catch (err) {
      next(err);
    }
  },
};
