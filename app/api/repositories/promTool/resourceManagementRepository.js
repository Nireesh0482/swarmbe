const { Op } = require('sequelize');
const logger = require('../../utils/logger');
const dbInstance = require('../../models');
const { Sequelize } = require('../../models');

const getResourceByID = async (resourceEmpID) => {
  const existingResourceData = await dbInstance.promAvinEmployeeDetails.findOne({
    where: { resource_emp_id: resourceEmpID },
    raw: true,
  });
  return existingResourceData;
};

const updateResourceData = async (request, userTableUpdating, maternityTableUpdating) => {
  const updateUserEmail = await Promise.all(
    userTableUpdating.map(async (ele) => {
      const updateEmailInUserTable = await dbInstance.promUsers.update(
        { email_id: ele.email_id },

        {
          where: { resource_emp_id: ele.resource_emp_id },
        },
      );

      return updateEmailInUserTable;
    }),
  );
  const updateMaternityGroup = await Promise.all(
    maternityTableUpdating.map(async (ele) => {
      const updateGroupInMaternityTable = await dbInstance.maternityDetails.update(
        { bu_name: ele.bu_name, reporting_manager: ele.reporting_manager },

        {
          where: { resource_emp_id: ele.resource_emp_id },
        },
      );

      return updateGroupInMaternityTable;
    }),
  );

  const pushExistingResourceData = await dbInstance.promAvinEmployeeDetails.bulkCreate(request, {
    updateOnDuplicate: [
      'resource_emp_id',
      'email_id',
      'is_reporting_manager',
      'resource_name',
      'resource_doj',
      'designation',
      'reporting_manager',
      'location',
      'joined_as',
      'ctc',
      'per_month',
      'stream',
      'total_years_exp',
      // 'skill_data',
      'resource_status',
      'bu_name',
      'resource_lwd',
    ],
    validate: true,
    returning: true,
  });

  return { pushExistingResourceData, updateUserEmail, updateMaternityGroup };
};

const insertResourceData = async (resourceData) => {
  const insertedResourceData = await dbInstance.promAvinEmployeeDetails.create(resourceData);
  return insertedResourceData;
};

const insertAllResourceData = async (resourceData) => {
  const insertedResourceData = await dbInstance.promAvinEmployeeDetails.bulkCreate(resourceData, { validate: true });
  return insertedResourceData;
};

const fetchSelectedEmployeeDetailsFromDb = async (employeeIdArray) => {
  const employeeNameAndId = await dbInstance.promAvinEmployeeDetails.findAll({
    where: { resource_emp_id: employeeIdArray },
    raw: true,
    attributes: ['resource_emp_id', 'resource_name'],
  });
  return employeeNameAndId;
};

const fetchAllResources = async () => {
  const resourceData = await dbInstance.promAvinEmployeeDetails.findAll({
    order: [['resource_emp_id', 'ASC']],
    attributes: [
      'id',
      'resource_emp_id',
      'email_id',
      'is_reporting_manager',
      'resource_name',
      [dbInstance.Sequelize.literal('to_char("resource_doj", \'YYYY-MM-DD\')'), 'resource_doj'],
      'designation',
      'reporting_manager',
      'location',
      'joined_as',
      'ctc',
      'per_month',
      'stream',
      'total_years_exp',
      'resource_status',
      'bu_name',
      'resource_lwd',
    ],
    raw: true,
  });
  return resourceData;
};

const fetchAllResourcesforCronJob = async () => {
  const resourceData = await dbInstance.promAvinEmployeeDetails.findAll({
    where: { resource_status: { [Op.ne]: 'Inactive' } },
    order: [['resource_emp_id', 'ASC']],
    attributes: [
      'id',
      'resource_emp_id',
      'email_id',
      'is_reporting_manager',
      'resource_name',
      [dbInstance.Sequelize.literal('to_char("resource_doj", \'YYYY-MM-DD\')'), 'resource_doj'],
      'designation',
      'reporting_manager',
      'location',
      'joined_as',
      'ctc',
      'per_month',
      'stream',
      'total_years_exp',
      'resource_status',
      'bu_name',
      'resource_lwd',
    ],
    raw: true,
  });
  return resourceData;
};


const getResourceById = async (request) => {
  const resourceData = await dbInstance.promAvinEmployeeDetails.findAll({
    where: { resource_emp_id: request.resource_emp_id },
    raw: true,
  });
  return resourceData;
};

