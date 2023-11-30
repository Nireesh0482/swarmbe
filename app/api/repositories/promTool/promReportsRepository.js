/* eslint-disable max-len */
const { Op } = require('sequelize');
const dbInstance = require('../../models');
const { sequelize } = require('../../models');

const whereConditionForStartAndEndDate = (resourceFromDateAndToDate) => {
  // if user explicitly provides start_date and end_date, then check overlapping date and return data else
  // send all allocation details for the project_code
  if (resourceFromDateAndToDate?.start_date && resourceFromDateAndToDate?.end_date) {
    return sequelize.literal(
      `(start_date, end_date) OVERLAPS (${dbInstance.sequelize.escape(
        resourceFromDateAndToDate.start_date,
      )}, ${dbInstance.sequelize.escape(resourceFromDateAndToDate.end_date)})`,
    );
  }
  return undefined;
};
const getResourceUtilizationData = async (filterCondition, filterDateProjectResource) => {
  // if user selected all condition then only use project_bu_name or else selected project(single/multi)
  const filterConditionBasedOnSelection =
    filterCondition.project_code[0] === 'All'
      ? { project_bu_name: filterCondition.project_bu_name }
      : filterCondition;

  const resourceUtilizationData = await dbInstance.promAvinProjectDetails.findAll({
    where: filterConditionBasedOnSelection,
    attributes: [
      'project_code',
      'project_name',
      'project_bu_name',
      [dbInstance.Sequelize.literal('to_char("project_start_date", \'YYYY-MM-DD\')'), 'project_start_date'],
      [dbInstance.Sequelize.literal('to_char("project_end_date", \'YYYY-MM-DD\')'), 'project_end_date'],
    ],
    include: [
      {
        model: dbInstance.promAvinResourceAllocation,
        as: 'promAvinResourceAllocation',
        required: false,
        where: whereConditionForStartAndEndDate(filterDateProjectResource),
        attributes: [
          [dbInstance.Sequelize.literal('to_char("start_date", \'YYYY-MM-DD\')'), 'start_date'],
          [dbInstance.Sequelize.literal('to_char("end_date", \'YYYY-MM-DD\')'), 'end_date'],
          'allocation',
        ],
      },
    ],
  });
  return JSON.parse(JSON.stringify(resourceUtilizationData));
};
const getResourceUtilizationDataHighLevelProjectReports = async (filterCondition, filterDateProjectResource) => {
  // if user selected all condition then only use project_bu_name or else selected project(single/multi)
  const filterConditionBasedOnSelection =
    filterCondition.project_code[0] === 'All'
      ? { project_bu_name: filterCondition.project_bu_name }
      : filterCondition;

  const resourceUtilizationData = await dbInstance.promAvinProjectDetails.findAll({
    where: filterConditionBasedOnSelection,
    attributes: [
      'project_code',
      'project_name',
      'project_bu_name',
      [dbInstance.Sequelize.literal('to_char("project_start_date", \'YYYY-MM-DD\')'), 'project_start_date'],
      [dbInstance.Sequelize.literal('to_char("project_end_date", \'YYYY-MM-DD\')'), 'project_end_date'],
    ],
    include: [
      {
        model: dbInstance.promAvinResourceAllocation,
        as: 'promAvinResourceAllocation',
        required: false,
        where: {
          [Op.and]: [
            {
              [Op.and]: [
                { start_date: { [Op.gte]: filterDateProjectResource.start_date } },
                { start_date: { [Op.lte]: filterDateProjectResource.end_date } },
              ],
            },
            {
              [Op.and]: [
                { end_date: { [Op.gte]: filterDateProjectResource.start_date } },
                { end_date: { [Op.lte]: filterDateProjectResource.end_date } },
              ],
            },
          ],
        },
        attributes: [
          [dbInstance.Sequelize.literal('to_char("start_date", \'YYYY-MM-DD\')'), 'start_date'],
          [dbInstance.Sequelize.literal('to_char("end_date", \'YYYY-MM-DD\')'), 'end_date'],
          'allocation',
        ],
      },
    ],
  });
  return JSON.parse(JSON.stringify(resourceUtilizationData));
};

