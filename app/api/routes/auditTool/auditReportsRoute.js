const express = require('express');

const router = express.Router();
const auditReportsController = require('../../controllers/auditTool/auditReportsController');
// const jwtService = require('../../helpers/JWT');
// const { checkAuditUserPermissionForAPI } = require('../../middleware/userRoleAuth');

router.get(
  '/allReports',
  // jwtService.verifyAccessToken,
  // checkAuditUserPermissionForAPI(105),
  auditReportsController.getAuditReportByProject,
);

module.exports = router;
