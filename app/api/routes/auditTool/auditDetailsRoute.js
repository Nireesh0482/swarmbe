const express = require('express');

const router = express.Router();

const auditController = require('../../controllers/auditTool/auditController');
const jwtService = require('../../helpers/JWT');
const { checkAuditUserPermissionForAPI } = require('../../middleware/userRoleAuth');
const { checkNonClosedAuditAndSendMail } = require('../../cronJobs/scheduleTask');
const { auditToolNonClosedAuditBodyValidation } = require('../../middleware/validation');

// save master audit details,team audit details and generate audit report

router.post(
  '/saveMasterAudit',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(107),
  auditController.saveAuditReport,
);

router.put(
  '/updateMasterAudit',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(107),
  auditController.updateAuditReport,
);

router.post(
  '/sendDraft',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(107),
  auditController.auditSendDraft,
);

router.get('/allAudits', auditController.getAllAudits); // get all audits

router.post(
  '/auditData',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(107),
  auditController.getAuditDetails,
);

router.get('/auditStatus', auditController.getAuditStatus);

router.put(
  '/deleteTeamMember',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(107),
  auditController.deleteAuditTeamMembers,
);

router.post(
  '/getAuditByProject',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(107),
  auditController.getAuditsByProject,
);

// for Development only
router.post('/checkNonClosedAudits', checkNonClosedAuditAndSendMail);

router.post(
  '/getAuditByProjectForDashboard',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(105),
  auditController.getAuditsByProject,
);

router.post(
  '/getAuditByProjectForReport',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(108),
  auditController.getAuditsByProject,
);

router.post(
  '/auditDataForReport',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(108),
  auditController.getAuditDetails,
);

router.post(
  '/auditDataForDashboard',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(105),
  auditController.getAuditDetails,
);

router.post(
  '/sendCustomNonClosedMail',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(107),
  auditToolNonClosedAuditBodyValidation,
  auditController.sendCustomMailForNonClosedAudit,
);

module.exports = router;
