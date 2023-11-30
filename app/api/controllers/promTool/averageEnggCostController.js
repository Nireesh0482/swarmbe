const logger = require('../../utils/logger');
const appResponse = require('../../utils/AppResponse');
const constants = require('../../utils/constants');
const enggCostService = require('../../services/promTool/averageEnggCostService');

// save data
const insertEnggCostData = async (req, res) => {
  try {
    const insertEnggCost = await enggCostService.insertEnggCostDetails(req.body);
    if (insertEnggCost) {
      return appResponse.success(res, constants.INSERTED_SUCCESSFULLY, {
        insertEnggCost,
      });
    }
    return appResponse.conflict(res, constants.NOT_INSERTED);
  } catch (error) {
    if (error?.name === 'SequelizeUniqueConstraintError') {
      const [, errorDetails] = error.parent.detail.replace(/_/g, ' ').replace(/[()]/g, '').split('=');
      return appResponse.methodNotAllowed(res, constants.DUPLICATE_ENTRIES, errorDetails);
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      if (error.errors[0].message === 'average_engg_date must be unique') {
        const errorValue = error.errors[0].value.split('_');
        return appResponse.methodNotAllowed(
          res,
          { message: constants.DUPLICATE_ENTRIES },
          { fullDetail: error.errors[0].value, monthYear: errorValue.slice(-1)[0] },
        );
      }
      return appResponse.conflict(res, error.parent.message);
    }

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

    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// get all EnggCost data
const getAllEnggCost = async (req, res) => {
  try {
    const enggCostDetails = await enggCostService.fetchAllEnggCost();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, enggCostDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

// get EnggCost data by id
const getEnggCostById = async (req, res) => {
  try {
    const request = req.query;
    const enggCostInfo = await enggCostService.getEnggCostById(request);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, enggCostInfo);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

// update avg engg cost data
const updateEnggCost = async (req, res) => {
  try {
    const updatedEnggCostData = await enggCostService.updateEnggCostData(req.body);
    if (updatedEnggCostData.some((ele) => ele === 1)) {
      return appResponse.success(res, constants.DATA_UPDATED, { updatedEnggCostData });
    }
    return appResponse.conflict(res, constants.UPDATE_FAIL);
  } catch (err) {
    logger.error(err);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

module.exports = {
  getAllEnggCost,
  getEnggCostById,
  insertEnggCostData,
  updateEnggCost,
};
