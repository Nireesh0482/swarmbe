const express = require('express');

const router = express.Router();
const revenueController = require('../../controllers/promTool/revenueController');
const jwtService = require('../../helpers/JWT');
const { promToolSaveRevenueDataValidation } = require('../../middleware/validation');
const { checkPromUserPermissionForAPI } = require('../../middleware/userRoleAuth');

router.post(
  '/saveRevenueData',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(211),
  promToolSaveRevenueDataValidation,
  revenueController.insertRevenueData,
);

router.get('/getAllRevenue', revenueController.getAllRevenue);

router.get('/getRevenueById', revenueController.getRevenueById);

router.put(
  '/updateRevenue',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(211),
  promToolSaveRevenueDataValidation,
  revenueController.updateRevenue,
);

router.post(
  '/getRevenueDetailsByProjectCode',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(211),
  revenueController.getRevenueDetailsByProjectId,
);

module.exports = router;
