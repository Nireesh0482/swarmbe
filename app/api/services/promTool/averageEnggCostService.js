const enggCostRepo = require('../../repositories/promTool/averageEnggCostRepository');
const projectRepo = require('../../repositories/promTool/projectDataRepository');

const fetchAllEnggCost = async () => {
  const enggCostData = await enggCostRepo.fetchAllEnggCost();
  return enggCostData;
};

const getEnggCostById = async (request) => {
  const enggCostList = await enggCostRepo.getEnggCostDataById(request);
  return enggCostList;
};

const insertEnggCostDetails = async (EnggCostData) => {
  const insertEnggCost = await enggCostRepo.insertEnggCostData(EnggCostData);
  return insertEnggCost;
};

const updateEnggCostData = async (request) => {
  const avgEngCostUpdate = await enggCostRepo.updateEnggCostData(request);

  // extract true(1) or false(0) for sequelize update.
  // if plannedCostAndAverageEnggCostUpdate contains at least one true(i.e 1) then at least one table is updated
  const plannedCostAndAverageEnggCostUpdate = [
    avgEngCostUpdate.updatedAverageEnggCostData[0],
    avgEngCostUpdate.updatedAverageEnggCostData[0],
  ];
  return plannedCostAndAverageEnggCostUpdate;
};

const fetchAllEnggCostValue = async (req) => {
  const { project_code } = req.body[0];
  const enggCostData = await enggCostRepo.fetchAllEnggCost();
  const projectBuName = await projectRepo.fetchAllProjGroupNameDataforAvgEngg(project_code);

  const avgEnggCostData = enggCostData.filter((enggCost) => {
    return projectBuName.some((project) => project.dataValues.project_bu_name === enggCost.bu_name);
  });
 
  return avgEnggCostData;
};


module.exports = {
  fetchAllEnggCost,
  getEnggCostById,
  insertEnggCostDetails,
  updateEnggCostData,
  fetchAllEnggCostValue,
};
