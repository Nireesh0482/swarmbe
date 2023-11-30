/* eslint-disable camelcase */
const { Op } = require('sequelize');
const dbInstance = require('../../models');
const resourceMgmtRepo = require('./resourceManagementRepository');

// get all allocation details from database
const allocationDetails = async () => {
  const allocationData = await dbInstance.promAllocation.findAll({
    raw: true,
    attributes: [
      [
        dbInstance.Sequelize.fn(
          'ARRAY_AGG',
          dbInstance.Sequelize.fn('DISTINCT', dbInstance.Sequelize.col('allocation')),
        ),
        'allocation',
      ],
    ],
  });
  return allocationData[0].allocation;
};

const getAllResourceAllocationForBufferProject = async (employeeIds) => {
  const getAllEmployeeForBuffer = await dbInstance.promAvinProjectDetails.findOne({
    where: { project_type: 'Buffer' },
    attributes: [],
    include: [
      {
        model: dbInstance.promAvinResourceAllocation,
        as: 'promAvinResourceAllocation',
        where: { resource_emp_id: employeeIds },
      },
    ],
  });

  return JSON.parse(JSON.stringify(getAllEmployeeForBuffer));
};

const getBufferProjectCode = async () => {
  const bufferProjectCode = await dbInstance.promAvinProjectDetails.findOne({
    where: { project_type: 'Buffer' },
    attributes: [[dbInstance.Sequelize.fn('ARRAY_AGG', dbInstance.Sequelize.col('project_code')), 'project_code']],
    raw: true,
  });
  return bufferProjectCode;
};

const updateResourceStatusBasedOnProject = async (resourceAllocationDetails, bufferProjectCode) => {
  /**
   * update status code for each employee based on project_code from frontend
   * if project_code(from front-end) belongs to buffer project, then set resource_status as Buffer for that employee
   * in resource_management Table else set as Active.
   */
  const updateResourceToActive = await Promise.all(
    resourceAllocationDetails.map(async ({ resource_emp_id, project_code }) => {
      const status = bufferProjectCode.includes(project_code) ? 'Buffer' : 'Active';
      const updateStatus = await dbInstance.promAvinEmployeeDetails.update(
        { resource_status: status },
        { where: { resource_emp_id } },
      );

      return updateStatus;
    }),
  );
  return updateResourceToActive;
};

const deleteEmployeesBufferRecordsAndChangeStatus = async (resourceAllocationDetails) => {
  if (resourceAllocationDetails.length === 0) {
    return { deletedResourceAllocationRecords: 0, employeeUpdateStatus: 0 };
  }
  const employeeIds = resourceAllocationDetails.map(({ resource_emp_id }) => resource_emp_id);
  const employeeSet = [...new Set(employeeIds)]; // remove duplicates

  // get employee's Buffer record information(if they are previously allocated to buffer project)
  // in avin_project_details table using association of resourceAllocation table
  const bufferProjectForEmployees = await getAllResourceAllocationForBufferProject(employeeSet);

  // get buffer project code from table, it used to compare with incoming project code and set
  // employee status
  const bufferProjectCodeFromDb = await getBufferProjectCode();

  // if bufferProject is null(then No buffer data in table) then return
  if (!bufferProjectForEmployees) {
    // update the status of employee based on incoming project_code (mostly either to buffer or Active)
    const updateResourceToActive = await updateResourceStatusBasedOnProject(
      resourceAllocationDetails,
      bufferProjectCodeFromDb.project_code,
    );
    return { deletedResourceAllocationRecords: 0, employeeUpdateStatus: updateResourceToActive.length };
  }
  // update the status of employee based on incoming project_code (mostly either to buffer or Active)
  const updateResourceToActive = await updateResourceStatusBasedOnProject(
    resourceAllocationDetails,
    bufferProjectCodeFromDb.project_code,
  );

  // if bufferProject has records then get array ra_id( primary key of table )
  const rowIdsToDeleteResourceAllocation = bufferProjectForEmployees.promAvinResourceAllocation.map(
    ({ ra_id }) => ra_id,
  );

  // using array of ra_id delete the records from the resource allocation table.
  const deleteResourceBufferAllocation = await dbInstance.promAvinResourceAllocation.destroy({
    where: { ra_id: rowIdsToDeleteResourceAllocation },
  });

  return {
    deletedResourceAllocationRecords: deleteResourceBufferAllocation,
    employeeUpdateStatus: updateResourceToActive.length,
  };
};

