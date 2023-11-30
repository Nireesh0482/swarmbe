/* eslint-disable no-param-reassign */
/* eslint-disable max-len */
const checkListRepo = require('../../repositories/auditTool/checkListRepository');

const checkListIdGeneratorFunction = async (checkListTypeInfo) => {
  const startNumber = '0001';
  // get last checklist name if exist in database
  const lastChecklist = await checkListRepo.getLastCheckList();
  // if exist then increment checklist by 1, else start with 0001
  const uniqueNumber =
    lastChecklist.length > 0 ? parseInt(lastChecklist[0].checklist_id.match(/\d+/), 10) + 1 : startNumber;

  return `${'cl_'}${parseInt(uniqueNumber, 10)}_${checkListTypeInfo.type}`;
};

const tableCreationQuery = (tableName, checkListExcelData) => {
  /**
   * @summary extract columns name from excel to create raw query in order to create table with its columns.
   * @field checkListId is used as tableName
   */
  const firstObj = checkListExcelData[0];

  let count = 0;
  let query = `CREATE TABLE IF NOT EXISTS ${tableName} (id SERIAL primary key,`;
  for (const key in firstObj) {
    if (Object.hasOwnProperty.call(firstObj, key)) {
      const element = firstObj[key];
      let comma = ',';
      const size = Object.keys(firstObj).length;
      if (size - 1 === count) {
        comma = '';
      }
      const key1 = key.toLowerCase().trim().replace(/\s/g, '_').replace(/[.]/g, '_');
      if (Array.isArray(element)) {
        query += `${key1} TEXT[]${comma} `;
      } else {
        query += `${key1} VARCHAR${comma} `;
      }
      count += 1;
    }
  }
  query += ')';

  return query;
};

const insertChecklistQuery = (checkListExcelData, tableName) => {
  /**
   * @summary extract columns and its data from request(frontend) to create raw query in order to
   *  insert data into respective columns.
   */
  let keyValues = [];

  // filter(rename keys name) and structuring the data before adding to DB
  const arrayOfFiltered = checkListExcelData.map((element, idx) => {
    element.id = idx + 1;

    /**
     *  @var cleanedObject is create object from frontend checklist with compatible name(database supportive)
     * name so the object key names with "." & " " are replaced with "_"(underScore).
     */
    const cleanedObject = {};
    const keys = Object.keys(element);
    keyValues = keys.length > keyValues ? keys : keyValues;
    keys.forEach((objData, index) => {
      const key = keys[index];
      // replace dot and space with underScore and convert to lowerCase
      cleanedObject[key.toLowerCase().trim().replace(/\s/g, '_').replace(/[.]/g, '_')] = element[key];
    });
    return cleanedObject;
  });

  // Generate the final raw query the data into checklist table
  const insertQuery = `INSERT INTO ${tableName} SELECT * FROM json_populate_recordset(null::${tableName},'${JSON.stringify(
    arrayOfFiltered,
  )}');`;
  return insertQuery;
};

const generateDynamicCheckList = async (checkListExcelData, checkListTypeInfo) => {
  // create checklist id for the new table which to be created in next step.
  const checkListId = await checkListIdGeneratorFunction(checkListTypeInfo);

  // generate raw query to generate checklist table
  const queryToCreateTable = tableCreationQuery(checkListId, checkListExcelData);

  // generate raw query for data to insert to checklist table.
  const insertDataQuery = insertChecklistQuery(checkListExcelData, checkListId);

  /**
   * @description multiple query are ran in this transaction
   * @summary checklist table is created in first query , checklist data is inserted in second query.
   * in final stage the information about checklist is added to master checklist
   */
  const buildTableAndInsertCheckListDetails = await checkListRepo.createTableAndInsertCheckListData({
    queryToCreateTable,
    insertDataQuery,
    checkListTypeInfo,
    checkListId,
  });

  // if checklist data inserted into checklist table and added to masterChecklist table
  // then return success
  if (
    buildTableAndInsertCheckListDetails.insertToCheckListTable &&
    buildTableAndInsertCheckListDetails.saveToMasterTable
  ) {
    return { insertSuccess: true, insertedData: buildTableAndInsertCheckListDetails.saveToMasterTable };
  }
  return { insertSuccess: false, insertedData: null };
};

// get all checklists
const getCheckLists = async () => {
  const allChecklist = await checkListRepo.getAllCheckList();
  return allChecklist;
};

// get checklist by  checklist name
const getCheckListByName = async (checkListInfo) => {
  const { checkListCompleteTableData, checkListTypeAndDescription } = await checkListRepo.getOneChecklistByName(
    checkListInfo.checklist_name,
    checkListInfo.checklist_id,
  );
  return [checkListCompleteTableData[0], checkListTypeAndDescription];
};

const findOrCreateTypeInDatabase = async (obj) => {
  const { type } = obj;
  const findOrCreateType = await checkListRepo.findOrCreateChecklistTypeInDatabase(type);
  return findOrCreateType;
};

const getAllCheckListTypeFromDatabase = async () => {
  const allCheckListType = await checkListRepo.allCheckListTypes();
  return allCheckListType;
};

module.exports = {
  getCheckLists,
  getCheckListByName,
  generateDynamicCheckList,
  findOrCreateTypeInDatabase,
  getAllCheckListTypeFromDatabase,
};
