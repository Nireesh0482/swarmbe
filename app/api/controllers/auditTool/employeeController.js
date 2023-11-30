const employeeService = require('../../services/auditTool/employeeService');
const constants = require('../../utils/constants');
const appResponse = require('../../utils/AppResponse');
const logger = require('../../utils/logger');

const employeeExcelToDataBase = async (req, res) => {
  try {
    const employeeData = req.body;
    const duplicateValidation = employeeService.validateDuplicateEmpIdAndEmail(employeeData);
    if (duplicateValidation.duplicateEmail.length > 0 || duplicateValidation.duplicateEmployeeId.length > 0) {
      return appResponse.expectationFailed(res, constants.DUPLICATE_ENTRIES, {
        duplicateEntryInTable: duplicateValidation,
      });
    }
    const verifiedManagerDetails = await employeeService.verifyManagerDetailsInDb(employeeData);
    if (verifiedManagerDetails.length > 0) {
      return appResponse.methodNotAllowed(res, constants.MANAGER_NOT_IN_DB, verifiedManagerDetails);
    }
    const createdEmpData = await employeeService.createEmpData(employeeData);
    const { newData, notInsertedData, addedEmployee } = createdEmpData;
    const responseData = { newData, notInsertedData, addedEmployee };
    if (newData.length === 0) {
      return appResponse.conflict(res, constants.NOT_INSERTED, responseData);
    }
    if (newData.length > 0 && notInsertedData.length > 0) {
      return appResponse.success(res, constants.DATA_UPDATED, responseData);
    }
    if (notInsertedData.length === 0 && newData.length === addedEmployee) {
      return appResponse.created(res, constants.INSERTED_SUCCESSFULLY, responseData);
    }
  } catch (error) {
    if (error?.name === 'AggregateError') {
      if (error?.errors[0]?.name === 'SequelizeBulkRecordError') {
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

const fetchEmployeeDataFromDB = async (req, res) => {
  try {
    const Data = await employeeService.getEmployeeData();
    if (!Data) return appResponse.notFound(res, constants.CANNOT_FETCH);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, Data);
  } catch (error) {
    logger.error(error);
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const requestData = req.body;
    const removeEmployee = await employeeService.deleteEmp(requestData);
    if (removeEmployee === 0) {
      return appResponse.conflict(res, constants.NOT_INSERTED, removeEmployee);
    }
    return appResponse.success(res, constants.DATA_UPDATED, removeEmployee);
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      appResponse.conflict(res, error.parent.message);
    }
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const getEmployeeRolesListFromDb = async (req, res) => {
  try {
    const employeeRoleList = await employeeService.getEmployeeRolesListService();
    if (!employeeRoleList) return appResponse.notFound(res, constants.CANNOT_FETCH);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, employeeRoleList);
  } catch (error) {
    logger.error(error);
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  }
};

const getEmployeeDesignationListFromDb = async (req, res) => {
  try {
    const employeeDesignationList = await employeeService.getEmployeeDesignationListService();
    if (!employeeDesignationList) return appResponse.notFound(res, constants.CANNOT_FETCH);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, employeeDesignationList);
  } catch (error) {
    logger.error(error);
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  }
};
module.exports = {
  getEmployeeDesignationListFromDb,
  getEmployeeRolesListFromDb,
  employeeExcelToDataBase,
  fetchEmployeeDataFromDB,
  deleteEmployee,
};
