const { Op } = require('sequelize');
const dbInstance = require('../../models');
const { sequelize } = require('../../models');

const getProjectByID = async (projectID) => {
  const existingProjectData = await dbInstance.promAvinProjectDetails.findOne({
    where: { project_code: projectID },
    raw: true,
  });
  return existingProjectData;
};

const fetchAllProjGroupNameData = async () => {
  // cost center Details is the project Group Name
  const allGroupDetails = await dbInstance.groupDetails.findAll({
    raw: true,
    attributes: ['bu_code', 'bu_name', 'bu_head', 'remarks'],
    order: [['bu_name', 'ASC']],
  });
  return allGroupDetails;
};

const updateProjectData = async (request) => {
  const pushExistingProjData = await dbInstance.promAvinProjectDetails.bulkCreate(request, {
    updateOnDuplicate: [
      'project_code',
      'project_name',
      'project_bu_name',
      'project_bu_head',
      'project_manager',
      'project_type',
      'project_start_date',
      'project_end_date',
      'po_ro_sow_number',
      'po_ro_sow_value',
      'project_status',
    ],
    validate: true,
    returning: true,
  });

  return pushExistingProjData;
};

const insertProjData = async (projectData) => {
  const insertedProjData = await dbInstance.promAvinProjectDetails.create(projectData);
  return insertedProjData;
};

const insertAllProjData = async (projectData) => {
  const insertedProjData = await dbInstance.promAvinProjectDetails.bulkCreate(projectData);
  return insertedProjData;
};

const fetchAllProjects = async () => {
  const projData = await dbInstance.promAvinProjectDetails.findAll({
    raw: true,
    attributes: [
      'id',
      'project_code',
      'project_name',
      'project_bu_name',
      'project_bu_head',
      'project_manager',
      'project_type',
      [dbInstance.Sequelize.literal('to_char("project_start_date", \'YYYY-MM-DD\')'), 'project_start_date'],
      [dbInstance.Sequelize.literal('to_char("project_end_date", \'YYYY-MM-DD\')'), 'project_end_date'],
      'po_ro_sow_number',
      'po_ro_sow_value',
      'project_status',
    ],
    order: [['project_bu_name', 'ASC']],
  });
  return projData;
};

const fetchAllProjectWithTheirEmployeeFromDb = async () => {
  const projectDataWithEmployee = await dbInstance.promAvinProjectDetails.findAll({
    attributes: [
      'id',
      'project_code',
      'project_name',
      'project_bu_name',
      'project_bu_head',
      'project_type',
      [dbInstance.Sequelize.literal('to_char("project_start_date", \'YYYY-MM-DD\')'), 'project_start_date'],
      [dbInstance.Sequelize.literal('to_char("project_end_date", \'YYYY-MM-DD\')'), 'project_end_date'],
      'po_ro_sow_number',
      'po_ro_sow_value',
      'project_status',
    ],
    include: [
      {
        model: dbInstance.groupDetails,
        as: 'projectGroupDetails',
        attributes: ['bu_name'],
        include: [
          {
            model: dbInstance.promAvinEmployeeDetails,
            as: 'groupEmployees',
            attributes: ['resource_name', 'resource_emp_id', 'reporting_manager'],
            where: { resource_status: { [Op.ne]: 'Inactive' } },
          },
        ],
      },
    ],
  });
  return JSON.parse(JSON.stringify(projectDataWithEmployee));
};

const getAllProjectDataById = async (request) => {
  const projectData = await dbInstance.promAvinProjectDetails.findAll({
    where: { project_code: request.project_code },
    raw: true,
  });
  return projectData;
};

const fetchAllProjStatusData = async () => {
  const statusData = await dbInstance.projectStatus.findAll({
    raw: true,
  });
  return statusData;
};

const fetchAllProjectStatusInArray = async () => {
  const projectStatusInArray = await dbInstance.projectStatus.findAll({
    raw: true,
    attributes: [
      [
        dbInstance.Sequelize.fn(
          'ARRAY_AGG',
          dbInstance.Sequelize.fn('DISTINCT', dbInstance.Sequelize.col('project_status')),
        ),
        'projectStatus',
      ],
    ],
  });
  return projectStatusInArray[0].projectStatus;
};

const fetchAllProjTypesData = async () => {
  const projTypeData = await dbInstance.projectTypes.findAll({
    raw: true,
  });
  return projTypeData;
};

