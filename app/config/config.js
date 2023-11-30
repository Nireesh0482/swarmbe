require('dotenv').config();

const config = {
  db: {
    databasePort: process.env.DB_PORT.toString(),
    databaseHost: process.env.DB_HOST.toString(),
    databaseUserName: process.env.DB_USER.toString(),
    databasePassword: process.env.DB_PASSWORD.toString(),
    databaseDialect: process.env.DB_DIALECT.toString(),
    databaseName: process.env.DB_DATABASE.toString(),
  },
  port: process.env.PORT,
  salt: process.env.SALT ?? 10,
  toolEmail: process.env.AUDIT_EMAIL.toString(),
  nodeEnvironment: process.env.NODE_ENV.toString(),
  toolPassword: process.env.AUDIT_PASSWORD.toString(),
  accessTokenKey: process.env.ACCESS_TOKEN.toString(),
  refreshTokenKey: process.env.REFRESH_TOKEN.toString(),
  emailMethod: process.env.EMAIL_FUNCTIONALITY.toString(),
  sendGridAPIkey: process.env.SEND_GRID_KEY.toString(),
  resetSecret: process.env.RESET_SECRET.toString(),
  secret: process.env.SECRET.toString(),
  auditToolClientURL: process.env.AUDIT_CLIENT_URL.toString(),
  promToolClientURL: process.env.PROM_CLIENT_URL.toString(),
  auditToolVersion: process.env.AUDIT_TOOL_VERSION.toString(),
  promToolVersion: process.env.PROM_TOOL_VERSION.toString(),
};

module.exports = config;
