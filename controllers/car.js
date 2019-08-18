const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const {
  Cars,
  Types,
} = require('../models');

const get = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    const where = {};
    if (id) where.carID = id;
    if (type) where.typeID = type;
    const cars = await Cars.findAll({
      where,
      include: [
        { model: Types },
      ],
    });

    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        total: cars.length,
        cars,
      },
    });
  } catch (err) {
    next(err);
  }
};

const post = async (req, res, next) => {
  try {
    const data = req.body;
    if (req.file) {
      data.image = req.file.filename;
    }
    const car = await Cars.create(data);
    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        car,
      },
    });
  } catch (err) {
    if (req.file) fs.unlink(path.join(__dirname, `../public/img/cars/${req.file.filename}`), () => {});
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const car = await Cars.findById(id);
    if (_.isEmpty(car)) throw new Error(`Don't have carID : ${id}`);
    if (req.file) {
      fs.unlink(path.join(__dirname, `../${car.image}`), () => {});
      data.image = req.file.filename;
    }
    await car.update(data);
    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        car,
      },
    });
  } catch (err) {
    if (req.file) fs.unlink(path.join(__dirname, `../public/img/cars/${req.file.filename}`), () => {});
    next(err);
  }
};

const del = async (req, res, next) => {
  try {
    const { id } = req.params;

    const car = await Cars.findById(id);
    if (_.isEmpty(car)) throw new Error(`Don't have carID : ${id}`);
    await fs.unlink(path.join(__dirname, `../${car.image}`), () => {});
    await car.destroy();

    res.json({
      ok: true,
      message: `${req.method} ${req.path} SUCCESS`,
      data: {
        car,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  get,
  post,
  update,
  del,
};
