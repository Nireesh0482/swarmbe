const costCenterService = require('../../services/auditTool/costCenterService');
const constants = require('../../utils/constants');
const { verifyEmployeeExistInDBb } = require('../../services/auditTool/employeeService');
const appResponse = require('../../utils/AppResponse');
const logger = require('../../utils/logger');

const costCenterExcelToDatabase = async (req, res) => {
  try {
    const request = req.body;

    const duplicateValidation = costCenterService.duplicateValidationForCostCenter(request);
    if (duplicateValidation.length > 0) {
      return appResponse.expectationFailed(res, constants.DUPLICATE_ENTRIES, {
        duplicateEntryInTable: duplicateValidation,
      });
    }
    const verifyEmployeeExistence = await verifyEmployeeExistInDBb(request);
    if (verifyEmployeeExistence.length > 0) {
      return appResponse.methodNotAllowed(res, constants.MANAGER_NOT_IN_DB, verifyEmployeeExistence);
    }
    const costCenterData = await costCenterService.createCostCenterData(request);
    if (costCenterData) {
      return appResponse.success(res, constants.INSERTED_SUCCESSFULLY, costCenterData);
    }
    return appResponse.conflict(res, constants.NOT_INSERTED);
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

// get costCenters On click On costCenters dropdown
const getCostCenters = async (req, res) => {
  try {
    const data = await costCenterService.getAllCostCenters();

    if (data) {
      return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, data);
    }
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  } catch (error) {
    logger.error(error);
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  }
};

// get costCenters On click On costCenters dropdown
const getCostCenterByCode = async (req, res) => {
  try {
    const costCenterCode = req.body;
    const data = await costCenterService.getCostCentersByCode(costCenterCode);
    if (data) {
      return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, data);
    }
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  } catch (error) {
    logger.error(error);
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  }
};

module.exports = {
  costCenterExcelToDatabase,
  getCostCenters,
  getCostCenterByCode,
};
