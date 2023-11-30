const logger = require('../../utils/logger');
const appResponse = require('../../utils/AppResponse');
const constants = require('../../utils/constants');
const claimService = require('../../services/promTool/claimsService');

// save requested claims data and send mail to manager
const insertClaimsData = async (req, res) => {
  try {
    const insertClaims = await claimService.insertClaimsDetails(req.body);
    if (insertClaims) {
      return appResponse.success(res, constants.INSERTED_SUCCESSFULLY, {
        insertClaims,
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
          return appResponse.badRequest(res, constants.DATA_NOT_SAVED, { requiredData });
        }
      }
    }

    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// get all Claims data
const getAllClaims = async (req, res) => {
  try {
    const claimsDetails = await claimService.fetchAllClaims();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, claimsDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  }
};

// get Claims data by id
const getClaimsById = async (req, res) => {
  try {
    const claimsInfo = await claimService.getClaimsById(req.params);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, claimsInfo);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

// get all types of expenses
const getAllExpenseTypeDetails = async (req, res) => {
  try {
    const expenseTypeDetails = await claimService.fetchAllExpenseTypeData();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, expenseTypeDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

// get resource data by project id
const getResourceByProject = async (req, res) => {
  try {
    const resourceInfo = await claimService.getResourceByEmpId();
    if (resourceInfo) {
      return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, resourceInfo);
    }
    // return appResponse.conflict(res, constants.CANNOT_FETCH);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

// get claims approval data by  approve id
const getClaimsByApproverId = async (req, res) => {
  try {
    const request = req.query;
    const claimsInfo = await claimService.getClaimsByApproverId(request);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, claimsInfo);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

// update the status of claim request, sending mail to employee if it approved or rejected
const updateApprovedStatus = async (req, res) => {
  try {
    const getApprovedData = await claimService.updateApprovedStatus(req.body);
    if (getApprovedData) {
      return appResponse.success(res, constants.DATA_UPDATED, {
        getApprovedData,
      });
    }
    return appResponse.conflict(res, constants.UPDATE_FAIL);
  } catch (err) {
    logger.error(err);
  }
};

// upload approved claims
const uploadClaimsData = async (req, res) => {
  try {
    const insertClaims = await claimService.uploadClaimsDetails(req.body);
    if (insertClaims) {
      return appResponse.success(res, constants.INSERTED_SUCCESSFULLY, { insertClaims });
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
  getAllClaims,
  getClaimsById,
  insertClaimsData,
  getAllExpenseTypeDetails,
  getResourceByProject,
  getClaimsByApproverId,
  updateApprovedStatus,
  uploadClaimsData,
};