const fetchAllJoinedAsData = async () => {
  const joinedAsData = await dbInstance.joinedAsDetails.findAll({
    raw: true,
  });
  return joinedAsData;
};

const fetchAllJoinedAsDataInArray = async () => {
  const joinedAsInArray = await dbInstance.joinedAsDetails.findAll({
    raw: true,
    attributes: [
      [
        dbInstance.Sequelize.fn(
          'ARRAY_AGG',
          dbInstance.Sequelize.fn('DISTINCT', dbInstance.Sequelize.col('joined_as')),
        ),
        'joinedAs',
      ],
    ],
  });
  return joinedAsInArray[0].joinedAs;
};

const fetchAllResourceStatusData = async () => {
  const resourceStatusData = await dbInstance.resourceStatusData.findAll({
    raw: true,
  });
  return resourceStatusData;
};

const fetchAllSkillData = async () => {
  const skillData = await dbInstance.skillDetails.findAll({
    raw: true,
  });
  return skillData;
};

const fetchAllSkillDataInArray = async () => {
  const skillDataInArray = await dbInstance.skillDetails.findAll({
    raw: true,
    attributes: [
      [
        dbInstance.Sequelize.fn('ARRAY_AGG', dbInstance.Sequelize.fn('DISTINCT', dbInstance.Sequelize.col('skill'))),
        'skills',
      ],
    ],
  });

  return skillDataInArray[0].skills;
};

const fetchAllLocationData = async () => {
  const loactionData = await dbInstance.loactionDetails.findAll({
    raw: true,
  });
  return loactionData;
};

const fetchAllLocationDataInArray = async () => {
  const locationDataInArray = await dbInstance.loactionDetails.findAll({
    raw: true,
    attributes: [
      [
        dbInstance.Sequelize.fn('ARRAY_AGG', dbInstance.Sequelize.fn('DISTINCT', dbInstance.Sequelize.col('location'))),
        'locations',
      ],
    ],
  });
  return locationDataInArray[0].locations;
};

const fetchAllDesignationData = async () => {
  const designationData = await dbInstance.designationDetails.findAll({
    raw: true,
  });
  return designationData;
};

const fetchAllDesignationDataInArray = async () => {
  const designationDataInArray = await dbInstance.designationDetails.findAll({
    raw: true,
    attributes: [
      [
        dbInstance.Sequelize.fn(
          'ARRAY_AGG',
          dbInstance.Sequelize.fn('DISTINCT', dbInstance.Sequelize.col('designation')),
        ),
        'designations',
      ],
    ],
  });
  return designationDataInArray[0].designations;
};

const fetchAllStreamDataInArray = async () => {
  const streamDataInArray = await dbInstance.streamDetails.findAll({
    raw: true,
    attributes: [
      [
        dbInstance.Sequelize.fn('ARRAY_AGG', dbInstance.Sequelize.fn('DISTINCT', dbInstance.Sequelize.col('stream'))),
        'streams',
      ],
    ],
  });
  return streamDataInArray[0].streams;
};

const fetchAllResourceStatusInArray = async () => {
  const resourceStatusInArray = await dbInstance.resourceStatusData.findAll({
    raw: true,
    attributes: [
      [
        dbInstance.Sequelize.fn(
          'ARRAY_AGG',
          dbInstance.Sequelize.fn('DISTINCT', dbInstance.Sequelize.col('resource_status')),
        ),
        'resourceStatus',
      ],
    ],
  });
  return resourceStatusInArray[0].resourceStatus;
};

const fetchAllStreamData = async () => {
  const streamData = await dbInstance.streamDetails.findAll({
    raw: true,
  });
  return streamData;
};

const deleteResourceDataById = async (request) => {
  const updatedData = await dbInstance.promAvinEmployeeDetails.update(
    { resource_status: 'Inactive', returning: true },
    { where: { resource_emp_id: request.resource_emp_id } },
  );
  // user can have many roles in tables ,select all row where user resource_emp_id is present and delete
  const deleteUserRoles = await dbInstance.promUserRoles.destroy({
    where: { resource_emp_id: request.resource_emp_id },
  });
  logger.info(`${deleteUserRoles} user roles are deleted`);
  return updatedData;
};

const verifyEmpEmail = async (employeeId) => {
  const empExist = await dbInstance.promAvinEmployeeDetails.findOne({
    raw: true,
    attributes: ['resource_emp_id', 'email_id', 'resource_name', 'resource_status'],
    where: { resource_emp_id: employeeId },
  });
  return empExist;
};

