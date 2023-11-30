const { Op } = require('sequelize');
const dbInstance = require('../../models');
const { todayDate } = require('../../utils/date');

const fetchAllMaternityDetails = async (groupName, methodOfRequest) => {
  // if method is get Method then return all unique employee details with their name
  if (methodOfRequest) {
    const allMaternityEmployeeData = await dbInstance.maternityDetails.findAll({
      raw: true,
      attributes: [
        [
          dbInstance.sequelize.fn(
            'ARRAY_AGG',
            dbInstance.sequelize.fn('DISTINCT', dbInstance.sequelize.col('maternity_details.bu_name')),
          ),
          'groupNames',
        ],
      ],
    });
    return allMaternityEmployeeData[0].groupNames;
  }

  // else its a post request with employee id specific request
  const whereConditionForGroupName = groupName == null || groupName === 'All' ? undefined : { bu_name: groupName };

  const allMaternityData = await dbInstance.maternityDetails.findAll({
    where: whereConditionForGroupName,
    raw: true,
    attributes: [
      'id',
      'resource_emp_id',
      'bu_name',
      'reporting_manager',
      [dbInstance.Sequelize.literal('to_char("maternity_start_date", \'YYYY-MM-DD\')'), 'maternity_start_date'],
      [dbInstance.Sequelize.literal('to_char("maternity_end_date", \'YYYY-MM-DD\')'), 'maternity_end_date'],
      'internal_status',
      'remarks',
    ],
  });
  return allMaternityData;
};

const saveMaternityDetailsToDatabase = async (newMaternityDetails) => {
  const saveMaternityDetails = await dbInstance.maternityDetails.bulkCreate(newMaternityDetails);
  return saveMaternityDetails;
};

const updateMaternityDetailsInDatabase = async (updateDetails) => {
  const updateMaternityData = await dbInstance.maternityDetails.bulkCreate(updateDetails, {
    updateOnDuplicate: [
      'bu_name',
      'reporting_manager',
      'maternity_start_date',
      'maternity_end_date',
      'internal_status',
      'remarks',
    ],
    returning: true,
  });

  return updateMaternityData;
};

const deleteMaternityDetailsFromDatabase = async (deleteUsingRowIds) => {
  const deletedDetails = await dbInstance.maternityDetails.destroy({
    where: { id: deleteUsingRowIds },
  });
  return deletedDetails;
};

const getMaternityDetailsLessOrEqualToToday = async () => {
  const maternityDetails = await dbInstance.maternityDetails.findAll({
    attributes: ['id', 'resource_emp_id', 'bu_name', 'reporting_manager'],
    where: { maternity_end_date: { [Op.lte]: todayDate() }, internal_status: false },
    raw: true,
  });
  return maternityDetails;
};

const getBufferProjectForGroups = async (groupNames) => {
  const bufferProjects = await dbInstance.promAvinProjectDetails.findAll({
    attributes: ['project_code', ['project_bu_name', 'bu_name']],
    where: { project_bu_name: groupNames, project_type: 'Buffer' },
    raw: true,
  });
  return bufferProjects;
};

const updateInternalStatusForRowInMaternityTable = async (rowsIds) => {
  const updateAllRowsWithInternalStatus = await Promise.all(
    rowsIds.map(async (ele) => {
      const updatedInternalStatus = await dbInstance.maternityDetails.update(
        { internal_status: true },
        {
          where: { id: ele },
          returning: true,
        },
      );
      return updatedInternalStatus;
    }),
  );
  return updateAllRowsWithInternalStatus;
};

module.exports = {
  updateInternalStatusForRowInMaternityTable,
  getBufferProjectForGroups,
  getMaternityDetailsLessOrEqualToToday,
  saveMaternityDetailsToDatabase,
  updateMaternityDetailsInDatabase,
  deleteMaternityDetailsFromDatabase,
  fetchAllMaternityDetails,
};
