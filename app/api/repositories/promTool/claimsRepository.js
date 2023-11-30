const dbInstance = require('../../models');

const insertClaimData = async (claimData) => {
  const insertedClaimData = await dbInstance.promAvinProjectExpenses.bulkCreate(claimData);
  return insertedClaimData;
};

const fetchAllClaims = async () => {
  const ClaimData = await dbInstance.promAvinProjectExpenses.findAll({
    raw: true,
  });
  return ClaimData;
};

const getClaimDataById = async (request) => {
  const claimData = await dbInstance.promAvinProjectExpenses.findAll({
    where: { resource_emp_id: request.resource_emp_id },
    raw: true,
  });
  return claimData;
};

const fetchAllExpenseTypeData = async () => {
  const expenseData = await dbInstance.expenseType.findAll({
    attributes: ['expense_type'],
    raw: true,
  });
  return expenseData;
};

const getAllResourceByProject = async () => {
  const resourceData = await dbInstance.promAvinResourceAllocation.findAll({
    attributes: ['project_code', 'resource_emp_id'],
    raw: true,
  });
  return resourceData;
};

const getAllResourceByEmpId = async (employeeID) => {
  const resourceData = await dbInstance.promAvinEmployeeDetails.findOne({
    where: { resource_emp_id: employeeID },
    attributes: ['resource_name', 'resource_emp_id'],
    raw: true,
  });

  return resourceData;
};

const getAllClaimsByProjectId = async (projectCode) => {
  // get all Claims using Project_code and Date should be approved
  const projectClaims = await dbInstance.promAvinProjectExpenses.findAll({
    where: { project_code: projectCode },
    attributes: ['project_code', 'resource_emp_id', 'expense_type', 'date', 'amount', 'approver', 'approved_date'],
    raw: true,
  });
  return projectClaims;
};

const getClaimsByApproverId = async (request) => {
  const claimData = await dbInstance.promAvinProjectExpenses.findAll({
    attributes: [
      'pe_id',
      'project_code',
      'resource_emp_id',
      'expense_type',
      'date',
      'amount',
      'remarks',
      'approver',
      'approved_date',
    ],
    where: { approver: request.approver, claim_status: 'Pending' },

    raw: true,
  });
  return claimData;
};

const updateApprovedStatus = async (request) => {
  const updatedData = await dbInstance.promAvinProjectExpenses.update(
    { claim_status: 'Rejected' },
    { where: { pe_id: request } },
  );
  return updatedData;
};

const updateApprovedStatusDate = async (request) => {
  const updatedData = await dbInstance.promAvinProjectExpenses.update(
    {
      approved_date: new Date(),
      claim_status: 'Approved',
    },
    { where: { pe_id: request } },
  );
  return updatedData;
};

const getApprover = async (request) => {
  const approverData = await dbInstance.promAvinProjectExpenses.findOne({
    where: { pe_id: request },
    raw: true,
  });
  return approverData;
};

const getAllResourceByProj = async (request) => {
  const resourceData = await dbInstance.promAvinResourceAllocation.findAll({
    attributes: ['project_code', 'resource_emp_id'],
    where: { project_code: request },
    raw: true,
  });
  return resourceData;
};

const uploadClaimData = async (claimData) => {
  const insertedClaimData = await dbInstance.promAvinProjectExpenses.bulkCreate(claimData);
  return insertedClaimData;
};
module.exports = {
  insertClaimData,
  fetchAllClaims,
  getClaimDataById,
  fetchAllExpenseTypeData,
  getAllResourceByProject,
  getAllResourceByEmpId,
  getAllClaimsByProjectId,
  getClaimsByApproverId,
  updateApprovedStatus,
  getApprover,
  updateApprovedStatusDate,
  getAllResourceByProj,
  uploadClaimData,
};