const fetchAllProjectTypesInArray = async () => {
  const projectTypesInArray = await dbInstance.projectTypes.findAll({
    raw: true,
    attributes: [
      [
        dbInstance.Sequelize.fn(
          'ARRAY_AGG',
          dbInstance.Sequelize.fn('DISTINCT', dbInstance.Sequelize.col('project_type')),
        ),
        'projectTypes',
      ],
    ],
  });
  return projectTypesInArray[0].projectTypes;
};

const deleteProjectDataById = async (request) => {
  const updatedData = await dbInstance.promAvinProjectDetails.update(
    {
      project_status: 'Inactive',
    },
    { where: { project_code: request.project_code } },
  );
  return updatedData;
};

const getBufferProjectFromDatabase = async (employeeIds) => {
  const bufferProjectBelongToEmployeeGroup = await dbInstance.promAvinEmployeeDetails.findAll({
    where: { resource_emp_id: employeeIds },
    attributes: ['resource_emp_id', 'bu_name', 'reporting_manager'],
    raw: true,
    nest: true,
    include: [
      {
        model: dbInstance.groupDetails,
        as: 'employeeGroupName',
        attributes: ['bu_name'],
        where: { bu_name: { [Op.eq]: dbInstance.Sequelize.col('avin_employee_details.bu_name') } },
        include: [
          {
            model: dbInstance.promAvinProjectDetails,
            where: {
              project_type: 'Buffer',
            },
            as: 'projectGroupFk',
            attributes: ['project_code'],
          },
        ],
      },
    ],
  });

  return bufferProjectBelongToEmployeeGroup;
};

const getOrganizationGroupHeadEmployeeIds = async () => {
  // Here cost_center_name is considered as orgGroupName & cost_center_head as orgGroupHead
  const groupHeadEmployeeIds = await dbInstance.groupDetails.findAll({
    raw: true,
    attributes: [
      ['bu_name', 'orgGroupName'],
      ['bu_head', 'orgGroupHead'],
    ],
  });
  return groupHeadEmployeeIds;
};

const getAllPromProjectCodeInArray = async () => {
  const allProjectCodeInArray = await dbInstance.promAvinProjectDetails.findAll({
    raw: true,
    where: { project_status: { [Op.ne]: 'Closed' } },
    attributes: [[dbInstance.Sequelize.fn('ARRAY_AGG', dbInstance.Sequelize.col('project_code')), 'projectCodes']],
  });
  return allProjectCodeInArray[0].projectCodes;
};

const getAllPromProjectDetailsInArray = async () => {
  const allProjectCodeInArray = await dbInstance.promAvinProjectDetails.findAll({
    raw: true,
    where: { project_type: { [Op.ne]: 'Buffer' } },
    attributes: [
      'project_code',
      [dbInstance.Sequelize.literal('to_char("project_start_date", \'YYYY-MM\')'), 'project_start_date'],
      [dbInstance.Sequelize.literal('to_char("project_end_date", \'YYYY-MM\')'), 'project_end_date'],
    ],
  });
  return allProjectCodeInArray;
};

const fetchAllProjectStartAndEndDateUsingProjectCode = async () => {
  const projectDetails = await dbInstance.promAvinProjectDetails.findAll({
    raw: true,
    attributes: [
      'project_code',
      [dbInstance.Sequelize.literal('to_char("project_start_date", \'YYYY-MM-DD\')'), 'project_start_date'],
      [dbInstance.Sequelize.literal('to_char("project_end_date", \'YYYY-MM-DD\')'), 'project_end_date'],
    ],
  });
  return projectDetails;
};

const getMaxProjectStartDateBasedProject = async (request) => {
  let filterConditionBasedOnSelection;
  if (request.project_code !== '') {
    filterConditionBasedOnSelection = request.project_code === 'All' ? {} : { project_code: request.project_code };
  } else filterConditionBasedOnSelection = {};
  const projectMaxStartDate = await dbInstance.promAvinProjectDetails.findOne({
    where: filterConditionBasedOnSelection,
    order: [['project_start_date', 'ASC']],
    attributes: ['project_start_date'],
    raw: true,
  });
  return projectMaxStartDate;
};

const getMaxProjectStartDate = async (request) => {
  const filterConditionBasedOnSelection =
    request.project_bu_name[0] === 'All' ? {} : { project_bu_name: request.project_bu_name };

  const projectMaxStartDate = await dbInstance.promAvinProjectDetails.findOne({
    where: filterConditionBasedOnSelection,
    order: [['project_start_date', 'ASC']],
    attributes: ['project_start_date'],
    raw: true,
  });
  return projectMaxStartDate;
};