const getAllBufferProjectFromDb = async () => {
  const allBufferProjectCode = await dbInstance.promAvinProjectDetails.findAndCountAll({
    where: { project_type: 'Buffer' },
    attributes: ['project_code'],
    raw: true,
  });
  return allBufferProjectCode;
};

const addResourceAllocationDetailsToDB = async (resourceAllocationDetails) => {
  // delete buffer records of employee ,because employee is
  const deleteBufferRecordsOfEmployee = await deleteEmployeesBufferRecordsAndChangeStatus(resourceAllocationDetails);

  const allocationData = await dbInstance.promAvinResourceAllocation.bulkCreate(resourceAllocationDetails, {
    returning: true,
    raw: true,
  });

  return { allocationData, deleteBufferRecordsOfEmployee };
};

const resourceAllocationData = async () => {
  const resourceData = await dbInstance.promAvinResourceAllocation.findAll({
    raw: true,
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'] },
  });
  return resourceData;
};

const getSelectedResourceAllocationDetailsDateFormatted = async (resourceEmpIdsArray) => {
  const resourceAllocation = await dbInstance.promAvinResourceAllocation.findAll({
    where: { resource_emp_id: resourceEmpIdsArray },
    raw: true,
    attributes: [
      'ra_id',
      'resource_emp_id',
      'project_code',
      'supervisor',
      'allocation',
      'billable_resource',
      'resource_status_in_project',
      [dbInstance.Sequelize.literal('to_char("start_date", \'YYYY-MM-DD\')'), 'start_date'],
      [dbInstance.Sequelize.literal('to_char("end_date", \'YYYY-MM-DD\')'), 'end_date'],
    ],
  });
  return resourceAllocation;
};

const deleteResourceAllocationInDb = async (rowIdsForDelete) => {
  const deletedResource = await dbInstance.promAvinResourceAllocation.destroy({
    where: { ra_id: rowIdsForDelete },
  });
  return deletedResource;
};

const getAllocationDetailsByProjectId = async (projectCode) => {
  const allocationDetailsById = await dbInstance.promAvinResourceAllocation.findAll({
    raw: true,
    where: projectCode === 'All' ? undefined : { project_code: projectCode },
    attributes: [
      [dbInstance.sequelize.fn('gen_random_uuid'), 'key'],
      'ra_id',
      'resource_emp_id',
      'project_code',
      'supervisor',
      'allocation',
      'billable_resource',
      'resource_status_in_project',
      [dbInstance.Sequelize.literal('to_char("start_date", \'YYYY-MM-DD\')'), 'start_date'],
      [dbInstance.Sequelize.literal('to_char("end_date", \'YYYY-MM-DD\')'), 'end_date'],
      [dbInstance.sequelize.col('promAvinProjectDetails.project_bu_name'), 'project_bu_name'],
      [dbInstance.sequelize.col('promAvinEmployeeDetails.resource_name'), 'resource_name'],
    ],
    include: [
      {
        model: dbInstance.promAvinProjectDetails,
        as: 'promAvinProjectDetails',
        attributes: [],
      },
      {
        model: dbInstance.promAvinEmployeeDetails,
        as: 'promAvinEmployeeDetails',
        attributes: [],
      },
    ],
  });

  return allocationDetailsById;
};

