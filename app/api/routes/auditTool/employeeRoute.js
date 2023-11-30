const express = require('express');

const router = express.Router();
const { auditToolSaveEmployeeDataValidation } = require('../../middleware/validation');
const employeeController = require('../../controllers/auditTool/employeeController');
const jwtService = require('../../helpers/JWT');
const { checkAuditUserPermissionForAPI } = require('../../middleware/userRoleAuth');

router.post(
  '/saveEmpDetails',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(101),
  auditToolSaveEmployeeDataValidation,
  employeeController.employeeExcelToDataBase,
); // save employee data

router.get('/getEmpdetails', employeeController.fetchEmployeeDataFromDB); // Save employee data

router.post(
  '/deleteEmployee',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(101),
  employeeController.deleteEmployee,
);

router.get('/employeeRolesList', employeeController.getEmployeeRolesListFromDb);

router.get('/employeeDesignationList', employeeController.getEmployeeDesignationListFromDb);

module.exports = router;
