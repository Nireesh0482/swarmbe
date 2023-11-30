const logger = require('../../utils/logger');
const appResponse = require('../../utils/AppResponse');
const constants = require('../../utils/constants');
const resourceMgmtSer = require('../../services/promTool/resourceManagementService');
const {
  validateDuplicateDataForThreeFields,
  validateDuplicateDetailsForSingleField,
  validateDuplicateDataForTwoFields,
} = require('../../helpers/helperFunctions');

// If user clicks on Yes button it will update existing records and save new records,
// First it will check whether manager exist or not. If not It not will enter.
// After it will check whether employee exist or not if not exists it will  save data If exists It will update

const saveUpdateResourceData = async (req, res) => {
  try {
    const duplicateRowValidateForResource = validateDuplicateDetailsForSingleField(req.body, 'resource_emp_id');
    const duplicateRowValidateForEmailId = validateDuplicateDetailsForSingleField(req.body, 'email_id');
    if (duplicateRowValidateForEmailId.length > 0 || duplicateRowValidateForResource.length > 0) {
      return appResponse.expectationFailed(res, constants.DUPLICATE_ENTRIES, {
        duplicateRowValidateForEmailId,
        duplicateRowValidateForResource,
      });
    }

    const getResourceData = await resourceMgmtSer.getResourceByID(req.body);
    if (getResourceData.checkEmail.length > 0) {
      const checkEmailData = getResourceData.checkEmail;
      return appResponse.notAuthorized(res, constants.DUPLICATE_ENTRIES, { checkEmailData });
    }
    if (getResourceData.emptyManagerRecords.length > 0) {
      const emptyManager = getResourceData.emptyManagerRecords;
      return appResponse.methodNotAllowed(res, constants.NO_MANAGER_NOT_SAVED, { emptyManager });
    }
    if (getResourceData.isReportingVerify.length > 0) {
      const verifyIsManager = getResourceData.isReportingVerify;
      return appResponse.duplicateElementFound(res, constants.NO_MANAGER_NOT_SAVED, { verifyIsManager });
    }
    // if (getResourceData.inActiveDisableData.length > 0) {
    //   const checkInactiveData = getResourceData.inActiveDisableData;
    //   return appResponse.multipleDataFoundError(res, constants.UPDATE_FAIL, { checkInactiveData });
    // }
    // if (getResourceData.resourceExperienceMismatchData.length !== 0) {
    //   const resourceData = getResourceData.resourceExperienceMismatchData;
    //   return appResponse.noDataInDatabase(res, constants.NO_RECORD_FOUND, resourceData);
    // }
    if (getResourceData.resourceInfo !== undefined) {
      const inActiveAllocation = getResourceData.inActiveAllocation;
      return appResponse.success(res, constants.INSERTED_SUCCESSFULLY, {
        inActiveAllocation,
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
    if (error?.name === 'SequelizeValidationError') {
      const message = error?.errors[0]?.message;
      return appResponse.badRequest(res, constants.INVALID_INPUT, { validationFail: true, message });
    }
    if (error?.name === 'SequelizeUniqueConstraintError') {
      const [, errorDetails] = error.parent.detail.replace(/_/g, ' ').replace(/[()]/g, '').split('=');
      return appResponse.badRequest(res, {
        message: errorDetails,
      });
    }
    if (error?.parent?.hint) {
      const errorHint = error.parent.hint;
      return appResponse.badRequest(res, constants.DATA_NOT_SAVED, { errorHint });
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

// save data if user clicks on NO button, First it will check whether manager exist or not if not it not will enter.
// After it will whether employee exist or not if exists it will not save any data
// if user doesn't it will save new records
// if all new records are duplicate then it will throw duplicate error,
// if one exist and remaining new means it will add and return with save response

const insertResourceData = async (req, res) => {
  try {
    // Checking any duplicate employee id and email id record in request If exists throw error
    const duplicateRowValidateForResource = validateDuplicateDetailsForSingleField(req.body, 'resource_emp_id');
    const duplicateRowValidateForEmailId = validateDuplicateDetailsForSingleField(req.body, 'email_id');
    // throwing duplicate error
    if (duplicateRowValidateForEmailId.length > 0 || duplicateRowValidateForResource.length > 0) {
      return appResponse.expectationFailed(res, constants.DUPLICATE_ENTRIES, {
        duplicateRowValidateForEmailId,
        duplicateRowValidateForResource,
      });
    }
    // sending request to service

    const insertResource = await resourceMgmtSer.insertResourceDetails(req.body);
    if (insertResource) {
      if (insertResource.checkEmail.length > 0) {
        const checkEmailData = insertResource.checkEmail;
        return appResponse.notAuthorized(res, constants.DUPLICATE_ENTRIES, { checkEmailData });
      }
      // If manager not existed throwing error
      if (insertResource.emptyManagerRecords.length > 0) {
        const emptyManager = insertResource.emptyManagerRecords;
        return appResponse.methodNotAllowed(res, constants.NO_MANAGER_NOT_SAVED, { emptyManager });
      }
      // Checking records saved
      if (insertResource.insertResource.length > 0) {
        return appResponse.success(res, constants.INSERTED_SUCCESSFULLY, {
          insertResource,
        });
      }
      // checking duplicate records
      if (insertResource.updateRecords.length === req.body.length) {
        const dulpiRecords = insertResource.updateRecords;
        return appResponse.invalidInput(res, constants.DUPLICATE_ENTRIES, { dulpiRecords });
      }
    }
    // Returning error If records not saved
    return appResponse.conflict(res, constants.NOT_INSERTED);
  } catch (error) {
    logger.error(error);
    if (error?.name === 'SequelizeForeignKeyConstraintError') {
      const [, errorDetails] = error.parent.detail.replace(/_/g, ' ').replace(/[()]/g, '').split('=');
      return appResponse.badRequest(res, {
        message: errorDetails,
      });
    }
    if (error?.name === 'SequelizeValidationError') {
      const [, errorDetails] = error.parent.detail.replace(/_/g, ' ').replace(/[()]/g, '').split('=');
      return appResponse.badRequest(res, {
        message: errorDetails,
      });
    }
    if (error?.name === 'SequelizeUniqueConstraintError') {
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

// get all employee data
const getAllResources = async (req, res) => {
  try {
    const resourceDetails = await resourceMgmtSer.fetchAllResources();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, resourceDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

// get resource data by id
const getResourceById = async (req, res) => {
  try {
    const resourceDetails = await resourceMgmtSer.getResourceById(req.params);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, resourceDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

// get all joined Details
const getAllJoinedAsDetails = async (req, res) => {
  try {
    const joinedAsDetails = await resourceMgmtSer.fetchAllJoinedAsData();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, joinedAsDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

// get all resource status Details
const getAllResourceStatusDetails = async (req, res) => {
  try {
    const resourceStatusDetails = await resourceMgmtSer.fetchAllResourceStatusData();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, resourceStatusDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

// get all skills list
const getAllSkillDetails = async (req, res) => {
  try {
    const skillDetails = await resourceMgmtSer.fetchAllSkillData();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, skillDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

// get all stream data
const getAllStreamDetails = async (req, res) => {
  try {
    const streamDetails = await resourceMgmtSer.fetchAllStreamData();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, streamDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

const getAllLocationDeatils = async (req, res) => {
  try {
    const loactionDetails = await resourceMgmtSer.fetchAllLocationData();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, loactionDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

const getAllDesignationDetails = async (req, res) => {
  try {
    const designationDetails = await resourceMgmtSer.fetchAllDesignationData();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, designationDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

// changing status to Inactive to delete the employee
const deleteResource = async (req, res) => {
  try {
    const request = req.body;
    const DeletedResource = await resourceMgmtSer.deleteResource(request);
    if (DeletedResource) {
      return appResponse.success(res, constants.DELETE_SUCCESSFUL, DeletedResource);
    }
    return appResponse.conflict(res, constants.UPDATE_FAIL);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// verify whether any duplicate records from coming from request body
const verifyEmployeeAndSendTheirDetails = async (req, res) => {
  try {
    const request = req.body;
    const resourceDetails = await resourceMgmtSer.getEmployeeDetailsFromDb(request);
    if (resourceDetails.length > 0) {
      return appResponse.success(res, constants.DUPLICATE_ENTRIES, resourceDetails);
    }
    return appResponse.conflict(res, constants.NO_DUPLICATE_RECORD_FOUND);
  } catch (err) {
    logger.error(err);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const getSupervisorDetailsFromDb = async (req, res) => {
  try {
    const supervisorDetails = await resourceMgmtSer.superVisorDetailsFromDbService();
    if (!supervisorDetails) {
      return appResponse.conflict(res, constants.NO_RECORD_FOUND);
    }
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, supervisorDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

const saveSalaryRevisionForEmployees = async (req, res) => {
  try {
    const salaryRevision = req.body;
    const checkDuplicateRevisionDate = validateDuplicateDataForTwoFields(
      salaryRevision,
      'resource_emp_id',
      'revision_start_date',
    );

    if (checkDuplicateRevisionDate.length > 0) {
      return appResponse.expectationFailed(res, constants.DUPLICATE_ENTRIES, {
        duplicateEntryInTable: checkDuplicateRevisionDate,
      });
    }

    const checkDuplicateResourceId = validateDuplicateDetailsForSingleField(salaryRevision, 'resource_emp_id');

    if (checkDuplicateResourceId.length > 0) {
      return appResponse.badRequest(res, constants.DUPLICATE_ENTRIES, {
        duplicateEntryInTable: checkDuplicateResourceId,
      });
    }

    // if employee exist in database then save the Data to prom_salary_revision table
    const salaryRevisionDetails = await resourceMgmtSer.saveEmployeeSalaryRevision(salaryRevision);

    if (salaryRevisionDetails.duplicateSalaryRevisionPresent) {
      return appResponse.methodNotAllowed(res, constants.DUPLICATE_ENTRIES, {
        duplicateRecordRowIndex: salaryRevisionDetails.dataInfo.duplicateRevisionDataIndexValue,
      });
    }

    return appResponse.success(
      res,
      constants.INSERTED_SUCCESSFULLY,
      salaryRevisionDetails.dataInfo.newEmployeeSalaryRevision,
    );
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const updateSalaryForEmployeeFromRevision = async (req, res) => {
  try {
    // on click of button from frontend ,update the Employee salary By using salary Revision Data in database.
    const salaryRevisionDetailsFromDatabase = await resourceMgmtSer.updateSalaryRevisionForEmployees();
    if (!salaryRevisionDetailsFromDatabase) {
      return appResponse.conflict(res, constants.CANNOT_FETCH);
    }
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, salaryRevisionDetailsFromDatabase);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const getSalaryRevisionDetailsFromDatabase = async (req, res) => {
  try {
    const requestBody = req.body;
    const salaryRevisionDetails = await resourceMgmtSer.salaryRevisionFromDatabase(requestBody);
    if (salaryRevisionDetails) {
      return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, salaryRevisionDetails);
    }
    return appResponse.conflict(res, constants.CANNOT_FETCH);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const updateSalaryRevisionDetailsInRevisionTable = async (req, res) => {
  try {
    const salaryRevisionUpdatedDetails = req.body;
    const validateSalaryRevisionDuplicates = validateDuplicateDataForThreeFields(
      salaryRevisionUpdatedDetails,
      'resource_emp_id',
      'revision_start_date',
      'revision_end_date',
    );
    if (validateSalaryRevisionDuplicates.length > 0) {
      return appResponse.expectationFailed(res, constants.DUPLICATE_ENTRIES, validateSalaryRevisionDuplicates);
    }

    const updateSalaryRevisionDetailsInDatabase = await resourceMgmtSer.updateSalaryRevisionInRevisionTable(
      salaryRevisionUpdatedDetails,
    );
    if (!updateSalaryRevisionDetailsInDatabase) {
      return appResponse.conflict(res, constants.UPDATE_FAIL);
    }
    return appResponse.success(res, constants.DATA_UPDATED);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const getUserDetailsFromSalaryRevisionTable = async (req, res) => {
  try {
    const employeeDetailsFromSalaryRevision = await resourceMgmtSer.employeeDetailsFromSalaryRevisionTable();
    if (!employeeDetailsFromSalaryRevision) {
      return appResponse.notFound(res, constants.NO_RECORD_FOUND);
    }
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, employeeDetailsFromSalaryRevision);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

module.exports = {
  getUserDetailsFromSalaryRevisionTable,
  updateSalaryRevisionDetailsInRevisionTable,
  getSalaryRevisionDetailsFromDatabase,
  updateSalaryForEmployeeFromRevision,
  getSupervisorDetailsFromDb,
  saveUpdateResourceData,
  getAllJoinedAsDetails,
  getAllResourceStatusDetails,
  getAllSkillDetails,
  getAllStreamDetails,
  getAllResources,
  getResourceById,
  insertResourceData,
  deleteResource,
  verifyEmployeeAndSendTheirDetails,
  saveSalaryRevisionForEmployees,
  getAllLocationDeatils,
  getAllDesignationDetails,
};