const getEmployeeSalaryRevisionUnderProjectCode = async (employeeIdsArray) => {
  const salaryRevisionDetailsForProject = await dbInstance.promSalaryRevision.findAll({
    group: ['resource_emp_id', 'revision_start_date', 'revision_end_date', 'ctc'],
    raw: true,
    where: { resource_emp_id: employeeIdsArray },
    attributes: [
      'resource_emp_id',
      [dbInstance.Sequelize.literal('to_char("revision_start_date", \'YYYY-MM-DD\')'), 'revision_start_date'],
      [dbInstance.Sequelize.literal('to_char("revision_end_date", \'YYYY-MM-DD\')'), 'revision_end_date'],
      'ctc',
    ],
  });
  return salaryRevisionDetailsForProject;
};

const getResourceAllocationForCostUtilizationReports = async (resourceFromDateAndToDate, costUtilizationRequest) => {
  // if user selected all condition then only use project_bu_name or else selected project(single/multi)
  const filterConditionBasedOnSelection = () => {
    if (costUtilizationRequest?.project_code?.[0] === 'All') {
      return { project_bu_name: costUtilizationRequest.project_bu_name };
    }
    if (costUtilizationRequest?.project_bu_name?.[0] === 'All') {
      return undefined;
    }
    return costUtilizationRequest;
  };

  const allProjectCostUtilizationResource = await dbInstance.promAvinProjectDetails.findAll({
    where: filterConditionBasedOnSelection(costUtilizationRequest),
    order: [['project_bu_name', 'ASC']],
    attributes: [
      'project_code',
      'project_name',
      'project_bu_name',
      [dbInstance.Sequelize.literal('to_char("project_start_date", \'YYYY-MM-DD\')'), 'project_start_date'],
      [dbInstance.Sequelize.literal('to_char("project_end_date", \'YYYY-MM-DD\')'), 'project_end_date'],
      'po_ro_sow_value',
    ],
    include: [
      {
        model: dbInstance.promAvinResourceAllocation,
        as: 'promAvinResourceAllocation',
        required: false,
        where: whereConditionForStartAndEndDate(resourceFromDateAndToDate),
        attributes: [
          'project_code',
          'resource_emp_id',
          [dbInstance.Sequelize.literal('to_char("start_date", \'YYYY-MM-DD\')'), 'start_date'],
          [dbInstance.Sequelize.literal('to_char("end_date", \'YYYY-MM-DD\')'), 'end_date'],
          'allocation',
        ],
        include: [
          {
            model: dbInstance.promAvinEmployeeDetails,
            as: 'promAvinEmployeeDetails',
            attributes: [
              ['resource_name', 'resource'],
              ['resource_emp_id', 'resource_emp'],
            ],
          },
        ],
      },
    ],
  });
  return JSON.parse(JSON.stringify(allProjectCostUtilizationResource));
};

const getResourceAllocationForCostUtilization = async (resourceFromDateAndToDate, costUtilizationRequest) => {
  // if user selected all condition then only use project_bu_name or else selected project(single/multi)
  const filterConditionBasedOnSelection = () => {
    if (costUtilizationRequest?.project_code?.[0] === 'All') {
      return { project_bu_name: costUtilizationRequest.project_bu_name };
    }
    if (costUtilizationRequest?.project_bu_name?.[0] === 'All') {
      return undefined;
    }
    if (costUtilizationRequest?.resource_name?.[0] === 'All') {
      return { resource_name: costUtilizationRequest.resource_name };
    }
    return costUtilizationRequest;
  };

  const allProjectCostUtilizationResource = await dbInstance.promAvinProjectDetails.findAll({
    where: filterConditionBasedOnSelection(costUtilizationRequest),
    order: [['project_bu_name', 'ASC']],
    attributes: [
      'project_code',
      'project_name',
      'project_bu_name',
      [dbInstance.Sequelize.literal('to_char("project_start_date", \'YYYY-MM-DD\')'), 'project_start_date'],
      [dbInstance.Sequelize.literal('to_char("project_end_date", \'YYYY-MM-DD\')'), 'project_end_date'],
      'po_ro_sow_value',
    ],
    include: [
      {
        model: dbInstance.promAvinResourceAllocation,
        as: 'promAvinResourceAllocation',
        required: false,
        where: {
          [Op.and]: [
            {
              [Op.and]: [
                { start_date: { [Op.gte]: resourceFromDateAndToDate.start_date } },
                { start_date: { [Op.lte]: resourceFromDateAndToDate.end_date } },
              ],
            },
            {
              [Op.and]: [
                { end_date: { [Op.gte]: resourceFromDateAndToDate.start_date } },
                { end_date: { [Op.lte]: resourceFromDateAndToDate.end_date } },
              ],
            },
          ],
        },
        attributes: [
          'project_code',
          'resource_emp_id',
          [dbInstance.Sequelize.literal('to_char("start_date", \'YYYY-MM-DD\')'), 'start_date'],
          [dbInstance.Sequelize.literal('to_char("end_date", \'YYYY-MM-DD\')'), 'end_date'],
          'allocation',
        ],
        include: [
          {
            model: dbInstance.promAvinEmployeeDetails,
            as: 'promAvinEmployeeDetails',
            attributes: [
              ['resource_name', 'resource'],
              ['resource_emp_id', 'resource_emp'],
            ],
          },
        ],
      },
    ],
  });
  return JSON.parse(JSON.stringify(allProjectCostUtilizationResource));
};

