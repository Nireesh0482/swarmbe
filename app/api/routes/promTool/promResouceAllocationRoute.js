const express = require('express');

const router = express.Router();
const promResourceAllocationController = require('../../controllers/promTool/promResourceAllocationController');
const jwtService = require('../../helpers/JWT');
const {
  promToolSaveResourcePlanningValidation,
  promToolResourceAllocationValidation,
  promToolUpdateResourcePlanningValidation,
} = require('../../middleware/validation');
const { checkPromUserPermissionForAPI } = require('../../middleware/userRoleAuth');

const {
  checkPartialOrUnallocatedEmployeeAndSendMail,
  moveUnAllocatedEmployeesToBufferProject,
  getBufferProjectEmployeeAndSendMailToManagers,
} = require('../../cronJobs/scheduleTask');

router.get('/getPromAllocationDetails', promResourceAllocationController.getAllocationDetails);

router.post(
  '/getResourceByProjectId',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(209),
  promResourceAllocationController.getAllocationDetailsByProjectID,
);

router.post(
  '/updateAllocationResource',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(209),
  promToolResourceAllocationValidation,
  promResourceAllocationController.updatedAllocationResourceDetails,
);

router.post(
  '/addProjectResourcePlan',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(208),
  promToolSaveResourcePlanningValidation,
  promResourceAllocationController.addProjectResourcePlanDetails,
);

router.put(
  '/updateProjectResourcePlan',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(208),
  promToolUpdateResourcePlanningValidation,
  promResourceAllocationController.updateProjectResourcePlanDetails,
);

router.post(
  '/getAllProjectResourcePlan',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(208),
  promResourceAllocationController.getAllProjectResourcePlanDetails,
);

router.delete(
  '/deleteResourceAllocation',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(209),
  promResourceAllocationController.deleteResourceAllocationDetails,
);

// for developers only
// cronJob Testing API
router.post('/cron25FetchUnallocatedAndPartialAllocationEmp', checkPartialOrUnallocatedEmployeeAndSendMail);
router.post('/cron28MoveEmployeeToGroupBuffer', moveUnAllocatedEmployeesToBufferProject); // cronJob Testing API
router.post('/cron28getBufferEmployee', getBufferProjectEmployeeAndSendMailToManagers); // cronJob Testing API

module.exports = router;
