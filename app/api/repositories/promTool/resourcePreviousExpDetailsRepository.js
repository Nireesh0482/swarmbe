const dbInstance = require('../../models');

const fetchAllResourcePreviousExpDetails = async () => {
  const resourceSkillData = await dbInstance.resourcePreviousExpDetails.findAll({
    raw: true,
  });
  return resourceSkillData;
};

const getResourcePreviousExpDetailsById = async (request) => {
  const resourceSkillData = await dbInstance.resourcePreviousExpDetails.findAll({
    where: { resource_emp_id: request.resource_emp_id },
    raw: true,
  });
  return resourceSkillData;
};



// const uploadResourcePreviousExpDetailsDetails = async (request) => {
//   const insertedResourceSkillData = await dbInstance.resourcePreviousExpDetails.bulkCreate(request);
//   return insertedResourceSkillData;
// };

const uploadResourcePreviousExpDetailsDetails = async (request) => {
  const insertedResourceSkillData = await dbInstance.resourcePreviousExpDetails.bulkCreate(request);

  await Promise.all(
    insertedResourceSkillData.map(async ({ resource_emp_id: employeeId }) => {
      const totalResourceExpData = await sumOfResourceExp(employeeId);
      const totalResourceExp = parseFloat(totalResourceExpData.totalResourceExp) || 0;
      await updateResourceExpDataInResourceMang(employeeId, totalResourceExp);
    })
  );

  return insertedResourceSkillData;
};

const updateResourceExpDataInResourceMang = async (employeeId, totalResourceExp) => {
  try {
    const years = Math.floor(totalResourceExp);
    const remainingMonths = parseFloat((totalResourceExp - years).toFixed(2));
    const months = Math.floor(remainingMonths * 100);
    const diffYears = years + Math.floor(months / 12);
    const diffMonths = months % 12;

    const updatedData = await dbInstance.promAvinEmployeeDetails.update(
      { total_years_exp: diffYears + diffMonths / 100 },
      {
        where: { resource_emp_id: employeeId },
      }
    );

    return updatedData;
  } catch (error) {
    throw error;
  }
};

const updateResourcePreviousExpData = async (request) => {
  const updatedData = await dbInstance.resourcePreviousExpDetails.bulkCreate(request, {
    updateOnDuplicate: ['res_previous_exp_id', 'resource_emp_id', 'years_of_exp', 'previous_company_details', 'joining_date', 'last_working_date'],
  });
  await Promise.all(
    updatedData.map(async ({ resource_emp_id: employeeId }) => {
      const totalResourceExpData = await sumOfResourceExp(employeeId);
      const totalResourceExp = parseFloat(totalResourceExpData.totalResourceExp) || 0;
      await updateResourceExpDataInResourceMang(employeeId, totalResourceExp);
    })
  );

  return updatedData;
};

const sumOfResourceExp = async (employeeId) => {
  const reportData = await dbInstance.resourcePreviousExpDetails.findOne({
    where: {
      resource_emp_id: employeeId,
    },
    attributes: [[dbInstance.sequelize.fn('sum', dbInstance.sequelize.col('years_of_exp')), 'totalResourceExp']],
    raw: true,
  });
  return reportData;
};


// const fetchAllAvinDetails = async () => {
//   const resourceSkillData = await dbInstance.resourcePreviousExpDetails.findAll({
//     where: { previous_company_details: 'AVIN systems private limited' },
//     raw: true,
//   });
//   return resourceSkillData;
// };

const fetchAllAvinDetails = async () => {
  const resourceExist = await dbInstance.resourcePreviousExpDetails.findAll({
    where: { previous_company_details: 'AVIN systems private limited' },
    attributes: [
      'resource_emp_id',
      'years_of_exp',
      'previous_company_details',
      'joining_date',
      'last_working_date',
    ],
    include: [
      {
        model: dbInstance.promAvinEmployeeDetails,
        as: 'promAvinEmployeeDetails',
        where: {resource_status: ['Active', 'Buffer', 'Resigned']},
        attributes: [],
      },
  ],
  });
  return resourceExist;
};

const getResourceExpDataById = async (request) => {
  const resourceSkillData = await dbInstance.resourcePreviousExpDetails.findAll({
    where: { resource_emp_id: request },
    raw: true,
  });
  return resourceSkillData;
};

module.exports = {
  fetchAllResourcePreviousExpDetails,
  getResourcePreviousExpDetailsById,
  uploadResourcePreviousExpDetailsDetails,
  updateResourcePreviousExpData,
  sumOfResourceExp,
  fetchAllAvinDetails,
  getResourceExpDataById,
};
