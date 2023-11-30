/* eslint-disable object-curly-newline */
const { Sequelize } = require('sequelize');
const {
  db: { databaseDialect, databaseName, databaseHost, databasePassword, databasePort, databaseUserName },
} = require('./config');
// const logger = require('../api/middleware/logger');

const sequelize = new Sequelize(databaseName, databaseUserName, databasePassword, {
  host: databaseHost, // D-0036
  port: databasePort,
  dialect: databaseDialect,
  logging: false, // (msg) => logger.debug(msg),
  dialectOptions: { prependSearchPath: true, useUTC: false },
  timezone: '+05:30',
});

module.exports = sequelize;
