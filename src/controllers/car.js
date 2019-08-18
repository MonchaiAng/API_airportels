const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const { Cars, Users, Companies, Roles, Drivers } = require('../models');

module.exports = {
  get: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { query } = req;
      const where = {};

      if (query.isActive) {
        if (query.isActive == 1) {
          where.isActive = true;
        } else {
          where.isActive = false;
        }
      } else {
        if (id) where.id = id;
      }

      const cars = await Cars.findAll({
        attributes: [
          'id',
          'image',
          'carLicensePlate',
          'brand',
          'model',
          'engine',
          'carCapacity',
          'createdAt',
          'updatedAt',
        ],
        include: [
          {
            attributes: ['name'],
            model: Companies,
          },
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
          cars,
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
      if (req.file) {
        data.image = req.file.filename;
      }
      data.createdBy = user.id;
      data.updatedBy = user.id;

      const companyId = await Companies.findById(data.companyId);
      if (!companyId) throw new Error('Not found company');

      const car = await Cars.create(data);

      res.json({
        ok: true,
        data: {
          car,
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

      const car = await Cars.findById(id);
      if (!car) throw new Error('Not found this car');

      if (req.file) {
        if (car.image !== 'default.jpg') {
          fs.unlink(path.join(__dirname, `../../public/img/cars/${car.image}`), () => {});
        }
        data.image = req.file.filename;
      }

      const companyId = await Companies.findById(data.companyId);
      if (!companyId) throw new Error('Not found company');

      await car.update(data);

      res.json({
        ok: true,
        data: {
          car,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  image: async (req, res, next) => {
    try {
      if (!fs.existsSync(path.join(__dirname, `../../public/img/cars/${req.params.name}`))) {
        res.status(200).sendFile(path.join(__dirname, '../../public/img/cars/default.jpg'));
      } else {
        res.status(200).sendFile(path.join(__dirname, `../../public/img/cars/${req.params.name}`));
      }
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      const car = await Cars.findById(id);
      if (!car) throw new Error('Not found this car');

      const numberOfDriverBelongToCar = await Drivers.count({
        where: {
          carId: id,
        },
      });

      if (numberOfDriverBelongToCar !== 0) throw new Error('This car is used by drivers.');

      await car.destroy();

      fs.unlink(path.join(__dirname, `../../public/img/cars/${car.image}`), () => {});

      res.json({
        ok: true,
        message: 'Delete successfully.',
      });
    } catch (err) {
      next(err);
    }
  },
};
