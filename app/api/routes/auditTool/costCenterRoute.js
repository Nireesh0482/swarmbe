const express = require('express');

const router = express.Router();
const jwtService = require('../../helpers/JWT');
const { checkAuditUserPermissionForAPI } = require('../../middleware/userRoleAuth');
const { auditToolCostCenterValidation } = require('../../middleware/validation');
const costCenterController = require('../../controllers/auditTool/costCenterController');

router.post(
  '/saveCostCenterData',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(109),
  auditToolCostCenterValidation,
  costCenterController.costCenterExcelToDatabase,
); // saving costCenter data

router.get('/allCostCenters', costCenterController.getCostCenters); // get all costCenters list

router.post(
  '/getCostCenterByCode',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(109),
  costCenterController.getCostCenterByCode,
); // get costCenter details based on name

module.exports = router;
