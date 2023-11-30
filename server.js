/* eslint-disable node/no-unpublished-require */
/* eslint-disable import/no-extraneous-dependencies */
require('dotenv').config();
const express = require('express');

const app = express();

const cors = require('cors');
const expressPinoLogger = require('express-pino-logger');
const cookieParser = require('cookie-parser');

const {
  port,
  db: { databaseName },
  nodeEnvironment,
} = require('./app/config/config');

const logger = require('./app/api/utils/logger');
const routes = require('./app/api/routes');
const sequelize = require('./app/config/db.config');
const models = require('./app/api/models');

const { runAllCronTasks } = require('./app/api/cronJobs/scheduleTask');

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

const loggerMiddleware = expressPinoLogger({
  logger,
  autoLogging: false,
});

app.use(loggerMiddleware);

app.use(
  cors({
    credentials: true,
    origin: [
      'http://192.168.1.112:3200',
      'http://localhost:8088',
      'http://192.168.1.112:5100',
      'http://localhost:4000',
      'http://localhost:3001',

    ],
  }),
);

app.use('/', routes);

sequelize
  .authenticate()
  .then(async () => {
    const synchronize = await models.sequelize.sync({}); // synchronize tables after successful connection
    if (synchronize) {
      logger.info(`connection to ${databaseName} database has been established successfully.`);
      await runAllCronTasks(); // start all cron task for all tools
      if (process.send) {
        process.send('ready');
      }
    }
  })
  .catch((error) => {
    logger.fatal(`Unable to connect to the database: ${databaseName}`);
    logger.error(error);
  });

app.listen(port, () => {
  logger.info(`App running on port ${port}.[${nodeEnvironment} mode]`);
});
