const express = require('express');

const router = express.Router();
const AOPController = require('../../controllers/promTool/organizationGroupMgmtController');
const jwtService = require('../../helpers/JWT');
const {
  promToolSaveAOPValidation,
  promToolSaveGroupValidation,
  promToolUpdateGroupValidation,
} = require('../../middleware/validation');
const { checkPromUserPermissionForAPI } = require('../../middleware/userRoleAuth');

router.post(
  '/saveGRPAOPData',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(206),
  promToolSaveAOPValidation,
  AOPController.insertMgmtGRPAOPData,
);

router.post('/getAllGRPAOP', AOPController.getAllProjGroupDetails);

router.post(
  '/saveOrgGroupDetails',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(205),
  promToolSaveGroupValidation,
  AOPController.insertOrganizationGroupDetails,
);

router.put(
  '/updateOrgGroupDetails',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(205),
  promToolUpdateGroupValidation,
  AOPController.updateGroupDetailsController,
);

router.post('/getMgmtGRPAOPByName', AOPController.getAllGRPAOPDataByGRPName);

router.put(
  '/updateOrgGRPAOP',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(206),
  promToolSaveAOPValidation,
  AOPController.updateAOPData,
);

module.exports = router;
