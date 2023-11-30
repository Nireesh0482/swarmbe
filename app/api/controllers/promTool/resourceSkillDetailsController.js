const logger = require('../../utils/logger');
const appResponse = require('../../utils/AppResponse');
const constants = require('../../utils/constants');
const resourceSkillService = require('../../services/promTool/resourceSkillDetailsService');

// get all ResourceSkills data
const getAllResourceSkills = async (req, res) => {
  try {
    const ResourceSkillsDetails = await resourceSkillService.fetchAllResourceSkills();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, ResourceSkillsDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  }
};

// get ResourceSkills data by id
const getResourceSkillsById = async (req, res) => {
  try {
    const ResourceSkillsInfo = await resourceSkillService.getResourceSkillsById(req.params);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, ResourceSkillsInfo);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

// upload approved ResourceSkills
const uploadResourceSkillsData = async (req, res) => {
  try {
    const insertResourceSkills = await resourceSkillService.uploadResourceSkillsDetails(req.body);
    if (insertResourceSkills.verifyEmpSkillArr.length > 0) {
      const checkSkill = insertResourceSkills.verifyEmpSkillArr;
      return appResponse.duplicateElementFound(res, constants.NO_MANAGER_NOT_SAVED, checkSkill);
    }
    if (insertResourceSkills.uploadResourceSkill) {
      const insertSkill = insertResourceSkills.verifyEmpSkillArr;
      return appResponse.success(res, constants.INSERTED_SUCCESSFULLY, insertSkill);
    }

    return appResponse.conflict(res, constants.NOT_INSERTED);
  } catch (error) {
    if (error?.name === 'SequelizeForeignKeyConstraintError') {
      const [, errorDetails] = error.parent.detail.replace(/_/g, ' ').replace(/[()]/g, '').split('=');
      return appResponse.badRequest(res, {
        message: errorDetails,
      });
    }

    if (error?.name === 'AggregateError') {
      if (error?.errors[0].name === 'SequelizeBulkRecordError') {
        if (error.errors[0].errors.name === 'SequelizeValidationError') {
          const requiredData = error.errors[0].errors.errors.map((ele) => ele.message);
          return appResponse.badRequest(res, constants.DATA_NOT_SAVED, { requiredData });
        }
      }
    }

    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

module.exports = {
  getAllResourceSkills,
  getResourceSkillsById,
  uploadResourceSkillsData,
};
