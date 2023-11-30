const logger = require('../../utils/logger');
const appResponse = require('../../utils/AppResponse');
const constants = require('../../utils/constants');
const AOPService = require('../../services/promTool/organizationGroupMgmtService');
const { validateDuplicateDataForTwoFields } = require('../../helpers/helperFunctions');

// only save new data
const insertMgmtGRPAOPData = async (req, res) => {
  try {
    const allAOPData = req.body;
    // check whether duplicate row from frontend table is present
    const checkDuplicateAOPdata = validateDuplicateDataForTwoFields(allAOPData, 'org_bu_name', 'aop_month');

    if (checkDuplicateAOPdata.length > 0) {
      return appResponse.expectationFailed(res, constants.DUPLICATE_ENTRIES, {
        duplicateEntryInTable: checkDuplicateAOPdata,
      });
    }
    const allOrgGroupNameAndHeadFromDB = await AOPService.getAllGroupDetailsFromDB();
    const validateHeadWithGroupDetailsTable = AOPService.checkHeadDetailsWithGroupHead(
      allAOPData,
      allOrgGroupNameAndHeadFromDB,
    );
    if (validateHeadWithGroupDetailsTable.length > 0) {
      return appResponse.badRequest(res, constants.INVALID_INPUT, { errorDetails: validateHeadWithGroupDetailsTable });
    }

    // verify whether unique data is coming by comparing with database.
    // frontend data will be compared with database data.if duplicate data is found then throw 405
    const verifyDuplicateAOPDataInDatabase = await AOPService.verifyDuplicateAOPDataWithDatabase(allAOPData);
    if (verifyDuplicateAOPDataInDatabase.duplicateAOPDataPresent) {
      return appResponse.methodNotAllowed(res, constants.DUPLICATE_ENTRIES, {
        duplicateRecordRowIndex: verifyDuplicateAOPDataInDatabase.dataInfo.duplicateAOPDataIndexValue,
        duplicateRecords: verifyDuplicateAOPDataInDatabase.dataInfo.duplicateAOPData,
      });
    }
    const insertAOP = await AOPService.insertMgmtAOPData(allAOPData);
    if (insertAOP) {
      return appResponse.success(res, constants.INSERTED_SUCCESSFULLY, {
        insertAOP,
      });
    }
    return appResponse.conflict(res, constants.NOT_INSERTED);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const insertOrganizationGroupDetails = async (req, res) => {
  try {
    const requestBody = req.body;
    const saveGroupDetails = await AOPService.saveGroupDetailsService(requestBody);

    if (!saveGroupDetails.saveSuccess && saveGroupDetails.validationError) {
      return appResponse.expectationFailed(res, constants.NOT_INSERTED, {
        duplicateGroupCode: saveGroupDetails.validationError.validateGroupCodeDuplicateData,
        duplicateGroupName: saveGroupDetails.validationError.validateGroupNameDuplicateData,
      });
    }

    if (saveGroupDetails.saveSuccess) {
      return appResponse.success(res, constants.DATA_UPDATED, saveGroupDetails.saveOrgDetails);
    }
    return appResponse.conflict(res, constants.UPDATE_FAIL);
  } catch (error) {
    if (error.cause) {
      logger.error(error.cause.message);
      return appResponse.conflict(res, constants.DATA_NOT_SAVED);
    }
    logger.error(error);

    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};
const updateGroupDetailsController = async (req, res) => {
  try {
    const requestBody = req.body;
    const updateGroupDetails = await AOPService.updateGroupDetailsService(requestBody);
    if (!updateGroupDetails.saveSuccess) {
      return appResponse.methodNotAllowed(res, constants.NOT_INSERTED, {
        duplicateGroupCode: updateGroupDetails.validateGroupCodeDuplicateData,
        duplicateGroupName: updateGroupDetails.validateGroupNameDuplicateData,
      });
    }
    if (updateGroupDetails.updatedDataInfo.some((ele) => ele === true)) {
      return appResponse.success(res, constants.DATA_UPDATED, updateGroupDetails.updateOrgDetails);
    }
    return appResponse.conflict(res, constants.UPDATE_FAIL);
  } catch (error) {
    logger.error(error);

    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};
// get all project group details
const getAllProjGroupDetails = async (req, res) => {
  try {
    if (req.body.org_bu_name === 'All') {
      const projectGroupDetails = (await AOPService.getAllOrgAOPDetailsFromDb()) ?? [];
      return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, projectGroupDetails);
    }
    const projGroupDetails = (await AOPService.fetchAllProjGroupNameData(req.body)) ?? [];
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, projGroupDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

// get AOP data by name
const getAllGRPAOPDataByGRPName = async (req, res) => {
  try {
    const AOPInfo = await AOPService.getGRPInfoByName(req.body);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, AOPInfo);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
  }
};

// update AOP data
const updateAOPData = async (req, res) => {
  try {
    const aopData = req.body;
    const validateDuplicateAOPData = validateDuplicateDataForTwoFields(aopData, 'org_bu_name', 'aop_month');
    if (validateDuplicateAOPData.length > 0) {
      return appResponse.duplicateElementFound(res, constants.DUPLICATE_ENTRIES, validateDuplicateAOPData);
    }
    const getAOPData = await AOPService.updateMgmtAOPData(aopData);
    if (getAOPData.updatedDataInfo.some((ele) => ele === true)) {
      return appResponse.success(res, constants.DATA_UPDATED);
    }
    return appResponse.conflict(res, constants.UPDATE_FAIL);
  } catch (err) {
    logger.error(err);
    return appResponse.internalServerError(res, constants.UPDATE_FAIL);
  }
};

module.exports = {
  insertOrganizationGroupDetails,
  insertMgmtGRPAOPData,
  getAllGRPAOPDataByGRPName,
  updateAOPData,
  getAllProjGroupDetails,
  updateGroupDetailsController,
};