const getResourceAllocationForResourceUtilization = async (resourceFromDateAndToDate, costUtilizationRequest) => {
  // if user selected all condition then only use project_bu_name or else selected project(single/multi)
  const filterConditionBasedOnSelection =
    costUtilizationRequest.resource_emp_id[0] === 'All' ? {} : costUtilizationRequest;
  const allProjectCostUtilizationResource = await dbInstance.promAvinEmployeeDetails.findAll({
    where: filterConditionBasedOnSelection,
    attributes: [['resource_name', 'resource']],
    include: [
      {
        model: dbInstance.promAvinResourceAllocation,
        as: 'promAvinResourceAllocation',
        where: {
          [Op.and]: [
            {
              [Op.and]: [
                { start_date: { [Op.gte]: resourceFromDateAndToDate.start_date } },
                { start_date: { [Op.lte]: resourceFromDateAndToDate.end_date } },
              ],
            },
            {
              [Op.and]: [
                { end_date: { [Op.gte]: resourceFromDateAndToDate.start_date } },
                { end_date: { [Op.lte]: resourceFromDateAndToDate.end_date } },
              ],
            },
          ],
        },
        attributes: [
          'project_code',
          'resource_emp_id',
          [dbInstance.Sequelize.literal('to_char("start_date", \'YYYY-MM-DD\')'), 'start_date'],
          [dbInstance.Sequelize.literal('to_char("end_date", \'YYYY-MM-DD\')'), 'end_date'],
          'allocation',
        ],
      },
    ],
  });

  return JSON.parse(JSON.stringify(allProjectCostUtilizationResource));
};

const fetchAllReports = async () => {
  const reportData = await dbInstance.promAvinResourceAllocation.findAll({
    attributes: ['resource_emp_id'],
    raw: true,
  });
  return reportData;
};

// before delete please check getResourceByEmpId claims service  whether used or not
const getEmpName = async (empID) => {
  const reportData = await dbInstance.promAvinEmployeeDetails.findOne({
    where: { resource_emp_id: empID },
    attributes: ['resource_name'],
    raw: true,
  });
  return reportData;
};

const getResourceAndCostAOP = async (getDatesInfo) => {
  const reportData = await dbInstance.promAvinProjectResourceAndCostPlan.findOne({
    where: {
      month_year: {
        [Op.between]: [getDatesInfo.requestedMonths[0], getDatesInfo.requestedMonths.at(-1)],
      },
    },
    attributes: [
      [dbInstance.sequelize.fn('sum', dbInstance.sequelize.col('planned_resource')), 'totalPlannedResource'],
    ],

    raw: true,
  });
  return reportData;
};
const getPlannedResourceTotal = async (getDatesInfo, requestedMonths) => {
  const filterConditionBasedOnSelection =
    getDatesInfo.projectGroup[0] === 'All' ? {} : { project_bu_name: getDatesInfo.projectGroup };
  const reportData = await dbInstance.promAvinProjectDetails.findAll({
    where: filterConditionBasedOnSelection,
    attributes: [
      'project_code',
      'project_bu_name',
      [dbInstance.sequelize.col('promAvinProjectResourceAndCostPlan.month_year'), 'month_year'],
      [dbInstance.sequelize.col('promAvinProjectResourceAndCostPlan.planned_resource'), 'planned_resource'],
    ],
    include: [
      {
        model: dbInstance.promAvinProjectResourceAndCostPlan,
        as: 'promAvinProjectResourceAndCostPlan',
        where: {
          project_code: { [Op.eq]: dbInstance.Sequelize.col('avin_project_details.project_code') },
          month_year: requestedMonths,
        },
        attributes: [],
      },
    ],
    raw: true,
  });
  return reportData;
};

