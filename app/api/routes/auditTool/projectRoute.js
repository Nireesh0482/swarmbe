const express = require('express');

const router = express.Router();
const { auditToolSaveProjectDataValidation } = require('../../middleware/validation');
const jwtService = require('../../helpers/JWT');
const { checkAuditUserPermissionForAPI } = require('../../middleware/userRoleAuth');
const projectController = require('../../controllers/auditTool/projectController');

router.post(
  '/saveProjectData',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(102),
  auditToolSaveProjectDataValidation,
  projectController.projectExcelToDatabase,
); // saving project data

router.get('/allProjects', projectController.getProjects); // get all projects list

router.post(
  '/projectDeleteDetails',
  jwtService.verifyAccessToken,
  checkAuditUserPermissionForAPI(102),
  projectController.deleteProject,
);

module.exports = router;