const getMaxProjectStartDateReports = async (request) => {
  let filterConditionBasedOnSelection;
  // const filterConditionBasedOnSelection =
  //   request.project_bu_name[0] === 'All' ? {} : { project_bu_name: request.project_bu_name };
  if (request.project_code[0] !== '') {
    filterConditionBasedOnSelection = request.project_code[0] === 'All' ? {} : { project_code: request.project_code };
  } else {
    filterConditionBasedOnSelection =
      request.project_bu_name === 'All' || request.project_bu_name === ''
        ? {}
        : { project_bu_name: request.project_bu_name };
  }
  const projectMaxStartDate = await dbInstance.promAvinProjectDetails.findOne({
    where: filterConditionBasedOnSelection,
    order: [['project_start_date', 'ASC']],
    attributes: ['project_start_date'],
    raw: true,
  });
  return projectMaxStartDate;
};

// code reuseability check
const getMaxProjectStartDateForgeneric = async (request) => {
  let filterConditionBasedOnSelection;
  if (request.project_code !== '') {
    filterConditionBasedOnSelection = request.project_code === 'All' ? {} : { project_code: request.project_code };
  } else {
    filterConditionBasedOnSelection =
      request.project_bu_name === 'All' || request.project_bu_name === ''
        ? {}
        : { project_bu_name: request.project_bu_name };
  }
  const projectMaxStartDate = await dbInstance.promAvinProjectDetails.findOne({
    where: filterConditionBasedOnSelection,
    order: [['project_start_date', 'ASC']],
    attributes: ['project_start_date'],
    raw: true,
  });
  return projectMaxStartDate;
};

const getMaxResourceStartDate = async (request) => {
  const filterConditionBasedOnSelection =
    request.resource_emp_id[0] === 'All' ? {} : { resource_emp_id: request.resource_emp_id };
  const projectMaxStartDate = await dbInstance.promAvinResourceAllocation.findOne({
    where: filterConditionBasedOnSelection,
    order: [['start_date', 'ASC']],
    attributes: ['start_date'],
    raw: true,
  });
  return projectMaxStartDate;
};

const getGRPRevenueByProject = async (request, getDatesInfo, requestedMonths) => {
  let filterConditionBasedOnSelection;
  if (request.bu_name) {
    filterConditionBasedOnSelection = request.bu_name === 'All' ? {} : { bu_name: request.bu_name };
  } else
    filterConditionBasedOnSelection =
      request.project_bu_name[0] === 'All' ? {} : { bu_name: request.project_bu_name };
  const groupRevenue = await dbInstance.groupDetails.findAll({
    where: filterConditionBasedOnSelection,
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    include: [
      {
        model: dbInstance.promAvinProjectDetails,
        as: 'projectGroupFk',
        attributes: [
          'project_code',
          [dbInstance.Sequelize.literal('to_char("project_start_date", \'YYYY-MM\')'), 'project_start_date'],
          [dbInstance.Sequelize.literal('to_char("project_end_date", \'YYYY-MM\')'), 'project_end_date'],
          'po_ro_sow_value',
        ],
        required: false,
        where: {
          [Op.and]: sequelize.literal(
            `(project_start_date, project_end_date) OVERLAPS (${dbInstance.sequelize.escape(
              getDatesInfo.request.start_date,
            )}, ${dbInstance.sequelize.escape(getDatesInfo.request.end_date)})`,
          ),
        },
        // where: {
        //   [Op.and]: [
        //     {
        //       [Op.and]: [
        //         { project_start_date: { [Op.gte]: getDatesInfo.request.start_date } },
        //         { project_start_date: { [Op.lte]: getDatesInfo.request.end_date } },
        //       ],
        //     },
        //     {
        //       [Op.and]: [
        //         { project_end_date: { [Op.gte]: getDatesInfo.request.start_date } },
        //         { project_end_date: { [Op.lte]: getDatesInfo.request.end_date } },
        //       ],
        //     },
        //   ],
        // },
        include: [
          {
            model: dbInstance.promAvinProjectOperationData,
            as: 'promAvinProjectOperationData',
            required: false,
            where: { revenue_date: requestedMonths },
            attributes: ['revenue_date', 'revenue'],
          },
        ],
      },
      // {
      //   model: dbInstance.organizationGRPMgmt,
      //   as: 'projectGroupAndOrgGroupNames',
      //   required: false,
      //   where: { aop_month: requestedMonths },
      // },
    ],
  });
  return JSON.parse(JSON.stringify(groupRevenue));
};

