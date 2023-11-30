/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */
const { Op } = require('sequelize');
const dbInstance = require('../../models');
const { Sequelize } = require('../../models');

const updateCostCenterDB = async (costCenterData) => {
  const updatedCostCenterData = await dbInstance.costCenter.bulkCreate(costCenterData, {
    updateOnDuplicate: ['id', 'cost_center_code', 'cost_center_name', 'cost_center_head', 'remarks'],
    validate: true,
  });
  return updatedCostCenterData;
};
const createCostCenterDB = async (costCenterData) => {
  const insertedCostCenterData = await dbInstance.costCenter.bulkCreate(costCenterData);
  return insertedCostCenterData;
};
// get  costCenters by code
const getOneCostCenterByCode = async (request) => {
  const oneCostCenter = await dbInstance.costCenter.findOne({
    where: { cost_center_code: request.cost_center_code },
    include: [
      {
        model: dbInstance.employeeData,
        as: 'employeeData',
        attributes: [['emp_name', 'cost_center_head_name']],
        on: {
          emp_id: { [Op.eq]: Sequelize.col('avin_cost_centers.cost_center_head') },
        },
      },
    ],
    attributes: ['id', 'cost_center_code', 'cost_center_name', 'cost_center_head', 'remarks'],
    raw: true,
  });
  return oneCostCenter;
};

const getCostCenterData = async () => {
  const allCostCenterData = await dbInstance.costCenter.findAll({
    include: [
      {
        model: dbInstance.employeeData,
        as: 'employeeData',
        attributes: [['emp_name', 'cost_center_head_name']],
        on: {
          emp_id: { [Op.eq]: Sequelize.col('avin_cost_centers.cost_center_head') },
        },
      },
    ],
    raw: true,
  });
  return allCostCenterData;
};

const getCostCentreNameFromDatabase = async (costCentreId) => {
  const costCentreName = await dbInstance.costCenter.findOne({
    where: { cost_center_code: costCentreId },
    attributes: ['cost_center_name'],
    raw: true,
  });
  return costCentreName;
};

module.exports = {
  getCostCentreNameFromDatabase,
  createCostCenterDB,
  getOneCostCenterByCode,
  getCostCenterData,
  updateCostCenterDB,
};
