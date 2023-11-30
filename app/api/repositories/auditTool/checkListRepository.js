const dbInstance = require('../../models');
const { sequelize } = require('../../models');

// get all checklists
const getAllCheckList = async () => {
  const allCheckList = await dbInstance.masterCheckList.findAll({
    attributes: ['checklist_id', 'checklist_tablename', 'type'],
  });
  return allCheckList;
};

// get checklist by name
const getOneChecklistByName = async (checkListName, checkListId) => {
  const query = `select * from ${checkListName}`;
  const checkListCompleteTableData = await sequelize.query(query, {
    searchPath: 'audit_tool',
    supportsSearchPath: true,
  });
  const checkListTypeAndDescription = await dbInstance.masterCheckList.findOne({
    where: { checklist_id: checkListId },
    attributes: ['type', 'description', 'remarks', 'checklist_id'],
    raw: true,
  });
  return { checkListCompleteTableData, checkListTypeAndDescription };
};

const dropTableRawQuery = async (query) => {
  await sequelize.query(query, { searchPath: 'audit_tool', supportsSearchPath: true });
};

const getLastCheckList = async () => {
  const lastCheckList = await dbInstance.masterCheckList.findAll({
    raw: true,
    limit: 1,
    attributes: ['checklist_id'],
    order: [['createdAt', 'DESC']],
  });
  return lastCheckList;
};

const findOrCreateChecklistTypeInDatabase = async (type) => {
  const findOrCreateChecklistType = await dbInstance.checklistType.findOrCreate({
    where: { type },
    type,
    raw: true,
  });
  return findOrCreateChecklistType;
};

const allCheckListTypes = async () => {
  const allCheckListTypesFromCheckListTable = await dbInstance.checklistType.findAll({
    raw: true,
    attributes: ['id', 'type', 'description'],
  });
  return allCheckListTypesFromCheckListTable;
};

const createTableAndInsertCheckListData = async ({
  queryToCreateTable,
  insertDataQuery,
  checkListTypeInfo,
  checkListId,
}) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      // create checklist table using raw query along with its columns
      const createdCheckListTable = await sequelize.query(queryToCreateTable, {
        searchPath: 'audit_tool',
        supportsSearchPath: true,
        transaction: t,
      });

      // insert the checklist data to respective columns to dynamically created checklist
      const insertToCheckListTable = await sequelize.query(insertDataQuery, {
        searchPath: 'audit_tool',
        supportsSearchPath: true,
        transaction: t,
      });

      const { type, description } = checkListTypeInfo;
      /**
       * @description save the checklist information in master checklist table
       * @ignore below comment - backup code
       * const checklistIdModified = checkListId.toString().replace(`_${type}`, '');
       * checklist_id: checklistIdModified,
       */
      const saveToMasterTable = await dbInstance.masterCheckList.create(
        {
          checklist_id: checkListId.toString().replace(`_${type}`, ''),
          type,
          description,
          checklist_tablename: checkListId,
        },
        { transaction: t },
      );
      return { saveToMasterTable, insertToCheckListTable, createdCheckListTable };
    });
    return result;
  } catch (error) {
    throw new Error('transaction Error');
  }
};

module.exports = {
  createTableAndInsertCheckListData,
  getAllCheckList,
  getOneChecklistByName,
  getLastCheckList,
  dropTableRawQuery,
  findOrCreateChecklistTypeInDatabase,
  allCheckListTypes,
};
