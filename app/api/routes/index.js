const express = require('express');

const mainRouter = express.Router();

const auditToolRouter = require('./auditTool/routes');
const promToolRouter = require('./promTool/routes');

mainRouter.use('/auditTool', auditToolRouter);
mainRouter.use('/promTool', promToolRouter);

mainRouter.use((req, res, next) => {
  const error = new Error('Not Found || No route');
  error.status = 404;
  next(error);
});
// eslint-disable-next-line no-unused-vars
mainRouter.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({ error: { message: error.message } });
});
module.exports = mainRouter;
