const express = require('express');

const router = express.Router();
const resourceSkillController = require('../../controllers/promTool/resourceSkillDetailsController');
const jwtService = require('../../helpers/JWT');
const { promToolSaveResourceSkillDataValidation } = require('../../middleware/validation');
const { checkPromUserPermissionForAPI } = require('../../middleware/userRoleAuth');

router.get('/getAllResourceSkill', resourceSkillController.getAllResourceSkills);

router.get('/getResourceSkillById', resourceSkillController.getResourceSkillsById);

router.post(
  '/saveResourceSkillData',
  jwtService.verifyAccessToken,
  checkPromUserPermissionForAPI(229),
  promToolSaveResourceSkillDataValidation,
  resourceSkillController.uploadResourceSkillsData,
);

module.exports = router;
