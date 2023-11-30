const express = require('express');

const router = express.Router();

const promReportsController = require('../../controllers/promTool/promReportsController');
const jwtService = require('../../helpers/JWT');
const { checkPromUserPermissionForAPI } = require('../../middleware/userRoleAuth');

router.post(
  '/highLevelResourceUtilization',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(214),
  promReportsController.getResourceUtilizationHighLevelProject,
);

router.post(
  '/getAllocationByProjResource',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(214),
  promReportsController.getHighLevelProjByResource,
);

router.post(
  '/getAllocationByProjResourceDetailedLevel',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(215),
  promReportsController.getHighLevelProjByResource,
);

router.post(
  '/costUtilizationDetailedLevel',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(217),
  promReportsController.costUtilizationProjectDetailedLevel,
);

router.post(
  '/costUtilizationHighLevel',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(216),
  promReportsController.costUtilizationProjectHighLevel,
);

router.post(
  '/getProjectRevenue',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(220),
  promReportsController.getProjectRevenue,
);

router.post(
  '/getResourceCostUtilization',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(218),
  promReportsController.getResourceCostUtilization,
);

router.post(
  '/getProjectContribution',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(222),
  promReportsController.getProjectContribution,
);

router.post(
  '/getGroupContribution',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(221),
  promReportsController.getProjectContribution,
);

router.post(
  '/getClaimReports',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(224),
  promReportsController.getClaimsByStatus,
);

router.post(
  '/getGenericReports',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(225),
  promReportsController.genericReports,
);

router.post(
  '/getResourceAOPReports',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(226),
  promReportsController.getGroupResourceAOPReports,
);

router.post(
  '/getGRPRevenueReports',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(219),
  promReportsController.getGRPRevenue,
);

router.post(
  '/getGRPCostAndRevenueContributionReports',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(223),
  promReportsController.getCostAndRevenueContributionReports,
);

router.post(
  '/resourceUtilizationCount',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(214),
  promReportsController.getResourceUtilizationCountByProjectGroup,
);

router.post(
  '/avgEnggCostReports',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(227),
  promReportsController.getAvgEnggCostReports,
);

module.exports = router;
