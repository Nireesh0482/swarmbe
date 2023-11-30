const express = require('express');

const router = express.Router();
const projController = require('../../controllers/promTool/projectDataController');
const jwtService = require('../../helpers/JWT');
const { promToolSaveProjectDataValidation } = require('../../middleware/validation');
const { checkPromUserPermissionForAPI } = require('../../middleware/userRoleAuth');

router.get('/getAllProjectGroupNames', projController.getAllProjGroupDetails);

router.get('/getAllProjStatus', projController.getAllProjStatusDetails);

router.get('/getAllProjTypes', projController.getAllProjTypesDetails);

router.post(
  '/saveUpdateProjectData',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(208),
  promToolSaveProjectDataValidation,
  projController.saveUpdateProjectData,
);

router.get('/getAllProjects', projController.getAllProjects);

router.get('/getAllProjectWithEmp', projController.getAllProjectsWithTheirAssociatedEmployee);

router.get('/getProjectById', projController.getProjectById);

router.post(
  '/saveProjectData',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(208),
  promToolSaveProjectDataValidation,
  projController.insertProjectData,
);

router.put(
  '/deleteProject',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(208),
  projController.deleteProject,
);

module.exports = router;
