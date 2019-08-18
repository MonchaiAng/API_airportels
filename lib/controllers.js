const _ = require('lodash');

const mysqlDB = require('./mysqlDB');

exports.defaultMySql = async (req, res, next) => {
  const name = _.split(req.url, '/')[1];
  const { id } = req.params;
  const tableName = `${name}`;
  const tableID = `${_.trimEnd(name, 's')}ID`;
  try {
    let results = {};
    switch (req.method) {
      case 'GET':
        if (id) {
          results = await mysqlDB.query(`SELECT * FROM ${tableName} WHERE ${tableID} = ${id}`);
          if (_.isEmpty(results)) throw new Error(`Can't find ${tableID}: ${id}`);
        } else {
          const { limit } = req.query;
          const sql = `SELECT *
                        FROM ${tableName}
                        WHERE 1
                        ${limit ? `LIMIT ${limit}` : ''}`;
          results = await mysqlDB.query(sql);
        }
        break;
      case 'POST':
        results = await mysqlDB.insert(tableName, req.body);
        break;
      case 'PUT':
        results = await mysqlDB.update(tableName, req.body, tableID, id);
        break;
      case 'PATCH':
        results = await mysqlDB.update(tableName, req.body, tableID, id);
        break;
      case 'DELETE':
        results = await mysqlDB.del(tableName, tableID, id);
        break;
      default:
        break;
    }
    res.json({
      ok: true,
      message: `${req.method} ${name} ${!_.isEmpty(id) ? id : ''} Success`,
      data: {
        results,
      },
    });
  } catch (err) {
    next(err);
  }
};
