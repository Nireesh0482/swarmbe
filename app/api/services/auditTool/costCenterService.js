/* eslint-disable object-curly-newline */
/* eslint-disable camelcase */
const costCenterRepo = require('../../repositories/auditTool/costCenterRepository');
const { validateDuplicateEmployeeData: validateDuplicateCostCenterData } = require('./employeeService');

const duplicateValidationForCostCenter = (costCenterData) => {
  /**
   * @summary used duplicate validation of employee data for this cost center as well.
   * as it accepts array of any object and comparison field and gives the required output.
   * i.e duplicate object within the array
   * @returns rows index from frontend which are duplicate.
   */
  const duplicateCostCenterCode = validateDuplicateCostCenterData(costCenterData, 'cost_center_code');
  return duplicateCostCenterCode;
};

const createCostCenterData = async (request) => {
  let costCenterInfo;
  const insertArr = [];
  const updateArr = [];
  await Promise.all(
    request.map(async (costCenterCodeArr) => {
      const getCostCenterData = await costCenterRepo.getOneCostCenterByCode(costCenterCodeArr);
      const costCenterRecord = {
        cost_center_code: costCenterCodeArr.cost_center_code?.toString()?.trim(),
        cost_center_name: costCenterCodeArr.cost_center_name?.toString()?.trim(),
        cost_center_head: costCenterCodeArr.cost_center_head?.toString()?.trim(),
        remarks: costCenterCodeArr.remarks,
      };
      if (getCostCenterData !== null) {
        updateArr.push(costCenterRecord);
      } else {
        insertArr.push(costCenterRecord);
      }
    }),
  );
  if (insertArr.length > 0) {
    costCenterInfo = await costCenterRepo.createCostCenterDB(insertArr);
  }
  if (updateArr.length > 0) {
    costCenterInfo = await costCenterRepo.updateCostCenterDB(updateArr);
  }
  return costCenterInfo;
};

const getCostCentersByCode = async (request) => {
  const costCenterByCode = await costCenterRepo.getOneCostCenterByCode(request);
  return {
    id: costCenterByCode.id,
    cost_center_code: costCenterByCode.cost_center_code,
    cost_center_name: costCenterByCode.cost_center_name,
    cost_center_head: costCenterByCode.cost_center_head,
    remarks: costCenterByCode.remarks,
    cost_center_head_name: costCenterByCode['employeeData.cost_center_head_name'],
  };
};

const getAllCostCenters = async () => {
  const costCenterData = await costCenterRepo.getCostCenterData();
  const costArr = [];
  costCenterData.forEach((costData) => {
    costArr.push({
      id: costData.id,
      cost_center_code: costData.cost_center_code,
      cost_center_name: costData.cost_center_name,
      cost_center_head: costData.cost_center_head,
      remarks: costData.remarks,
      cost_center_head_name: costData['employeeData.cost_center_head_name'],
    });
  });
  return costArr;
};

const getCostCenterName = async (costCentreId) => {
  const costCenterName = await costCenterRepo.getCostCentreNameFromDatabase(costCentreId);

  if (costCenterName !== null) {
    return { costCenterName: costCenterName.cost_center_name };
  }
  return { costCenterName: null };
};

module.exports = {
  getCostCenterName,
  duplicateValidationForCostCenter,
  createCostCenterData,
  getCostCentersByCode,
  getAllCostCenters,
};
