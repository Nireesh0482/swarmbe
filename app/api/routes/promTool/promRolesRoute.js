const express = require('express');

const router = express.Router();
const middleware = require('../../middleware/validation');
const roleController = require('../../controllers/promTool/promRoleController');
const jwtService = require('../../helpers/JWT');
const { checkPromUserPermissionForAPI } = require('../../middleware/userRoleAuth');

router.get('/getRoles', roleController.getAllEmployeeWithRoles);

router.get('/roleGroups', roleController.getRolesGroupsAndFeatureAccess);

router.get('/featuresAndAccess', roleController.getFeaturesAndAccessLevel);

router.post(
  '/createRoles',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(203),
  roleController.createRolesWithFeatures,
);

router.put(
  '/updateRoles',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(203),
  middleware.roleValidation,
  roleController.updateRolesWithFeature,
);

router.delete(
  '/deleteRoles',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(203),
  middleware.deleteRoleValidation,
  roleController.deleteRoleAndValues,
);

router.post(
  '/addRolesToUser',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(202),
  roleController.assignUserToTheRole,
);

router.get('/rolesWithFeatureAndUserInfo', roleController.getRolesGroupsWithFeatureAndTheirUserInfo);

module.exports = router;
