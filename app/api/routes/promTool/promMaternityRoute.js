const express = require('express');

const router = express.Router();
const promMaternityController = require('../../controllers/promTool/promMaternityController');
const { promToolSaveMaternityDetailsRequestValidation } = require('../../middleware/validation');
const jwtService = require('../../helpers/JWT');
const { checkPromUserPermissionForAPI } = require('../../middleware/userRoleAuth');
const { moveToGroupProjectBufferAfterMaternityEndDate } = require('../../services/promTool/promMaternityService');

router
  .route('/maternityDetails')
  .get(promMaternityController.fetchAllMaternityDetails)
  .post(
    jwtService.verifyAccessToken,
    checkPromUserPermissionForAPI(207),
    promMaternityController.fetchAllMaternityDetails,
  );

router.post(
  '/saveMaternity',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(207),
  promToolSaveMaternityDetailsRequestValidation,
  promMaternityController.saveMaternityDetails,
);

// @todo not using currently
router.put(
  '/updateMaternity',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(207),
  promToolSaveMaternityDetailsRequestValidation,
  promMaternityController.updatedMaternityDetails,
);

// @todo not using currently
router.delete(
  '/deleteMaternity',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(207),
  promMaternityController.deleteMaternityDetails,
);

router.post('/moveMaternityDetailsAfterEndDate', moveToGroupProjectBufferAfterMaternityEndDate);
module.exports = router;