const getGRPAOPInfo = async (request, requestedMonths) => {
  const filterConditionBasedOnSelection =
    request.project_bu_name[0] === 'All' ? {} : { bu_name: request.project_bu_name };
  const groupRevenue = await dbInstance.groupDetails.findAll({
    where: filterConditionBasedOnSelection,
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    include: [
      {
        model: dbInstance.promAvinProjectDetails,
        as: 'projectGroupFk',
        attributes: ['project_code'],
        include: [
          {
            model: dbInstance.promAvinProjectResourceAndCostPlan,
            as: 'promAvinProjectResourceAndCostPlan',
            where: { month_year: requestedMonths },
            required: false,
            attributes: ['month_year', ['planned_resource', 'planned_resou']],
          },
          {
            model: dbInstance.promAvinResourceAllocation,
            as: 'promAvinResourceAllocation',
            // where: {
            //   [Op.and]: sequelize.literal(
            //     `(start_date, end_date) OVERLAPS (${dbInstance.sequelize.escape(
            //       request.start_date,
            //     )}, ${dbInstance.sequelize.escape(request.end_date)})`,
            //   ),
            // },
            where: {
              [Op.and]: [
                {
                  [Op.and]: [
                    { start_date: { [Op.gte]: request.start_date } },
                    { start_date: { [Op.lte]: request.end_date } },
                  ],
                },
                {
                  [Op.and]: [
                    { end_date: { [Op.gte]: request.start_date } },
                    { end_date: { [Op.lte]: request.end_date } },
                  ],
                },
              ],
            },
            required: false,
            attributes: [
              [dbInstance.Sequelize.literal('to_char("start_date", \'YYYY-MM\')'), 'start_date'],
              [dbInstance.Sequelize.literal('to_char("end_date", \'YYYY-MM\')'), 'end_date'],
              'allocation',
              'billable_resource',
            ],
          },
        ],
      },
      {
        model: dbInstance.organizationGRPMgmt,
        as: 'projectGroupAndOrgGroupNames',
        required: false,
        where: { aop_month: requestedMonths },
        attributes: ['aop_month', 'aop_resource'],
      },
    ],
  });
  return JSON.parse(JSON.stringify(groupRevenue));
};
const getProjectRevenue = async (request, requestedMonths) => {
  const filterConditionBasedOnSelection =
    request.project_code[0] === 'All'
      ? { project_bu_name: request.project_bu_name }
      : { project_bu_name: request.project_bu_name, project_code: request.project_code };
  const groupRevenue = await dbInstance.promAvinProjectDetails.findAll({
    where: filterConditionBasedOnSelection,
    // attributes: { exclude: ['createdAt', 'updatedAt'] },
    attributes: [
      'project_code',
      'project_bu_name',
      'project_name',
      [dbInstance.Sequelize.literal('to_char("project_start_date", \'YYYY-MM\')'), 'project_start_date'],
      [dbInstance.Sequelize.literal('to_char("project_end_date", \'YYYY-MM\')'), 'project_end_date'],
      'po_ro_sow_value',
    ],
    required: false,
    // where: {
    //   [Op.and]: sequelize.literal(
    //     `(project_start_date, project_end_date) OVERLAPS (${dbInstance.sequelize.escape(
    //       getDatesInfo.request.start_date,
    //     )}, ${dbInstance.sequelize.escape(getDatesInfo.request.end_date)})`,
    //   ),
    // },

    include: [
      {
        model: dbInstance.promAvinProjectOperationData,
        as: 'promAvinProjectOperationData',
        where: { revenue_date: requestedMonths },
        attributes: ['revenue_date', 'revenue'],
      },
    ],
  });
  return JSON.parse(JSON.stringify(groupRevenue));
};

const getResourceandCostUtilization = async (request, requestedMonths) => {
  const filterConditionBasedOnSelection =
    request.project_code[0] === 'All'
      ? { project_bu_name: request.project_bu_name }
      : { project_code: request.project_code, project_bu_name: request.project_bu_name };
  const resourceInfo = await dbInstance.promAvinProjectDetails.findAll({
    where: filterConditionBasedOnSelection,
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    include: [
      {
        model: dbInstance.promAvinProjectResourceAndCostPlan,
        as: 'promAvinProjectResourceAndCostPlan',
        where: { month_year: requestedMonths },
        attributes: ['month_year', 'planned_resource', 'planned_cost'],
        required: false,
      },
      {
        model: dbInstance.promAvinResourceAllocation,
        as: 'promAvinResourceAllocation',
        where: {
          [Op.and]: [
            {
              [Op.and]: [
                { start_date: { [Op.gte]: request.start_date } },
                { start_date: { [Op.lte]: request.end_date } },
              ],
            },
            {
              [Op.and]: [{ end_date: { [Op.gte]: request.start_date } }, { end_date: { [Op.lte]: request.end_date } }],
            },
          ],
        },
        attributes: [
          [dbInstance.Sequelize.literal('to_char("start_date", \'YYYY-MM\')'), 'start_date'],
          [dbInstance.Sequelize.literal('to_char("end_date", \'YYYY-MM\')'), 'end_date'],
          'allocation',
          'billable_resource',
        ],
        required: false,
      },
    ],
  });
  return JSON.parse(JSON.stringify(resourceInfo));
};

