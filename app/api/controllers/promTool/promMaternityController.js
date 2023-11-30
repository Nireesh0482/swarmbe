const logger = require('../../utils/logger');
const appResponse = require('../../utils/AppResponse');
const constants = require('../../utils/constants');
const promMaternityService = require('../../services/promTool/promMaternityService');
const {
  compareNewAndExistingDatabaseDataForThreeFields,
  validateDuplicateDataForThreeFields,
} = require('../../helpers/helperFunctions');

const fetchAllMaternityDetails = async (req, res) => {
  try {
    const groupName = req.body.bu_name ?? null;
    const methodOfRequest = req.method === 'GET';
    const allocationDetails = await promMaternityService.fetchAllMaternityDetailsFromDatabase(
      groupName,
      methodOfRequest,
    );
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, allocationDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  }
};

const saveMaternityDetails = async (req, res) => {
  try {
    const requestDetails = req.body;
    const validateRequestForDuplicateData = validateDuplicateDataForThreeFields(
      requestDetails,
      'resource_emp_id',
      'maternity_start_date',
      'maternity_end_date',
    );

    if (validateRequestForDuplicateData.length > 0) {
      return appResponse.methodNotAllowed(res, constants.DUPLICATE_RECORD, validateRequestForDuplicateData);
    }
    const allMaternityDetails = await promMaternityService.fetchAllMaternityDetailsFromDatabase();
    const verifyDuplicateByCompareWithDB = compareNewAndExistingDatabaseDataForThreeFields(
      requestDetails,
      allMaternityDetails,
      'resource_emp_id',
      'maternity_start_date',
      'maternity_end_date',
    );

    if (verifyDuplicateByCompareWithDB.length > 0) {
      return appResponse.expectationFailed(res, constants.DUPLICATE_RECORD, verifyDuplicateByCompareWithDB);
    }

    if (verifyDuplicateByCompareWithDB.length === 0 && validateRequestForDuplicateData.length === 0) {
      const saveMaternityData = await promMaternityService.saveMaternityService(requestDetails);

      if (!saveMaternityData) {
        return appResponse.conflict(res, constants.DATA_NOT_SAVED);
      }
      return appResponse.created(res, constants.INSERTED_SUCCESSFULLY, saveMaternityData);
    }
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const updatedMaternityDetails = async (req, res) => {
  try {
    const requestedUpdateDetails = req.body;
    const validateRequestForDuplicateData = validateDuplicateDataForThreeFields(
      requestedUpdateDetails,
      'resource_emp_id',
      'maternity_start_date',
      'maternity_end_date',
    );

    if (validateRequestForDuplicateData.length > 0) {
      return appResponse.methodNotAllowed(res, constants.DUPLICATE_RECORD, validateRequestForDuplicateData);
    }

    if (validateRequestForDuplicateData.length === 0) {
      const saveMaternityData = await promMaternityService.updateMaternityDetailsService(requestedUpdateDetails);
      if (!saveMaternityData) {
        return appResponse.conflict(res, constants.DATA_NOT_SAVED);
      }
      return appResponse.success(res, constants.DATA_UPDATED, saveMaternityData);
    }
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const deleteMaternityDetails = async (req, res) => {
  try {
    const requestedDeleteDetails = req.body.deleteRecords;
    const deleteMaternityData = await promMaternityService.deleteMaternityDetailsInDatabase(requestedDeleteDetails);
    if (!deleteMaternityData) {
      return appResponse.conflict(res, constants.DATA_NOT_SAVED);
    }
    return appResponse.success(res, constants.DATA_UPDATED, deleteMaternityData);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

module.exports = {
  saveMaternityDetails,
  deleteMaternityDetails,
  updatedMaternityDetails,
  fetchAllMaternityDetails,
};
