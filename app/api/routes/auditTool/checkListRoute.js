const express = require('express');

const router = express.Router();
const checkListController = require('../../controllers/auditTool/checkListController');
const jwtService = require('../../helpers/JWT');
const { checkAuditUserPermissionForAPI } = require('../../middleware/userRoleAuth');

router.post(
  '/saveChecklist',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(106),
  checkListController.saveCheckListToDatabaseWithTable,
);

// get all checklist info
router.get('/allCheckLists', checkListController.getCheckLists);

// get checklist by name
router.post(
  '/checkListData',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(106),
  checkListController.getCheckListByName,
);

// get checklist by name
router.post(
  '/checkListDataForManageAudit',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(107),
  checkListController.getCheckListByName,
);

router.get('/getAllCheckListType', checkListController.getAllCheckListType);

module.exports = router;
