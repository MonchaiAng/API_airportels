// const moment = require('moment');
const _ = require('lodash');
const mysql = require('mysql2/promise');
const { mysqlConfig } = require('../config');

const rulesTypeChecker = (mysqlColumns, data) => {
  mysqlColumns.forEach((col) => {
    const mysqlType = _.split(col.Type, '(')[0];
    const length = +(_.split(_.split(col.Type, '(')[1], ')')[0]);
    const value = data[col.Field];
    const dataType = typeof data[col.Field];
    if (col.Extra !== 'auto_increment' && mysqlType !== 'timestamp') {
      if (!value && value !== 0) {
        throw new Error(`Please Request ${col.Field} should be ${col.Type}`);
      } else if (value.toString().length > length && length !== 0) {
        throw new Error(`${col.Field} is over length shoude be ${length}`);
      } else if ((mysqlType === 'varchar' || mysqlType === 'text') && dataType !== 'string') {
        throw new Error(`${col.Field} is ${dataType} should be string`);
      } else if (mysqlType === 'set' && col.Type.search(value) === -1) {
        throw new Error(`${col.Field} is ${value} should be ${col.Type}`);
      }
      // else if ((mysqlType === 'int' || mysqlType === 'tinyint') && dataType !== 'number') {
      //   throw new Error(`${col.Field} is ${typeof value} should be int`);
      // }
    }
  });
};

const query = async (sql = '') => {
  if (_.isEmpty(sql)) throw new Error(`Please Request of ${sql}`);
  const connection = await mysql.createConnection(mysqlConfig);
  const [results] = await connection.execute(sql);
  await connection.end();
  return results;
};

const insert = async (table = '', rawDatas) => {
  if (_.isEmpty(rawDatas)) throw new Error(`Please Request data of ${table}`);
  const datas = _.isArray(rawDatas) ? rawDatas : [rawDatas];
  const connection = await mysql.createConnection(mysqlConfig);
  const [result] = await connection.execute(`SHOW COLUMNS FROM ${table}`);
  const tableKeys = result.map(value => value.Field);
  const ripeDatas = _.map(datas, (data) => {
    rulesTypeChecker(result, data);
    return _.pick(data, tableKeys);
  });
  const values = ripeDatas.map(data => `('${_.values(data).join("','")}')`);
  const sql = `INSERT INTO ${table} (${_.keys(ripeDatas[0]).join()})
                VALUES ${_.values(values).join()}`;
  const [results] = await connection.execute(sql);
  await connection.end();
  return results;
};

const update = async (table = '', data = {}, at = '', id = '') => {
  if (!id) throw new Error(`Please Request params ${at}`);
  const connection = await mysql.createConnection(mysqlConfig);
  const [result] = await connection.execute(`SHOW COLUMNS FROM ${table}`);
  const tableKeys = result.map(value => value.Field);
  const ripeData = _.pick(data, tableKeys);
  if (_.isEmpty(ripeData)) throw new Error(`Please Request ${tableKeys}`);
  const set = _.map(ripeData, (value, key) => `${key}='${value}'`);
  const sql = `UPDATE ${table} SET ${set} WHERE ${at} = ${id}`;
  const [results] = await connection.execute(sql);
  await connection.end();
  if (results.affectedRows === 0) throw new Error(`UPDATE Fail can't find ${at}: ${id}`);
  return results;
};

const del = async (table = '', at = '', id = '') => {
  if (!id) throw new Error(`Please Request params ${at}`);
  const connection = await mysql.createConnection(mysqlConfig);
  let where = `${at} = ${id}`;
  if (_.isArray(id)) where = `${at} IN (${id.join()})`;
  const [results] = await connection.execute(`DELETE FROM ${table} WHERE ${where}`);
  await connection.end();
  if (results.affectedRows === 0) throw new Error(`DELETE Fail can't find ${at}: ${id}`);
  return results;
};

module.exports = {
  query,
  insert,
  update,
  del,
  rulesTypeChecker,
};