const getResourceandProjectInfo = async () => {
  const resourceInfo = await dbInstance.promAvinProjectDetails.findAll({
    attributes: ['project_code', 'project_name'],
    include: [
      {
        model: dbInstance.promAvinResourceAllocation,
        as: 'promAvinResourceAllocation',
        attributes: ['project_code', 'resource_emp_id'],
        required: false,
        include: [
          {
            model: dbInstance.promAvinEmployeeDetails,
            as: 'promAvinEmployeeDetails',
            attributes: [
              ['resource_emp_id', 'resource_emp'],
              ['resource_name', 'resource_nam'],
            ],
            required: false,
          },
        ],
      },
    ],
    order: [['project_code', 'ASC']],
  });
  return JSON.parse(JSON.stringify(resourceInfo));
};

const fetchAllProjectStatusDataInArray = async () => {
  const projectStatusInArray = await dbInstance.promAvinProjectDetails.findAll({
    raw: true,
    where: { project_status: { [Op.ne]: 'Closed' } },
    attributes: [
      [
        dbInstance.Sequelize.fn(
          'ARRAY_AGG',
          dbInstance.Sequelize.fn('DISTINCT', dbInstance.Sequelize.col('project_status')),
        ),
        'projectStatus',
      ],
    ],
  });

  return projectStatusInArray[0].projectStatus;
};

const fetchAllProjectNamesInArray = async () => {
  const projectNamesInArray = await dbInstance.promAvinProjectDetails.findAll({
    raw: true,
    attributes: [
      [
        dbInstance.Sequelize.fn(
          'ARRAY_AGG',
          dbInstance.Sequelize.fn('DISTINCT', dbInstance.Sequelize.col('project_name')),
        ),
        'projectNames',
      ],
    ],
  });
  return projectNamesInArray[0].projectNames;
};

const fetchAllProjectCodesInArray = async () => {
  const projectCodesInArray = await dbInstance.promAvinProjectDetails.findAll({
    raw: true,
    attributes: [
      [
        dbInstance.Sequelize.fn(
          'ARRAY_AGG',
          dbInstance.Sequelize.fn('DISTINCT', dbInstance.Sequelize.col('project_code')),
        ),
        'projectCodes',
      ],
    ],
  });
  return projectCodesInArray[0].projectCodes;
};

const projectNameVerify = async (projectNames) => {
  const projectData = await dbInstance.promAvinProjectDetails.findAll({
    attributes: ['project_code', 'project_name'],
    where: { project_name: projectNames },
    raw: true,
  });
  return projectData;
};

const fetchAllProjGroupNameDataforAvgEngg = async (project_code) => {
  const allGroupDetails = await dbInstance.promAvinProjectDetails.findAll({
    attributes: ['project_bu_name'],
    where: { project_code: project_code },
  });
  return allGroupDetails;
};

module.exports = {
  fetchAllProjectStartAndEndDateUsingProjectCode,
  getAllPromProjectCodeInArray,
  getOrganizationGroupHeadEmployeeIds,
  getProjectByID,
  updateProjectData,
  insertProjData,
  fetchAllProjects,
  getAllProjectDataById,
  fetchAllProjStatusData,
  fetchAllProjTypesData,
  insertAllProjData,
  deleteProjectDataById,
  getBufferProjectFromDatabase,
  fetchAllProjGroupNameData,
  fetchAllProjectTypesInArray,
  fetchAllProjectStatusInArray,
  getGRPRevenueByProject,
  getMaxProjectStartDate,
  getGRPAOPInfo,
  getProjectRevenue,
  getMaxResourceStartDate,
  getResourceandCostUtilization,
  getMaxProjectStartDateBasedProject,
  fetchAllProjectWithTheirEmployeeFromDb,
  getResourceandProjectInfo,
  getMaxProjectStartDateForgeneric,
  fetchAllProjectStatusDataInArray,
  getAllPromProjectDetailsInArray,
  fetchAllProjectNamesInArray,
  fetchAllProjectCodesInArray,
  projectNameVerify,
  getMaxProjectStartDateReports,
  fetchAllProjGroupNameDataforAvgEngg,
};
