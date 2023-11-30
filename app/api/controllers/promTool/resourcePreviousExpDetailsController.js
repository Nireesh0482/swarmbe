const logger = require('../../utils/logger');
const appResponse = require('../../utils/AppResponse');
const constants = require('../../utils/constants');
const resourcePreviousExpDetailService = require('../../services/promTool/resourcePreviousExpDetailsService');

// get all ResourcePreviousExpDetails data
const getAllResourcePreviousExpDetails = async (req, res) => {
  try {
    const resourcePreviousExpDetailsDetails =
      await resourcePreviousExpDetailService.fetchAllResourcePreviousExpDetails();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, resourcePreviousExpDetailsDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  }
};

// get ResourcePreviousExpDetails data by id
const getResourcePreviousExpDetailsById = async (req, res) => {
  try {
    const resourcePreviousExpDetailsInfo = await resourcePreviousExpDetailService.getResourcePreviousExpDetailsById(
      req.body,
    );
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, resourcePreviousExpDetailsInfo);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

// upload approved ResourcePreviousExpDetails
const uploadResourcePreviousExpDetailsData = async (req, res) => {
  try {
    const insertResourcePreviousExpDetails =
      await resourcePreviousExpDetailService.uploadResourcePreviousExpDetailsDetails(req.body);
      if (insertResourcePreviousExpDetails.checkResourceExp && insertResourcePreviousExpDetails.checkResourceExp.length > 0) {
      const checkExp = insertResourcePreviousExpDetails.checkResourceExp;
      return appResponse.duplicateElementFound(res, constants.DUPLICATE_ENTRIES, { checkExp });
    }
    if (insertResourcePreviousExpDetails.uploadResourcePreviousExp) {
      const insertExp = insertResourcePreviousExpDetails.checkResourceExp;
      return appResponse.success(res, constants.INSERTED_SUCCESSFULLY, { insertExp });
    }
    return appResponse.conflict(res, constants.NOT_INSERTED);
  } catch (error) {
    // if (error?.name === 'SequelizeUniqueConstraintError') {
    //   const [, errorDetails] = error.parent.detail.replace(/_/g, ' ').replace(/[()]/g, '').split('=');
    //   return appResponse.methodNotAllowed(res, constants.DUPLICATE_ENTRIES, errorDetails);
    // }
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
  getAllResourcePreviousExpDetails,
  getResourcePreviousExpDetailsById,
  uploadResourcePreviousExpDetailsData,
};