const getResourceAndCost = async (getDatesInfo) => {
  const reportData = await dbInstance.promAvinProjectResourceAndCostPlan.findAll({
    where: {
      [Op.and]: [
        { project_code: getDatesInfo.request.project_code },
        {
          month_year: getDatesInfo.requestedMonths,
        },
      ],
    },
    raw: true,
  });
  return reportData;
};

const getTotalRevenueByProj = async (getDatesInfo) => {
  const reportData = await dbInstance.promAvinProjectOperationData.findAll({
    where: {
      project_code: getDatesInfo.request.project_code,
      revenue_date: getDatesInfo.requestedMonths,
    },
    attributes: ['project_code', 'revenue'],
    raw: true,
  });
  return reportData;
};

const getActualResourceMonthDataAOP = async (getDatesInfo) => {
  const reportData = await dbInstance.promAvinResourceAllocation.findOne({
    where: {
      [Op.and]: sequelize.literal(
        `(start_date, end_date) OVERLAPS (${dbInstance.sequelize.escape(
          getDatesInfo.request.start_date,
        )}, ${dbInstance.sequelize.escape(getDatesInfo.request.end_date)})`,
      ),
    },
    attributes: [
      [dbInstance.sequelize.fn('sum', dbInstance.sequelize.col('allocation')), 'totalAllocation'], // need to check total allocation or employee count
      [dbInstance.sequelize.fn('sum', dbInstance.sequelize.col('billable_resource')), 'totalBillableAllocation'],
    ],
    raw: true,
  });
  return reportData;
};
const getActualResourceMonthData = async (request) => {
  const reportData = await dbInstance.promAvinResourceAllocation.findOne({
    where: {
      [Op.and]: [
        { project_code: request.project_code },
        {
          [Op.and]: [{ start_date: { [Op.gte]: request.start_date } }, { end_date: { [Op.lte]: request.end_date } }],
        },
      ],
    },
    attributes: [
      [dbInstance.sequelize.fn('sum', dbInstance.sequelize.col('allocation')), 'totalAllocation'],
      [dbInstance.sequelize.fn('sum', dbInstance.sequelize.col('billable_resource')), 'totalBillableAllocation'],
    ],
    raw: true,
  });
  return reportData;
};

const getAllGRPAOP = async (request) => {
  const filterConditionBasedOnSelection =
    request.project_bu_name[0] === 'All'
      ? {
        aop_month: {
          [Op.between]: [request.start_date, request.end_date],
        },
      }
      : {
        org_bu_name: request.project_bu_name,
        aop_month: {
          [Op.between]: [request.start_date, request.end_date],
        },
      };
  const approverData = await dbInstance.organizationGRPMgmt.findOne({
    where: filterConditionBasedOnSelection,
    attributes: [[dbInstance.sequelize.fn('sum', dbInstance.sequelize.col('aop_resource')), 'totalAOP']],
    raw: true,
  });
  return approverData;
};

