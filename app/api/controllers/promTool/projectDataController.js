const logger = require('../../utils/logger');
const appResponse = require('../../utils/AppResponse');
const constants = require('../../utils/constants');
const projService = require('../../services/promTool/projectDataService');
const { validateDuplicateDetailsForSingleField } = require('../../helpers/helperFunctions');
// save Project and update data
const saveUpdateProjectData = async (req, res) => {
  try {
    const duplicateRowValidateForProjectCode = validateDuplicateDetailsForSingleField(req.body, 'project_code');
    const duplicateRowValidateForProjectName = validateDuplicateDetailsForSingleField(req.body, 'project_name');
    if (duplicateRowValidateForProjectCode.length > 0) {
      return appResponse.methodNotAllowed(res, constants.DUPLICATE_ENTRIES, {
        duplicateRowValidateForProjectCode,
      });
    }
    // need to add duplicateRowValidateForProjectName in frontend
    if (duplicateRowValidateForProjectName.length > 0) {
      return appResponse.methodNotAllowed(res, constants.DUPLICATE_ENTRIES, {
        duplicateRowValidateForProjectName,
      });
    }
    // validate whether group Name and head combination is present in table ( org_bu_aop )
    const validateGroupNameAndHead = await projService.groupHeadAndNameValidation(req.body);

    if (validateGroupNameAndHead.length > 0) {
      return appResponse.expectationFailed(res, constants.EMPLOYEE_DETAILS_DOES_NOT_MATCH, validateGroupNameAndHead);
    }
    const getProjectData = await projService.getProjectByID(req.body);
    if (getProjectData.projectName.length > 0) {
      const duplicateData = getProjectData.projectName;
      return appResponse.notAuthorized(res, constants.DUPLICATE_ENTRIES, { duplicateData });
    }
    if (getProjectData) {
      return appResponse.success(res, constants.INSERTED_SUCCESSFULLY, {
        getProjectData,
      });
    }
    return appResponse.conflict(res, constants.NOT_INSERTED);
  } catch (error) {
    logger.error(error);
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
          return appResponse.badRequest(res, { message: constants.DATA_NOT_SAVED }, { requiredData });
        }
      }
    }

    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// only save new data
const insertProjectData = async (req, res) => {
  try {
    const duplicateRowValidateForProjectCode = validateDuplicateDetailsForSingleField(req.body, 'project_code');
    const duplicateRowValidateForProjectName = validateDuplicateDetailsForSingleField(req.body, 'project_name');
    if (duplicateRowValidateForProjectCode.length > 0) {
      return appResponse.methodNotAllowed(res, constants.DUPLICATE_ENTRIES, {
        duplicateRowValidateForProjectCode,
      });
    }
    if (duplicateRowValidateForProjectName.length > 0) {
      return appResponse.methodNotAllowed(res, constants.DUPLICATE_ENTRIES, {
        duplicateRowValidateForProjectName,
      });
    }
    // validate whether group Name and head combination is present in table ( org_bu_aop )
    const validateGroupNameAndHead = await projService.groupHeadAndNameValidation(req.body);
    if (validateGroupNameAndHead.length > 0) {
      return appResponse.expectationFailed(res, constants.EMPLOYEE_DETAILS_DOES_NOT_MATCH, validateGroupNameAndHead);
    }
    const insertProject = await projService.insertProjectDetails(req.body);
    if (insertProject.projectName.length > 0) {
      const duplicateData = insertProject.projectName;
      return appResponse.notAuthorized(res, constants.DUPLICATE_ENTRIES, { duplicateData });
    }
    if (insertProject.projectInfo === true) {
      return appResponse.notUpdated(res, constants.DUPLICATE_BUFFER_PROJECT);
    }
    if (insertProject.insertProject.length > 0) {
      return appResponse.success(res, constants.INSERTED_SUCCESSFULLY, {
        insertProject,
      });
    }
    if (insertProject.updateRecords.length > 0) {
      const dulpiRecords = insertProject.updateRecords;
      return appResponse.invalidInput(res, constants.DUPLICATE_ENTRIES, { dulpiRecords });
    }
    return appResponse.conflict(res, constants.NOT_INSERTED);
  } catch (error) {
    logger.error(error);
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

// get all Project data
const getAllProjects = async (req, res) => {
  try {
    const projectDetails = await projService.fetchAllProjects();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, projectDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  }
};

const getAllProjectsWithTheirAssociatedEmployee = async (req, res) => {
  try {
    const projectDetailsWithEmployeeDetails = await projService.fetchAllProjectAndTheirEmployee();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, projectDetailsWithEmployeeDetails);
  } catch (error) {
    logger.error(error);
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  }
};

// get project data by id
const getProjectById = async (req, res) => {
  try {
    const projectInfo = await projService.getProjectById(req.params);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, projectInfo);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

// get all AOP data
const getAllProjGroupDetails = async (req, res) => {
  try {
    const AOPDetails = await projService.fetchAllProjGroupNameData();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, AOPDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  }
};

// get all project status details
const getAllProjStatusDetails = async (req, res) => {
  try {
    const projStatusDetails = await projService.fetchAllProjStatusData();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, projStatusDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

// get all project types
const getAllProjTypesDetails = async (req, res) => {
  try {
    const projectTypeDetails = await projService.fetchAllProjTypesData();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, projectTypeDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

// Inactive the project by changing the status
const deleteProject = async (req, res) => {
  try {
    const request = req.body;
    const DeletedProject = await projService.deleteProjects(request);
    if (DeletedProject) {
      return appResponse.success(res, constants.DELETE_SUCCESSFUL, DeletedProject);
    }
    return appResponse.conflict(res, constants.UPDATE_FAIL);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

module.exports = {
  saveUpdateProjectData,
  getAllProjects,
  getProjectById,
  getAllProjGroupDetails,
  getAllProjStatusDetails,
  getAllProjTypesDetails,
  insertProjectData,
  getAllProjectsWithTheirAssociatedEmployee,
  deleteProject,
};