const getResourcebyNameStatus = async (request) => {
  const genericData = await dbInstance.promAvinEmployeeDetails.findAll({
    where: {
      [Op.and]: [{ resource_emp_id: request.resource_name }, { resource_status: request.resource_status }],
    },
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'] },
    raw: true,
  });
  return genericData;
};
const getResourcebyName = async (request) => {
  const genericData = await dbInstance.promAvinEmployeeDetails.findAll({
    where: { resource_emp_id: request.resource_name },

    attributes: { exclude: ['id', 'createdAt', 'updatedAt'] },
    raw: true,
  });
  return genericData;
};

const fetchAllEmpIdsInArrayExpectMainPeople = async () => {
  const resourceData = await dbInstance.promAvinEmployeeDetails.findAll({
    attributes: [
      [
        dbInstance.Sequelize.fn('ARRAY_AGG', dbInstance.Sequelize.col('avin_employee_details.resource_emp_id')),
        'employeeIds',
      ],
    ],
    raw: true,
    where: {
      resource_status: { [Op.ne]: 'Inactive' },
      designation: { [Op.notIn]: ['President', 'Vice-President'] },
    },
  });
  return resourceData[0].employeeIds;
};

const fetchAllProjectIdsInArrayExpectBuffer = async () => {
  const projectData = await dbInstance.promAvinProjectDetails.findAll({
    attributes: [
      [
        dbInstance.Sequelize.fn('ARRAY_AGG', dbInstance.Sequelize.col('avin_project_details.project_code')),
        'projectIds',
      ],
    ],
    raw: true,
    where: {
      project_type: { [Op.ne]: 'Buffer' },
    },
  });
  return projectData[0].projectIds;
};

const getResourcebyStatus = async (request) => {
  const genericData = await dbInstance.promAvinEmployeeDetails.findAll({
    where: { resource_status: request.resource_status },
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'] },
    raw: true,
  });
  return genericData;
};

const fetchAllResourcesByAllStatus = async () => {
  const resourceData = await dbInstance.promAvinEmployeeDetails.findAll({
    raw: true,
  });
  return resourceData;
};

const getDatabyEmpStatus = async (request) => {
  const genericData = await dbInstance.promAvinEmployeeDetails.findAll({
    where: { resource_emp_id: request.resource_emp_id, resource_status: request.resource_status },
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'] },
    raw: true,
  });
  return genericData;
};

const getOnlySupervisorDetails = async () => {
  const superVisorDetails = await dbInstance.promAvinResourceAllocation.findAll({
    raw: true,
    nest: true,
    // select Distinct Values (if repeated present) from column.(alias using supervisor)
    attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('avin_resource_allocation.supervisor')), 'supervisor']],
    include: [
      {
        on: {
          // select only supervisor Values(Distinct/unique) equal to resource_emp_id in avin_employee_details table
          resource_emp_id: { [Op.eq]: Sequelize.col('avin_resource_allocation.supervisor') },
        },
        model: dbInstance.promAvinEmployeeDetails,
        as: 'promAvinEmployeeDetailsForSupervisor',
        attributes: ['id', 'resource_emp_id', 'email_id', 'resource_name', 'designation', 'reporting_manager'],
      },
    ],
  });
  return superVisorDetails;
};

const promFindManagerDetails = async (managerIds) => {
  const managerData = await dbInstance.promAvinEmployeeDetails.findAll({
    attributes: ['resource_name', 'resource_emp_id', 'resource_status'],
    where: { resource_emp_id: managerIds, resource_status: 'Active' },
    raw: true,
  });
  return managerData;
};

const employeeVerifyManager = async (managerIds) => {
  const managerData = await dbInstance.promAvinEmployeeDetails.findAll({
    attributes: ['resource_name', 'resource_emp_id', 'reporting_manager'],
    where: { resource_emp_id: managerIds, is_reporting_manager: 'Yes', resource_status: 'Active', },
    raw: true,
  });
  return managerData;
};


const inactiveEmployeeData = async (employeeIds) => {
  const employeeData = await dbInstance.promAvinEmployeeDetails.findAll({
    attributes: ['resource_name', 'resource_emp_id'],
    where: { resource_emp_id: employeeIds, resource_status: 'Inactive' },
    raw: true,
  });
  return employeeData;
};

const employeeVerifyEmail = async (emailIds) => {
  const managerData = await dbInstance.promAvinEmployeeDetails.findAll({
    attributes: ['resource_emp_id', 'email_id'],
    where: { email_id: emailIds },
    raw: true,
  });
  return managerData;
};

