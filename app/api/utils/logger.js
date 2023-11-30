const { pino } = require('pino');

const levels = {
  http: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

module.exports = pino({
  customLevels: levels, // our defined levels
  useOnlyCustomLevels: true,
  transport: {
    targets: [
      {
        // pino/file will output to a file using worker thread instead of
        // direct "Destination" which uses Main thread to log data
        target: 'pino/file', // change it to pino/file in production
        level: 'error',
        options: {
          translateTime: 'SYS:standard', // works if pino-pretty is target
          // destination: 'error.log', // save to logger.log in main folder
        },
      },
      {
        target: 'pino-pretty', // Log to console
        colorize: true,
        level: 'info',
        // messageFormat: false,
        options: {
          ignore: 'pid,hostname', // --ignore
          translateTime: 'SYS:standard',
          // destination: 'logger.log', // save to logger.log in main folder
        },
      },
    ],
  },
});
