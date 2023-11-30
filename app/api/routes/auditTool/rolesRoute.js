const express = require('express');

const router = express.Router();
const middleware = require('../../middleware/validation');
const roleController = require('../../controllers/auditTool/roleController');
const jwtService = require('../../helpers/JWT');
const { checkAuditUserPermissionForAPI } = require('../../middleware/userRoleAuth');

router.get('/getRoles', roleController.getAllEmployeeWithRoles);
router.get('/roleGroups', roleController.getRolesGroupsAndFeatureAccess);
router.get('/featuresAndAccess', roleController.getFeaturesAndAccessLevel);
router.post(
  '/createRoles',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(104),
  middleware.roleValidation,
  roleController.createRolesWithFeatures,
);
router.post(
  '/updateRoles',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(104),
  middleware.roleValidation,
  roleController.updateRolesWithFeature,
);
router.delete(
  '/deleteRoles',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(104),
  middleware.deleteRoleValidation,
  roleController.deleteRoleAndValues,
);
router.post(
  '/addRolesToUser',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(103),
  roleController.assignRolesToUser,
);

router.get('/rolesWithFeatureAndUserInfo', roleController.getRolesGroupsWithFeatureAndTheirUserInfo);

module.exports = router;