const inactiveEmployeeAllocation = async (employeeIds) => {
  const managerData = await dbInstance.promAvinResourceAllocation.findAll({
    attributes: ['resource_emp_id', 'allocation'],
    where: { resource_emp_id: employeeIds },
    raw: true,
  });
  return managerData;
};

const saveSalaryRevisionForEmployee = async (salaryRevision) => {
  const salaryRevisionToDatabase = await dbInstance.promSalaryRevision.bulkCreate(salaryRevision, {
    returning: true,
    raw: true,
  });
  return salaryRevisionToDatabase;
};

const updateSalaryRevisionEndDateForEmployees = async (salaryRevisionDetails) => {
  const updateForEachRowId = await Promise.all(
    salaryRevisionDetails.map(async (ele) => {
      const updateRevisionEndDateForOldRecord = await dbInstance.promSalaryRevision.update(
        {
          revision_end_date: ele.revision_end_date,
        },
        {
          where: { id: ele.id },
        },
      );
      return updateRevisionEndDateForOldRecord;
    }),
  );
  return updateForEachRowId;
};

const getSalaryRevisionDetailsFromDatabase = async () => {
  const salaryRevisionDetails = await dbInstance.promSalaryRevision.findAll({
    raw: true,
    where: { revision_end_date: null },
    attributes: [
      'id',
      'resource_emp_id',
      'ctc',
      [dbInstance.Sequelize.literal('to_char("revision_start_date", \'YYYY-MM-DD\')'), 'revision_start_date'],
      [dbInstance.Sequelize.literal('to_char("revision_end_date", \'YYYY-MM-DD\')'), 'revision_end_date'],
    ],
  });
  return salaryRevisionDetails;
};

const getSalaryRevisionDetailsFromDatabaseWithoutTimeStamp = async (onlyEmployeeIds) => {
  const salaryRevisionDetailsWithoutDbTime = await dbInstance.promSalaryRevision.scope('removeTimeStamp').findAll({
    raw: true,
    where: { resource_emp_id: onlyEmployeeIds },
    attributes: [
      'id',
      'resource_emp_id',
      [dbInstance.Sequelize.literal('to_char("revision_start_date", \'YYYY-MM-DD\')'), 'revision_start_date'],
      [dbInstance.Sequelize.literal('to_char("revision_end_date", \'YYYY-MM-DD\')'), 'revision_end_date'],
    ],
  });
  return salaryRevisionDetailsWithoutDbTime;
};

const updateSalaryForEmployeeFromSalaryRevision = async (employeeId, ctc) => {
  const salaryRevisionUpdate = await dbInstance.promAvinEmployeeDetails.update(
    { ctc, per_month: ctc / 12 },
    {
      where: { resource_emp_id: employeeId },
      returning: true,
    },
  );
  return salaryRevisionUpdate;
};

const updateExpFromResourceMgmt = async (empId, totalYearsExp) => {
  let experience;
  if (parseFloat((totalYearsExp - Math.floor(totalYearsExp)).toFixed(2)) < 0.12) {
    experience = parseFloat(totalYearsExp) + 0.01;
  } else {
    experience = parseInt(totalYearsExp.toString().split('.')[0], 10) + 1;
  }
  const totalExpUpdate = await dbInstance.promAvinEmployeeDetails.update(
    { total_years_exp: experience },
    {
      where: { resource_emp_id: empId },
      returning: true,
    },
  );
  return totalExpUpdate;
};

const updateExperience = async (empId, totalYearsExp, avinDetails) => {
  let experience;
  if (parseFloat((totalYearsExp - Math.floor(totalYearsExp)).toFixed(2)) < 0.12) {
    experience = parseFloat(totalYearsExp) + 0.01;
  } else {
    experience = parseInt(totalYearsExp.toString().split('.')[0], 10) + 1;
  }
  const totalExpUpdate = await dbInstance.resourcePreviousExpDetails.update(
    { years_of_exp: experience },
    {
      where: { resource_emp_id: empId, previous_company_details: avinDetails },
      returning: true,
    },
  );
  return totalExpUpdate;

};

