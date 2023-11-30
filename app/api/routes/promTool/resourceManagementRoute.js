const express = require('express');

const router = express.Router();
const resourceMgmtController = require('../../controllers/promTool/resourceManagementController');
const {
  promToolSaveResourceDataValidation,
  promToolSalaryRevisionSaveValidation,
} = require('../../middleware/validation');
const jwtService = require('../../helpers/JWT');
const { checkPromUserPermissionForAPI } = require('../../middleware/userRoleAuth');

router.get('/getAllJoinedAsDetails', resourceMgmtController.getAllJoinedAsDetails);

router.get('/getAllResourceStatus', resourceMgmtController.getAllResourceStatusDetails);

router.get('/getAllSkills', resourceMgmtController.getAllSkillDetails);

router.get('/getAllStreams', resourceMgmtController.getAllStreamDetails);

router.get('/getAllLocation', resourceMgmtController.getAllLocationDeatils);

router.get('/getAllDesignation', resourceMgmtController.getAllDesignationDetails);

router.post(
  '/saveUpdateResourceData',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(201),
  promToolSaveResourceDataValidation,
  resourceMgmtController.saveUpdateResourceData,
);

router.get('/getSupervisorDetails', resourceMgmtController.getSupervisorDetailsFromDb);

router.get('/getAllResources', resourceMgmtController.getAllResources);
router.get('/getResourceById', resourceMgmtController.getResourceById);

router.post(
  '/saveResourceData',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(201),
  promToolSaveResourceDataValidation,
  resourceMgmtController.insertResourceData,
);

router.put(
  '/deleteResource',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(201),
  resourceMgmtController.deleteResource,
);

router.post(
  '/verifyEmployeeExistenceInDb',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(201),
  promToolSaveResourceDataValidation,
  resourceMgmtController.verifyEmployeeAndSendTheirDetails,
);

router.post(
  '/saveSalaryRevision',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(204),
  promToolSalaryRevisionSaveValidation,
  resourceMgmtController.saveSalaryRevisionForEmployees,
);

router.put(
  '/updateSalaryForEmployees',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(204),
  resourceMgmtController.updateSalaryForEmployeeFromRevision,
);

router
  .route('/getSalaryRevisionDetails')
  .get(resourceMgmtController.getSalaryRevisionDetailsFromDatabase)
  .post(
    jwtService.verifyAccessToken,
    checkPromUserPermissionForAPI(204),
    resourceMgmtController.getSalaryRevisionDetailsFromDatabase,
  );

router.post(
  '/updateSalaryRevisionDetails',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(204),
  resourceMgmtController.updateSalaryRevisionDetailsInRevisionTable,
);

router.get('/getUniqueEmpForSalaryRevision', resourceMgmtController.getUserDetailsFromSalaryRevisionTable);

module.exports = router;