const updateAllocationData = async (updateData) => {
  const deleteBufferRecordsOfEmployee = await deleteEmployeesBufferRecordsAndChangeStatus(updateData);

  const updateExistingData = await dbInstance.promAvinResourceAllocation.bulkCreate(updateData, {
    updateOnDuplicate: [
      'ra_id',
      'resource_emp_id',
      'project_code',
      'supervisor',
      'start_date',
      'end_date',
      'allocation',
      'billable_resource',
      'resource_status_in_project',
    ],
  });
  return { updateExistingData, deleteBufferRecordsOfEmployee };
};

const getProjectPlannedResourceAndPlannedCostByProjectId = async (projectCode) => {
  const projectResourcePlan = await dbInstance.promAvinProjectResourceAndCostPlan.findAll({
    where: { project_code: projectCode },
    raw: true,
  });
  return projectResourcePlan;
};

const addProjectResourcePlan = async (arrayOfResourceData) => {
  const addProjectResourcePlanToDb = await dbInstance.promAvinProjectResourceAndCostPlan.bulkCreate(
    arrayOfResourceData,
    { returning: true },
  );
  return addProjectResourcePlanToDb;
};

const updateProjectResourcePlan = async (arrayOfResourceData) => {
  const addProjectResourcePlanToDb = await dbInstance.promAvinProjectResourceAndCostPlan.bulkCreate(
    arrayOfResourceData,
    { updateOnDuplicate: ['planned_resource', 'planned_cost'] },
  );
  return addProjectResourcePlanToDb;
};

const getAllProjectResourcePlan = async () => {
  const allProjectResourcePlan = await dbInstance.promAvinProjectResourceAndCostPlan.findAll({
    raw: true,
  });
  return allProjectResourcePlan;
};

const getAllResourceDetailsForCronJob = async ({ nextMonthStartDate, nextMonthEndDate }) => {
  const allResourceData = await dbInstance.promAvinResourceAllocation.findAll({
    raw: true,
    attributes: [
      'ra_id',
      'resource_emp_id',
      'project_code',
      'supervisor',
      'allocation',
      [dbInstance.Sequelize.literal('to_char("start_date", \'YYYY-MM-DD\')'), 'start_date'],
      [dbInstance.Sequelize.literal('to_char("end_date", \'YYYY-MM-DD\')'), 'end_date'],
      'resource_status_in_project',
    ],
    where: dbInstance.sequelize.literal(
      `(start_date, end_date) OVERLAPS (${dbInstance.sequelize.escape(
        nextMonthStartDate,
      )}, ${dbInstance.sequelize.escape(nextMonthEndDate)})`,
    ),
  });
  return allResourceData;
};

const getAllProjectDetailsForCronJob = async ({ currentMonthStartDate, currentMonthEndDate }) => {
  const allProjectData = await dbInstance.promAvinResourceAllocation.findAll({
    raw: true,
    attributes: ['resource_emp_id', 'project_code', 'supervisor', 'allocation'],
    where: dbInstance.sequelize.literal(
      `(start_date, end_date) OVERLAPS (${dbInstance.sequelize.escape(
        currentMonthStartDate,
      )}, ${dbInstance.sequelize.escape(currentMonthEndDate)})`,
    ),
  });
  return allProjectData;
};

