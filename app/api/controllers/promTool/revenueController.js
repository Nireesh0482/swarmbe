const logger = require('../../utils/logger');
const appResponse = require('../../utils/AppResponse');
const constants = require('../../utils/constants');
const revenueService = require('../../services/promTool/revenueService');

// save new revenue data
const insertRevenueData = async (req, res) => {
  try {
    const insertRevenue = await revenueService.insertRevenueDetails(req.body);
    if (insertRevenue) {
      return appResponse.success(res, constants.INSERTED_SUCCESSFULLY, {
        insertRevenue,
      });
    }
    return appResponse.conflict(res, constants.NOT_INSERTED);
  } catch (error) {
    if (error?.name === 'SequelizeUniqueConstraintError') {
      const [, errorDetails] = error.parent.detail.replace(/_/g, ' ').replace(/[()]/g, '').split('=');
      return appResponse.methodNotAllowed(res, constants.DUPLICATE_ENTRIES, errorDetails);
    }
    if (error?.name === 'SequelizeForeignKeyConstraintError') {
      const [, errorDetails] = error.parent.detail.replace(/_/g, ' ').replace(/[()]/g, '').split('=');
      return appResponse.badRequest(res, {
        message: errorDetails,
      });
    }
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// get all Revenue data
const getAllRevenue = async (req, res) => {
  try {
    const revenueDetails = await revenueService.fetchAllRevenue();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, revenueDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

// get Revenue data by id
const getRevenueById = async (req, res) => {
  try {
    const request = req.query;
    const revenueInfo = await revenueService.getRevenueById(request);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, revenueInfo);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

// update the revenue
const updateRevenue = async (req, res) => {
  try {
    const getRevenueData = await revenueService.updateRevenueData(req.body);
    if (getRevenueData) {
      return appResponse.success(res, constants.DATA_UPDATED, {
        getRevenueData,
      });
    }
    return appResponse.conflict(res, constants.UPDATE_FAIL);
  } catch (err) {
    logger.error(err);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const getRevenueDetailsByProjectId = async (req, res) => {
  try {
    const request = req.body.project_code;
    const revenueInfo = await revenueService.getRevenueByProjectId(request);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, revenueInfo);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

module.exports = {
  getAllRevenue,
  getRevenueById,
  insertRevenueData,
  updateRevenue,
  getRevenueDetailsByProjectId,
};
