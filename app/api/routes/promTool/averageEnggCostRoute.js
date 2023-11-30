const express = require('express');

const router = express.Router();
const avgEnggCostController = require('../../controllers/promTool/averageEnggCostController');
const jwtService = require('../../helpers/JWT');
const { promToolAverageEngineeringCostValidation } = require('../../middleware/validation');
const { checkPromUserPermissionForAPI } = require('../../middleware/userRoleAuth');

router.post(
  '/saveEnggCostData',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(212),
  promToolAverageEngineeringCostValidation,
  avgEnggCostController.insertEnggCostData,
);
router.get('/getAllEnggCost', avgEnggCostController.getAllEnggCost);
router.get('/getEnggCostById', avgEnggCostController.getEnggCostById);
router.put(
  '/updateEnggCost',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(212),
  promToolAverageEngineeringCostValidation,
  avgEnggCostController.updateEnggCost,
);

module.exports = router;