const getProjectPlannedActualResourceCount = async (
  { currentMonthStartDate, currentMonthEndDate },
  currentMonthYear,
) => {
  const projectPlannedActualData = await dbInstance.groupDetails.findAll({
    attributes: ['bu_name', 'bu_head'],
    include: [
      {
        model: dbInstance.promAvinProjectDetails,
        as: 'projectGroupFk',
        where: {
          project_bu_name: { [Op.eq]: dbInstance.Sequelize.col('bu_details.bu_name') },
          project_type: { [Op.ne]: 'Buffer' },
        },
        attributes: ['project_code', 'project_name', 'project_manager'],
        include: [
          {
            model: dbInstance.promAvinEmployeeDetails,
            as: 'promAvinEmployeeDetails',
            where: { resource_emp_id: { [Op.eq]: dbInstance.Sequelize.col('projectGroupFk.project_manager') } },
            attributes: ['resource_emp_id', 'email_id', 'resource_name'],
          },
          {
            model: dbInstance.promAvinResourceAllocation,
            as: 'promAvinResourceAllocation',
            attributes: [
              'project_code',
              'resource_emp_id',
              [dbInstance.Sequelize.literal('to_char("start_date", \'YYYY-MM-DD\')'), 'start_date'],
              [dbInstance.Sequelize.literal('to_char("end_date", \'YYYY-MM-DD\')'), 'end_date'],
              'allocation',
            ],
            where: dbInstance.sequelize.literal(
              `(start_date, end_date) OVERLAPS (${dbInstance.sequelize.escape(
                currentMonthStartDate,
              )}, ${dbInstance.sequelize.escape(currentMonthEndDate)})`,
            ),
          },
          {
            model: dbInstance.promAvinProjectResourceAndCostPlan,
            as: 'promAvinProjectResourceAndCostPlan',
            where: { month_year: currentMonthYear },
            attributes: ['project_code', 'month_year', ['planned_resource', 'planned_resou']],
          },
        ],
      },
      // {
      //   model: dbInstance.promAvinEmployeeDetails,
      //   as: 'groupEmployees',
      //   where: { resource_emp_id: { [Op.eq]: dbInstance.Sequelize.col('bu_details.bu_head') } },
      //   attributes: ['resource_emp_id', 'email_id'],
      // },
    ],
  });
  return JSON.parse(JSON.stringify(projectPlannedActualData));
};

const getGroupHeadInfo = async () => {
  // const groupHeadData = await dbInstance.groupDetails.findAll({
  //   attributes: ['bu_name', 'bu_head', [dbInstance.sequelize.col('groupEmployees.email_id'), 'email_id']],
  //   raw: true,
  //   include: [
  //     {
  //       model: dbInstance.promAvinEmployeeDetails,
  //       as: 'groupEmployees',
  //       where: { resource_emp_id: { [Op.eq]: dbInstance.Sequelize.col('bu_details.bu_head') } },
  //       attributes: [],
  //     },
  //   ],
  // });
  // return JSON.parse(JSON.stringify(groupHeadData));

  let groupHeadData = await dbInstance.groupDetails.findAll({
    attributes: { exclude: ['bu_id', 'bu_code', 'remarks'] },
    raw: true,
  });
  const resourceData = await resourceMgmtRepo.fetchAllResources();
  groupHeadData = groupHeadData.map(({ bu_head, ...restData }) => {
    const empEmail = resourceData.find(({ resource_emp_id }) => resource_emp_id === bu_head);
    return { ...restData, bu_head, email_id: empEmail.email_id };
  });
  return JSON.parse(JSON.stringify(groupHeadData));
};

const getEmployeeManagerWithTheirManagerDetails = async (employeeIds) => {
  const employeeManagersDetails = await dbInstance.promAvinEmployeeDetails.findAll({
    where: { resource_emp_id: employeeIds },
    attributes: ['email_id', 'resource_name', 'reporting_manager', ['resource_emp_id', 'employeeId']],
    raw: true,
    nest: true,
    include: [
      {
        model: dbInstance.promAvinEmployeeDetails,
        as: 'reportingManagerDetails',
        attributes: ['email_id', 'resource_name', 'reporting_manager', 'resource_emp_id'],
        include: [
          {
            model: dbInstance.promAvinEmployeeDetails,
            as: 'reportingManagerDetails',
            attributes: ['email_id', 'resource_name', 'resource_emp_id'],
          },
        ],
      },
    ],
  });
  return employeeManagersDetails;
};

const getBufferProjectEmployees = async () => {
  const bufferProjectEmployee = await dbInstance.promAvinProjectDetails.findAll({
    where: { project_type: 'Buffer' },
    attributes: ['project_code'],
    include: [
      {
        model: dbInstance.promAvinResourceAllocation,
        as: 'promAvinResourceAllocation',
        attributes: ['resource_emp_id'],
      },
    ],
  });
  return JSON.parse(JSON.stringify(bufferProjectEmployee));
};

