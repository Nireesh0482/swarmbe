const express = require('express');

const promRouter = express.Router();
const jwtService = require('../../helpers/JWT');

const promUserRoute = require('./promUserRoute');
const promUserRoles = require('./promRolesRoute');
const promResourceAllocation = require('./promResouceAllocationRoute');
const resourceMgmtRoute = require('./resourceManagementRoute');
const projRoute = require('./projectDataRoute');
const claimRoute = require('./claimsRoute');
const promReports = require('./promReports');
const revenueRoute = require('./revenueRoute');
const avgEnggCostRoute = require('./averageEnggCostRoute');
const AOPRoute = require('./organizationGroupMgmtRoute');
const maternityRoute = require('./promMaternityRoute');
const resourceSkill = require('./resourceSkillDetailsRoute');
const resourcePreviousCompany = require('./resourcePreviousExpDetailsRoute');

promRouter.use('/resourceAllocation', promResourceAllocation);
promRouter.use('/promUser', promUserRoute);
promRouter.use('/roles', promUserRoles);
promRouter.use('/promReports', promReports);
promRouter.use('/resourceManagement', resourceMgmtRoute);
promRouter.use('/projectManagement', projRoute);
promRouter.use('/claims', claimRoute);
promRouter.use('/token', jwtService.verifyAccessToken);
promRouter.use('/refreshToken', jwtService.generateTokens);
promRouter.use('/logout', jwtService.logoutUser);
promRouter.use('/revenue', revenueRoute);
promRouter.use('/avgEnggCost', avgEnggCostRoute);
promRouter.use('/orgGRPAOP', AOPRoute);
promRouter.use('/maternity', maternityRoute);
promRouter.use('/resourceSkill', resourceSkill);
promRouter.use('/resourcePreviousExp', resourcePreviousCompany);

promRouter.use((req, res, next) => {
  const error = new Error('Not Found || No route');
  error.status = 404;
  next(error);
});

promRouter.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({ error: { message: error.message } });
});

module.exports = promRouter;
