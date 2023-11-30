/* eslint-disable camelcase */
const projectService = require('../../services/auditTool/projectService');
const constants = require('../../utils/constants');
const appResponse = require('../../utils/AppResponse');
const logger = require('../../utils/logger');

const projectExcelToDatabase = async (req, res) => {
  try {
    const request = req.body;
    const validateDuplicateRows = projectService.validateDuplicateProjectData(req.body);
    if (validateDuplicateRows.length > 0) {
      return appResponse.expectationFailed(res, constants.DUPLICATE_ENTRIES, {
        duplicateEntryInTable: validateDuplicateRows,
      });
    }
    const projectData = await projectService.createProjectData(request);
    const { projectDataCount, projectEmpDataCount } = projectData;
    const responseData = { projectDataCount, projectEmpDataCount };
    if (projectDataCount === 0 && projectEmpDataCount === 0) {
      return appResponse.conflict(res, constants.NOT_INSERTED, responseData);
    }
    if (projectDataCount > 0 && projectEmpDataCount > 0) {
      return appResponse.created(res, constants.INSERTED_SUCCESSFULLY, responseData);
    }
    if ((projectDataCount === 0 && projectEmpDataCount > 0) || (projectDataCount > 0 && projectEmpDataCount === 0)) {
      return appResponse.success(res, constants.DATA_UPDATED, responseData);
    }
  } catch (error) {
    logger.error(error);
    if (error?.name === 'SequelizeForeignKeyConstraintError') {
      const [, errorDetails] = error.parent.detail.replace(/_/g, ' ').replace(/[()]/g, '').split('=');
      return appResponse.badRequest(res, errorDetails);
    }
    if (error?.name === 'AggregateError') {
      if (error?.errors[0].name === 'SequelizeBulkRecordError') {
        if (error.errors[0].errors.name === 'SequelizeValidationError') {
          const requiredData = error.errors[0].errors.errors.map((ele) => ele.message);
          return appResponse.badRequest(res, constants.DATA_NOT_SAVED, { requiredData });
        }
      }
    }
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// get Projects On click On projects dropdown
const getProjects = async (req, res) => {
  try {
    const data = await projectService.getProjects();
    if (data) {
      return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, data);
    }
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  } catch (error) {
    logger.error(error);
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  }
};

const deleteProject = async (req, res) => {
  try {
    const request = req.body;
    const deletedProject = await projectService.deleteProjects(request);
    if (!deletedProject) {
      return appResponse.conflict(res, constants.UPDATE_FAIL);
    }
    return appResponse.success(res, constants.DELETE_SUCCESSFUL, deletedProject);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

module.exports = {
  projectExcelToDatabase,
  getProjects,
  deleteProject,
};