const allSalaryRevisionDetailsFromDatabase = async (filterCondition) => {
  const salaryRevisionDetails = await dbInstance.promSalaryRevision.findAll({
    where: filterCondition,
    raw: true,
    nest: true,
    order: [['resource_emp_id', 'ASC']],
    attributes: [
      'id',
      'resource_emp_id',
      [dbInstance.sequelize.literal('to_char("revision_start_date", \'YYYY-MM-DD\')'), 'revision_start_date'],
      [dbInstance.Sequelize.literal('to_char("revision_end_date", \'YYYY-MM-DD\')'), 'revision_end_date'],
      'ctc',
      'remarks',
      [dbInstance.sequelize.col('promSalaryRevisionEmployeeFk.resource_name'), 'resource_name'],
    ],
    include: [
      {
        model: dbInstance.promAvinEmployeeDetails,
        as: 'promSalaryRevisionEmployeeFk',
        on: {
          resource_emp_id: { [Op.eq]: Sequelize.col('prom_salary_revision.resource_emp_id') },
        },
        attributes: [],
      },
    ],
  });
  return salaryRevisionDetails;
};

const updateSalaryRevisionDetailsInDatabase = async (updatedSalaryRevision) => {
  const salaryRevisionDetails = await dbInstance.promSalaryRevision.bulkCreate(updatedSalaryRevision, {
    updateOnDuplicate: ['resource_emp_id', 'revision_start_date', 'revision_end_date', 'ctc', 'remarks'],
    validate: true,
    returning: true,
  });
  return salaryRevisionDetails;
};

const employeeDetailsOfSalaryRevisionTable = async () => {
  const salaryRevisionUniqueEmployeeDetails = await dbInstance.promSalaryRevision.findAll({
    raw: true,
    nest: true,
    // select Distinct Values (if repeated present) from column resource_emp_id of
    // prom_salary_revision table.(alias using supervisor)
    attributes: [
      [Sequelize.fn('DISTINCT', Sequelize.col('prom_salary_revision.resource_emp_id')), 'resourceEmpId'],
      [dbInstance.sequelize.col('promSalaryRevisionEmployeeFk.resource_name'), 'resourceName'],
    ],
    include: [
      {
        model: dbInstance.promAvinEmployeeDetails,
        as: 'promSalaryRevisionEmployeeFk',
        attributes: [],
      },
    ],
  });
  return salaryRevisionUniqueEmployeeDetails;
};

const fetchAllEmployeeByIdAndExcludingInactive = async (employeeIds) => {
  const allEmployeesDetails = await dbInstance.promAvinEmployeeDetails.findAll({
    attributes: ['resource_emp_id', 'resource_name'],
    raw: true,
    where: {
      resource_emp_id: employeeIds,
      resource_status: { [Op.ne]: 'Inactive' },
    },
  });
  return allEmployeesDetails;
};

const fetchAllEmployeeIdsInAnArray = async () => {
  const getAllEmployeeIds = await dbInstance.promAvinEmployeeDetails.findAll({
    raw: true,
    where: { resource_status: { [Op.ne]: 'Inactive' } },
    attributes: [
      [
        dbInstance.Sequelize.fn('ARRAY_AGG', dbInstance.Sequelize.col('avin_employee_details.resource_emp_id')),
        'employeeIds',
      ],
    ],
  });

  return getAllEmployeeIds;
};

const fetchAllEmployeeIdAndDateOfJoiningInArray = async () => {
  const getAllEmployeeIds = await dbInstance.promAvinEmployeeDetails.findAll({
    raw: true,
    attributes: [
      'resource_emp_id',
      [dbInstance.Sequelize.literal('to_char("resource_doj", \'YYYY-MM-DD\')'), 'resource_doj'],
    ],
  });
  return getAllEmployeeIds;
};

const fetchAllEmployeeSupervisorDetailsFromDb = async () => {
  const employeeWithSupervisor = await dbInstance.promAvinEmployeeDetails.findAll({
    raw: true,
    attributes: ['resource_emp_id', 'reporting_manager'],
  });
  return employeeWithSupervisor;
};

const insertSalaryRevisionData = async (salaryRevision) => {
  const salaryRevisionToDatabase = await dbInstance.promSalaryRevision.bulkCreate(salaryRevision, {
    returning: true,
    raw: true,
  });
  return salaryRevisionToDatabase;
};
const insertExperienceData = async (experienceData) => {
  const expToDatabase = await dbInstance.resourcePreviousExpDetails.bulkCreate(experienceData, {
    returning: true,
    raw: true,
  });
  return expToDatabase;
};

