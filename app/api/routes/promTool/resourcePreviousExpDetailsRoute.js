const express = require('express');

const router = express.Router();
const resourcePreviousExpDetailsController = require('../../controllers/promTool/resourcePreviousExpDetailsController');
const jwtService = require('../../helpers/JWT');
const { promToolSavePreviousExpValidation } = require('../../middleware/validation');
const { checkPromUserPermissionForAPI } = require('../../middleware/userRoleAuth');

router.get('/getAllResourcePreviousExpDetails', resourcePreviousExpDetailsController.getAllResourcePreviousExpDetails);

router.post(
  '/getResourcePreviousExpDetailsById',
  resourcePreviousExpDetailsController.getResourcePreviousExpDetailsById,
);

router.post(
  '/saveResourcePreviousExpDetailsData',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(230),
  promToolSavePreviousExpValidation,
  resourcePreviousExpDetailsController.uploadResourcePreviousExpDetailsData,
);

module.exports = router;