const addResourceToBufferProjectAndUpdateStatus = async (resourceAllocationDetails) => {
  const allocationData = await dbInstance.promAvinResourceAllocation
    .bulkCreate(resourceAllocationDetails, {
      returning: true,
      raw: true,
    })
    .then(async (resourceAllocation) => {
      const updateStatusInResourceTable = await Promise.all(
        resourceAllocation.map(async ({ resource_emp_id }) => {
          const updated = await dbInstance.promAvinEmployeeDetails.update(
            { resource_status: 'Buffer' },
            { where: { resource_emp_id }, fields: ['resource_status'] },
          );
          return updated;
        }),
      );
      return updateStatusInResourceTable;
    });
  return allocationData;
};

const getEmployeeGroupAndItsProjectCodesFromDb = async (employeeIds) => {
  const employeeGroupAndProjectCodes = await dbInstance.promAvinEmployeeDetails.findAll({
    raw: true,
    where: {
      resource_emp_id: employeeIds,
    },
    group: ['resource_emp_id'],
    attributes: [
      'resource_emp_id',
      [dbInstance.Sequelize.fn('ARRAY_AGG', dbInstance.Sequelize.col('employeeProjects.project_code')), 'projectCodes'],
    ],
    include: [
      {
        model: dbInstance.promAvinProjectDetails,
        as: 'employeeProjects',
        attributes: [],
      },
    ],
  });
  return employeeGroupAndProjectCodes;
};

const getEmployeeManagerWithTheirGroupHeadsDetails = async () => {
  const groupHeadDetails = await dbInstance.groupDetails.findAll({
    attributes: ['bu_name', 'bu_head', [dbInstance.sequelize.col('groupEmployees.email_id'), 'email_id']],
    raw: true,
    include: [
      {
        model: dbInstance.promAvinEmployeeDetails,
        as: 'groupEmployees',
        where: { resource_emp_id: { [Op.eq]: dbInstance.Sequelize.col('bu_details.bu_head') } },
        attributes: [],
      },
    ],
  });
  return JSON.parse(JSON.stringify(groupHeadDetails));
};

const addPartiallyResourceToBufferProjectAndUpdateStatus = async (resourceAllocationDetails) => {
  const allocationData = await dbInstance.promAvinResourceAllocation
    .bulkCreate(resourceAllocationDetails, {
      returning: true,
      raw: true,
    })
    .then(async (resourceAllocation) => {
      const updateStatusInResourceTable = await Promise.all(
        resourceAllocation.map(async ({ resource_emp_id }) => {
          const updated = await dbInstance.promAvinEmployeeDetails.update(
            { resource_status: 'Buffer' },
            { where: { resource_emp_id }, fields: ['resource_status'] },
          );
          return updated;
        }),
      );
      return updateStatusInResourceTable;
    });
  return allocationData;
};

module.exports = {
  getEmployeeGroupAndItsProjectCodesFromDb,
  deleteResourceAllocationInDb,
  updateProjectResourcePlan,
  getAllBufferProjectFromDb,
  addResourceAllocationDetailsToDB,
  resourceAllocationData,
  updateAllocationData,
  getAllocationDetailsByProjectId,
  addProjectResourcePlan,
  getProjectPlannedResourceAndPlannedCostByProjectId,
  getAllProjectResourcePlan,
  allocationDetails,
  getAllResourceDetailsForCronJob,
  getEmployeeManagerWithTheirManagerDetails,
  getBufferProjectEmployees,
  addResourceToBufferProjectAndUpdateStatus,
  getSelectedResourceAllocationDetailsDateFormatted,
  getAllProjectDetailsForCronJob,
  getProjectPlannedActualResourceCount,
  getGroupHeadInfo,
  getEmployeeManagerWithTheirGroupHeadsDetails,
  addPartiallyResourceToBufferProjectAndUpdateStatus,
};