const getLatestSalaryOfSelectedEmployee = async (employeeId) => {
  const salaryRevisionDetails = await dbInstance.promSalaryRevision.findAll({
    where: { resource_emp_id: employeeId, revision_end_date: null },
    attributes: [
      'resource_emp_id',
      [dbInstance.Sequelize.literal('to_char("revision_start_date", \'YYYY-MM-DD\')'), 'revision_start_date'],
      [dbInstance.Sequelize.literal('to_char("revision_end_date", \'YYYY-MM-DD\')'), 'revision_end_date'],
    ],
    raw: true,
  });
  return salaryRevisionDetails;
};

const fetchAllActiveResourceDataInArray = async () => {
  const resourceInArray = await dbInstance.promAvinEmployeeDetails.findAll({
    raw: true,
    where: { resource_status: { [Op.ne]: 'Inactive' } },
    attributes: [
      [
        dbInstance.Sequelize.fn(
          'ARRAY_AGG',
          dbInstance.Sequelize.fn('DISTINCT', dbInstance.Sequelize.col('resource_emp_id')),
        ),
        'resourceEmpId',
      ],
    ],
  });
  return resourceInArray[0].resourceEmpId;
};

const fetchAllResourceEmailIdsinArray = async () => {
  const EmailIdsInArray = await dbInstance.promAvinEmployeeDetails.findAll({
    raw: true,
    attributes: [
      [
        dbInstance.Sequelize.fn('ARRAY_AGG', dbInstance.Sequelize.fn('DISTINCT', dbInstance.Sequelize.col('email_id'))),
        'resourceEmailIds',
      ],
    ],
  });
  return EmailIdsInArray[0].resourceEmailIds;
};

const fetchAllReportingManagerInArray = async () => {
  const reportingManagerData = await dbInstance.promAvinEmployeeDetails.findAll({
    attributes: [
      [
        dbInstance.Sequelize.fn('ARRAY_AGG', dbInstance.Sequelize.fn('DISTINCT', dbInstance.Sequelize.col('reporting_manager'))),
        'reportingManagerIds',
      ],
    ],
    raw: true,
    where: {
      resource_status: { [Op.eq]: 'Active' },
    },
  });
  return reportingManagerData[0].reportingManagerIds;
};



module.exports = {
  getLatestSalaryOfSelectedEmployee,
  fetchAllEmployeeSupervisorDetailsFromDb,
  fetchAllEmployeeIdsInAnArray,
  employeeDetailsOfSalaryRevisionTable,
  updateSalaryRevisionDetailsInDatabase,
  allSalaryRevisionDetailsFromDatabase,
  promFindManagerDetails,
  getOnlySupervisorDetails,
  fetchAllJoinedAsData,
  fetchAllResourceStatusData,
  fetchAllSkillData,
  fetchAllStreamData,
  getResourceByID,
  updateResourceData,
  insertResourceData,
  fetchAllResources,
  getResourceById,
  insertAllResourceData,
  deleteResourceDataById,
  verifyEmpEmail,
  getResourcebyNameStatus,
  getResourcebyName,
  fetchAllEmpIdsInArrayExpectMainPeople,
  getResourcebyStatus,
  fetchAllResourcesByAllStatus,
  getDatabyEmpStatus,
  saveSalaryRevisionForEmployee,
  getSalaryRevisionDetailsFromDatabase,
  updateSalaryForEmployeeFromSalaryRevision,
  getSalaryRevisionDetailsFromDatabaseWithoutTimeStamp,
  fetchAllEmployeeByIdAndExcludingInactive,
  updateSalaryRevisionEndDateForEmployees,
  fetchSelectedEmployeeDetailsFromDb,
  insertSalaryRevisionData,
  fetchAllSkillDataInArray,
  fetchAllStreamDataInArray,
  fetchAllResourceStatusInArray,
  fetchAllJoinedAsDataInArray,
  fetchAllEmployeeIdAndDateOfJoiningInArray,
  fetchAllLocationData,
  fetchAllDesignationData,
  employeeVerifyManager,
  fetchAllLocationDataInArray,
  fetchAllDesignationDataInArray,
  fetchAllActiveResourceDataInArray,
  inactiveEmployeeAllocation,
  fetchAllResourceEmailIdsinArray,
  employeeVerifyEmail,
  inactiveEmployeeData,
  fetchAllProjectIdsInArrayExpectBuffer,
  updateExpFromResourceMgmt,
  insertExperienceData,
  updateExperience,
  fetchAllReportingManagerInArray,
  fetchAllResourcesforCronJob
};
