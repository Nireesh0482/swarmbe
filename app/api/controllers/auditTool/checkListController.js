const checkListService = require('../../services/auditTool/checkListService');
const constants = require('../../utils/constants');
const appResponse = require('../../utils/AppResponse');
const logger = require('../../utils/logger');

const saveCheckListToDatabaseWithTable = async (req, res) => {
  try {
    const { checkListExcelData, checkListTypeInfo } = req.body;

    const addNewCheckListType = await checkListService.findOrCreateTypeInDatabase(checkListTypeInfo);

    if (addNewCheckListType[1] === true) {
      logger.info(`${addNewCheckListType[0].type} added to checklist type table`);
    }
    // generate table for checklist and insert data from the checklist data to table
    const checklistTable = await checkListService.generateDynamicCheckList(checkListExcelData, checkListTypeInfo);

    if (!checklistTable.insertSuccess) {
      logger.error(checklistTable);
      return appResponse.conflict(res, constants.NOT_INSERTED);
    }
    return appResponse.created(res, constants.INSERTED_SUCCESSFULLY, { checklistData: checklistTable.insertedData });
  } catch (error) {
    logger.error(error);
    if (error.message === 'transaction Error') {
      logger.error(error);
      logger.error('Saved Data has been rolled backed');
      return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
    }
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// get CheckList On click On checklist dropdown
const getCheckLists = async (req, res) => {
  try {
    const data = await checkListService.getCheckLists();
    if (!data) return appResponse.notFound(res, constants.CANNOT_FETCH);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, data);
  } catch (error) {
    logger.error(error);
    return appResponse.notFound(res, constants.CANNOT_FETCH);
  }
};

// get CheckList On click On checklist dropdown
const getCheckListByName = async (req, res) => {
  try {
    const checkListInfo = req.body;
    const data = await checkListService.getCheckListByName(checkListInfo);
    if (data) {
      return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, data);
    }
    return appResponse.notFound(res, constants.CANNOT_FETCH);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const getAllCheckListType = async (req, res) => {
  try {
    const allCheckListTypes = await checkListService.getAllCheckListTypeFromDatabase();
    if (allCheckListTypes) {
      return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, allCheckListTypes);
    }
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  } catch (error) {
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

module.exports = {
  saveCheckListToDatabaseWithTable,
  getCheckLists,
  getCheckListByName,
  getAllCheckListType,
};
