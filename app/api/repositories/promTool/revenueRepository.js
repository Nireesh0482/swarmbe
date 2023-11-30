const dbInstance = require('../../models');

const insertRevenueData = async (RevenueData) => {
  const insertedRevenueData = await dbInstance.promAvinProjectOperationData.bulkCreate(RevenueData);
  return insertedRevenueData;
};

const fetchAllRevenue = async () => {
  const RevenueData = await dbInstance.promAvinProjectOperationData.findAll({
    raw: true,
    attributes: [
      'opr_id',
      'project_code',
      'revenue_date',
      'revenue',
      [dbInstance.sequelize.col('promAvinProjectDetails.project_name'), 'project_name'],
      [dbInstance.sequelize.col('promAvinProjectDetails.project_bu_name'), 'project_bu_name'],
    ],
    include: [
      {
        model: dbInstance.promAvinProjectDetails,
        as: 'promAvinProjectDetails',
        attributes: [],
      },
    ],
  });
  return RevenueData;
};

const getRevenueDataById = async (request) => {
  const RevenueData = await dbInstance.promAvinProjectOperationData.findOne({
    where: { opr_id: request.opr_id },
    raw: true,
    attributes: [
      'opr_id',
      'project_code',
      'revenue_date',
      'revenue',
      [dbInstance.sequelize.col('promAvinProjectDetails.project_name'), 'project_name'],
      [dbInstance.sequelize.col('promAvinProjectDetails.project_bu_name'), 'project_bu_name'],
    ],
    include: [
      {
        model: dbInstance.promAvinProjectDetails,
        as: 'promAvinProjectDetails',
        attributes: [],
      },
    ],
  });
  return RevenueData;
};

const updateRevenueData = async (request) => {
  const updatedData = await dbInstance.promAvinProjectOperationData.bulkCreate(request, {
    updateOnDuplicate: ['opr_id', 'project_code', 'revenue_date', 'revenue'],
  });
  return updatedData;
};

const getRevenueDetailsByProjectId = async (projectCode) => {
  const allRevenueDetails = await dbInstance.promAvinProjectOperationData.findAll({
    where: { project_code: projectCode },
    raw: true,
    attributes: [
      'opr_id',
      'project_code',
      'revenue_date',
      'revenue',
      [dbInstance.sequelize.col('promAvinProjectDetails.project_name'), 'project_name'],
      [dbInstance.sequelize.col('promAvinProjectDetails.project_bu_name'), 'project_bu_name'],
    ],
    include: [
      {
        model: dbInstance.promAvinProjectDetails,
        as: 'promAvinProjectDetails',
        attributes: [],
      },
    ],
  });
  return allRevenueDetails;
};

module.exports = {
  insertRevenueData,
  fetchAllRevenue,
  getRevenueDataById,
  updateRevenueData,
  getRevenueDetailsByProjectId,
};
