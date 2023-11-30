const express = require('express');

const router = express.Router();
const claimController = require('../../controllers/promTool/claimsController');
const jwtService = require('../../helpers/JWT');
const { promUploadClaimValidation, promToolSaveClaimValidation } = require('../../middleware/validation');
const { checkPromUserPermissionForAPI } = require('../../middleware/userRoleAuth');

router.post(
  '/saveClaimData',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(213),
  promToolSaveClaimValidation,
  claimController.insertClaimsData, // delete this
);

router.get('/getAllClaim', claimController.getAllClaims);

router.get('/getClaimById', claimController.getClaimsById);

router.get('/getAllExpenseTypes', claimController.getAllExpenseTypeDetails);

router.get('/getAllResourceByProject', claimController.getResourceByProject);

router.get('/getClaimsByApprover', claimController.getClaimsByApproverId);

router.post(
  '/updateApprovedStatus',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(213),
  claimController.updateApprovedStatus, // @todo delete this
);
router.post(
  '/uploadClaimData',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(213),
  promUploadClaimValidation,
  claimController.uploadClaimsData,
);

module.exports = router;
