const express = require('express');

const userRoute = require('./userRoute'); // login
const employeeRoute = require('./employeeRoute'); // project Details route
const checkListRoute = require('./checkListRoute'); // checklist details
const roles = require('./rolesRoute');
const projectRoute = require('./projectRoute'); // project Details route
const auditRoute = require('./auditDetailsRoute'); // audit details route
const auditReports = require('./auditReportsRoute');
const costCenter = require('./costCenterRoute');

const auditRouter = express.Router();

const jwtService = require('../../helpers/JWT');

auditRouter.use('/user', userRoute); // user details

auditRouter.use('/checklist', checkListRoute); // saving checklist data

auditRouter.use('/employeeData', employeeRoute); // saving employee data

auditRouter.use('/projectData', projectRoute); // project details

auditRouter.use('/roles', roles);

auditRouter.use('/audit', auditRoute); // audit details route

auditRouter.use('/reports', auditReports);

auditRouter.use('/token', jwtService.verifyAccessToken); // For development

auditRouter.use('/refreshToken', jwtService.generateTokens);

auditRouter.use('/logout', jwtService.logoutUser);

auditRouter.use('/costCenter', costCenter);

auditRouter.use((req, res, next) => {
  const error = new Error('Not Found || No route');
  error.status = 404;
  next(error);
});

// eslint-disable-next-line no-unused-vars
auditRouter.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({ error: { message: error.message } });
});

module.exports = auditRouter;