const getResourceUtilizationByProjectGroup = async (monthFilter, projectGroupNamesInArray) => {
  const AllResourceAllocationByGroupName = await dbInstance.groupDetails.findAll({
    attributes: ['bu_name'],
    where: projectGroupNamesInArray == null ? undefined : { bu_name: projectGroupNamesInArray },
    include: [
      {
        model: dbInstance.promAvinProjectDetails,
        as: 'projectGroupFk',
        attributes: ['project_code', 'project_bu_name'],
        include: [
          {
            model: dbInstance.promAvinResourceAllocation,
            as: 'promAvinResourceAllocation',
            attributes: [
              ['resource_emp_id', 'resourceEmpId'],
              [dbInstance.Sequelize.literal('to_char("start_date", \'YYYY-MM-DD\')'), 'startDate'],
              [dbInstance.Sequelize.literal('to_char("end_date", \'YYYY-MM-DD\')'), 'endDate'],
            ],
            where: {
              [Op.and]: [
                {
                  [Op.and]: [
                    { start_date: { [Op.gte]: monthFilter.start_date } },
                    { start_date: { [Op.lte]: monthFilter.end_date } },
                  ],
                },
                {
                  [Op.and]: [
                    { end_date: { [Op.gte]: monthFilter.start_date } },
                    { end_date: { [Op.lte]: monthFilter.end_date } },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  });

  return JSON.parse(JSON.stringify(AllResourceAllocationByGroupName));
};

const getAOPData = async (getDatesInfo) => {
  const reportData = await dbInstance.organizationGRPMgmt.findAll({
    where: {
      [Op.and]: [
        { org_bu_name: getDatesInfo.request.project_bu_name },
        {
          aop_month: getDatesInfo.requestedMonths,
        },
      ],
    },
    raw: true,
  });
  return reportData;
};

const getActualRevenue = async (getDatesInfo) => {
  const reportData = await dbInstance.promAvinProjectOperationData.findAll({
    where: {
      [Op.and]: [
        { project_code: getDatesInfo.request.project_code },
        {
          revenue_date: getDatesInfo.requestedMonths,
        },
      ],
    },
    raw: true,
  });
  return reportData;
};

const getResourceAllocationDetailedLevel = async (getDatesInfo) => {
  const filterConditionBasedOnSelection =
    getDatesInfo.request.resource_emp_id?.[0] === 'All'
      ? {}
      : { resource_emp_id: getDatesInfo.request.resource_emp_id };

  const allProjectresource = await dbInstance.promAvinEmployeeDetails.findAll({
    where: filterConditionBasedOnSelection,
    attributes: ['resource_emp_id', ['resource_name', 'resource']],
    include: [
      {
        model: dbInstance.promAvinResourceAllocation,
        as: 'employeeResourceAllocation',
        where: {
          [Op.and]: [
            {
              [Op.and]: [
                { start_date: { [Op.gte]: getDatesInfo.request.start_date } },
                { start_date: { [Op.lte]: getDatesInfo.request.end_date } },
              ],
            },
            {
              [Op.and]: [
                { end_date: { [Op.gte]: getDatesInfo.request.start_date } },
                { end_date: { [Op.lte]: getDatesInfo.request.end_date } },
              ],
            },
          ],
        },
        attributes: [
          'project_code',
          'resource_emp_id',
          [dbInstance.Sequelize.literal('to_char("start_date", \'YYYY-MM-DD\')'), 'start_date'],
          [dbInstance.Sequelize.literal('to_char("end_date", \'YYYY-MM-DD\')'), 'end_date'],
          'allocation',
        ],
        required: false,
      },
    ],
  });

  return JSON.parse(JSON.stringify(allProjectresource));
};
const createFilterConditionForProject = (filterCriteria) => {
  const result = {};
  if (filterCriteria?.project_name) result.project_name = filterCriteria.project_name;
  if (filterCriteria?.project_bu_name) result.project_bu_name = filterCriteria.project_bu_name;
  if (filterCriteria?.project_code) result.project_code = filterCriteria.project_code;
  if (filterCriteria?.project_type) result.project_type = filterCriteria.project_type;
  if (filterCriteria?.project_status) result.project_status = filterCriteria.project_status;
  return result;
};

const createFilterConditionForEmployee = (filterCriteria) => {
  const result = {};
  if (filterCriteria?.resource_emp_id) result.resource_emp_id = filterCriteria.resource_emp_id;
  if (filterCriteria?.resource_name) result.resource_name = filterCriteria.resource_name;
  if (filterCriteria?.resource_status) result.resource_status = filterCriteria.resource_status;
  return result;
};
const getGenericData = async (genericFilters) => {
  genericFilters.request.project_code =
    genericFilters.request.project_code === 'All' ? '' : genericFilters.request.project_code;
  genericFilters.request.project_bu_name =
    genericFilters.request.project_bu_name === 'All' ? '' : genericFilters.request.project_bu_name;
  genericFilters.request.resource_emp_id =
    genericFilters.request.resource_emp_id === 'All' ? '' : genericFilters.request.resource_emp_id;
  genericFilters.request.project_type =
    genericFilters.request.project_type === 'All' ? '' : genericFilters.request.project_type;
  genericFilters.request.project_status =
    genericFilters.request.project_status === 'All' ? '' : genericFilters.request.project_status;
  genericFilters.request.resource_status =
    genericFilters.request.resource_status === 'All' ? '' : genericFilters.request.resource_status;

  const AllResourceByselectedFilter = await dbInstance.promAvinProjectDetails.findAll({
    where: createFilterConditionForProject(genericFilters.request),
    attributes: [
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
        model: dbInstance.promAvinResourceAllocation,
        as: 'promAvinResourceAllocation',
        where: {
          [Op.and]: [
            {
              [Op.and]: [
                { start_date: { [Op.gte]: genericFilters.request.start_date } },
                { start_date: { [Op.lte]: genericFilters.request.end_date } },
              ],
            },
            {
              [Op.and]: [
                { end_date: { [Op.gte]: genericFilters.request.start_date } },
                { end_date: { [Op.lte]: genericFilters.request.end_date } },
              ],
            },
          ],
        },
        attributes: [
          'project_code',
          'resource_emp_id',
          'supervisor',
          [dbInstance.Sequelize.literal('to_char("start_date", \'YYYY-MM-DD\')'), 'start_date'],
          [dbInstance.Sequelize.literal('to_char("end_date", \'YYYY-MM-DD\')'), 'end_date'],
          'allocation',
          'resource_status_in_project',
        ],
        required: false,
        include: [
          {
            model: dbInstance.promAvinEmployeeDetails,
            as: 'promAvinEmployeeDetails',
            where: createFilterConditionForEmployee(genericFilters.request),
            attributes: [
              ['resource_emp_id', 'resource_emp'],
              ['reporting_manager', 'manager_id'],
              ['resource_name', 'resource_nam'],
              ['per_month', 'per_month'],
            ],
          },
          {
            model: dbInstance.promAvinEmployeeDetails,
            as: 'promAvinEmployeeDetailsForSupervisor',
          },
        ],
      },
      {
        model: dbInstance.promAvinProjectResourceAndCostPlan,
        as: 'promAvinProjectResourceAndCostPlan',
        where: { month_year: genericFilters.requestedMonths },
        attributes: ['planned_cost', 'planned_resource'],
        required: false,
      },
    ],
  });
  return JSON.parse(JSON.stringify(AllResourceByselectedFilter));
};

const createFilterConditionForClaims = (filterCriteria) => {
  const result = {};
  if (filterCriteria?.resource_emp_id) result.resource_emp_id = filterCriteria.resource_emp_id;
  if (filterCriteria?.project_code) result.project_code = filterCriteria.project_code;
  if (filterCriteria?.claim_status) result.claim_status = filterCriteria.claim_status;
  if (filterCriteria?.expense_type) result.expense_type = filterCriteria.expense_type;
  if (filterCriteria?.startMonth && filterCriteria?.endMonth) {
    result.date = {
      [Op.between]: [filterCriteria.startMonth, filterCriteria.endMonth],
    };
  }
  return result;
};

const getClaimsFilters = async (request) => {
  request.resource_emp_id = request.resource_emp_id === 'All' ? '' : request.resource_emp_id;
  request.project_code = request.project_code === 'All' ? '' : request.project_code;
  request.claim_status = request.claim_status === 'All' ? '' : request.claim_status;
  request.expense_type = request.expense_type === 'All' ? '' : request.expense_type;
  const approverData = await dbInstance.promAvinProjectExpenses.findAll({
    where: createFilterConditionForClaims(request),
    attributes: [
      'pe_id',
      'project_code',
      'resource_emp_id',
      'expense_type',
      [dbInstance.Sequelize.literal('to_char("date", \'YYYY-MM-DD\')'), 'date'],
      [dbInstance.Sequelize.literal('to_char("approved_date", \'YYYY-MM-DD\')'), 'approved_date'],
      'amount',
      'approver',
      'claim_status',
      'remarks',
    ],
    include: [
      {
        model: dbInstance.promAvinEmployeeDetails,
        as: 'promAvinEmployeeDetails',
        attributes: ['resource_name'],
      },
    ],
    raw: true,
  });
  return approverData;
};
const getProjectMinStartDateAndMaxEndDate = async (filterCondition) => {
  const projectDateInfoFromDb = await dbInstance.promAvinProjectDetails.findOne({
    where: filterCondition,
    attributes: [
      [dbInstance.sequelize.fn('min', dbInstance.sequelize.col('project_start_date')), 'project_start_date'],
      [dbInstance.sequelize.fn('max', dbInstance.sequelize.col('project_end_date')), 'project_end_date'],
    ],
    raw: true,
  });

  return projectDateInfoFromDb;
};

const getResourceUtilizationByGroup = async (getDatesInfo, startYear, endYear) => {
  const filterConditionBasedOnSelection =
    getDatesInfo.request.project_bu_name[0] === 'All'
      ? {
        aop_month: {
          [Op.overlap]: [startYear, endYear],
        },
        // aop_month: getDatesInfo.requestedMonths,
        // aop_month: { [Op.contains]: [startYear] }
      }
      : {
        org_bu_name: getDatesInfo.request.project_bu_name,
        aop_month: {
          [Op.overlap]: [startYear, endYear],
        },
        // aop_month: getDatesInfo.requestedMonths,
      };
  const filterConditionBasedOnSelectionForGroup =
    getDatesInfo.request.project_bu_name[0] === 'All'
      ? {}
      : {
        bu_name: getDatesInfo.request.project_bu_name,
      };
  const AllResourceAllocationByGroupName = await dbInstance.groupDetails.findAll({
    where: filterConditionBasedOnSelectionForGroup,
    include: [
      {
        model: dbInstance.organizationGRPMgmt,
        as: 'projectGroupAndOrgGroupNames',
        where: filterConditionBasedOnSelection,
      },
      {
        model: dbInstance.promAvinProjectDetails,
        as: 'projectGroupFk',
        required: false,
        attributes: ['project_code', 'project_bu_name'],
        include: [
          {
            model: dbInstance.promAvinResourceAllocation,
            as: 'promAvinResourceAllocation',
            required: false,
            where: {
              [Op.and]: [
                {
                  [Op.and]: [
                    { start_date: { [Op.gte]: getDatesInfo.request.start_date } },
                    { start_date: { [Op.lte]: getDatesInfo.request.end_date } },
                  ],
                },
                {
                  [Op.and]: [
                    { end_date: { [Op.gte]: getDatesInfo.request.start_date } },
                    { end_date: { [Op.lte]: getDatesInfo.request.end_date } },
                  ],
                },
              ],
            },
          },
          {
            model: dbInstance.promAvinProjectResourceAndCostPlan,
            as: 'promAvinProjectResourceAndCostPlan',
            required: false,
            where: {
              month_year: getDatesInfo.requestedMonths,
            },
          },
        ],
      },
    ],
  });

  return JSON.parse(JSON.stringify(AllResourceAllocationByGroupName));
};

const getRevenueAndCostData = async (getDatesInfo) => {
  const filterConditionBasedOnSelectionForGroup =
    getDatesInfo.request.project_bu_name[0] === 'All'
      ? {}
      : {
        bu_name: getDatesInfo.request.project_bu_name,
      };
  const AllResourceAllocationByGroupName = await dbInstance.groupDetails.findAll({
    where: filterConditionBasedOnSelectionForGroup,
    include: [
      // {
      //   model: dbInstance.organizationGRPMgmt,
      //   as: 'projectGroupAndOrgGroupNames',
      // },
      {
        model: dbInstance.promAvinProjectDetails,
        as: 'projectGroupFk',
        required: false,
        attributes: [
          'project_code',
          [dbInstance.Sequelize.literal('to_char("project_start_date", \'YYYY-MM\')'), 'project_start_date'],
          [dbInstance.Sequelize.literal('to_char("project_end_date", \'YYYY-MM\')'), 'project_end_date'],
          'po_ro_sow_value',
        ],
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
            where: {
              revenue_date: getDatesInfo.requestedMonths,
            },
          },
          {
            model: dbInstance.promAvinProjectResourceAndCostPlan,
            as: 'promAvinProjectResourceAndCostPlan',
            required: false,
            where: {
              month_year: getDatesInfo.requestedMonths,
            },
          },
        ],
      },
    ],
  });
  return JSON.parse(JSON.stringify(AllResourceAllocationByGroupName));
};

module.exports = {
  getProjectMinStartDateAndMaxEndDate,
  getResourceUtilizationData,
  fetchAllReports,
  getEmpName,
  getResourceAllocationForCostUtilization,
  getResourceAndCost,
  getTotalRevenueByProj,
  getActualResourceMonthData,
  getAllGRPAOP,
  getResourceUtilizationByProjectGroup,
  getAOPData,
  getActualRevenue,
  getEmployeeSalaryRevisionUnderProjectCode,
  getResourceAllocationForResourceUtilization,
  getResourceAndCostAOP,
  getActualResourceMonthDataAOP,
  getResourceAllocationDetailedLevel,
  getGenericData,
  createFilterConditionForClaims,
  getClaimsFilters,
  getResourceUtilizationByGroup,
  getRevenueAndCostData,
  getResourceAllocationForCostUtilizationReports,
  getResourceUtilizationDataHighLevelProjectReports,
  getPlannedResourceTotal,
};
