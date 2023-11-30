const revenueRepo = require('../../repositories/promTool/revenueRepository');

const fetchAllRevenue = async () => {
  const revenueData = await revenueRepo.fetchAllRevenue();
  return revenueData;
};

const getRevenueById = async (request) => {
  const revenueList = await revenueRepo.getRevenueDataById(request);
  return revenueList;
};

const insertRevenueDetails = async (RevenueData) => {
  const insertRevenue = await revenueRepo.insertRevenueData(RevenueData);
  return insertRevenue;
};

const updateRevenueData = async (request) => {
  const revenueInfo = await revenueRepo.updateRevenueData(request);
  return revenueInfo;
};

const getRevenueByProjectId = async (projectCode) => {
  const revenueByProjectId = await revenueRepo.getRevenueDetailsByProjectId(projectCode);
  return revenueByProjectId;
};

module.exports = {
  fetchAllRevenue,
  getRevenueById,
  insertRevenueDetails,
  updateRevenueData,
  getRevenueByProjectId,
};
