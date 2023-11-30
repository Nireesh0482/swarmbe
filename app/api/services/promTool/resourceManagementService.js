/* eslint-disable arrow-body-style */
/* eslint-disable camelcase */
const { Op } = require('sequelize');
const {
  getPreviousDateFromDate,
  isDateBSameOrAfterDateA,
  todayDate,
  formatDate,
  convertYearMonthToDate,
  getCurrentMonthEndDate,
  dateAGreaterThanDateB,
  differenceInMonths,
  differenceInYears,
  differenceInDays,
} = require('../../utils/date');
const resourceMgmtRepo = require('../../repositories/promTool/resourceManagementRepository');
const { deleteUserRoles } = require('../../repositories/promTool/promRoleRepository');
const { promToolExtractOnlyResourceEmployeeIdFromElements } = require('../../helpers/helperFunctions');
const totalExpRepo = require('../../repositories/promTool/resourcePreviousExpDetailsRepository');
const logger = require('../../utils/logger');
const resourcePreviousExpDetails = require('../../models/promTool/resourcePreviousExpDetails');

const getInactiveUsersData = (userInfo) => {
  const filterInActive = userInfo
    .filter(({ resource_status: resourceStatus }) => resourceStatus === 'Inactive')
    .map(({ resource_emp_id: resourceEmpId }) => resourceEmpId);
  return filterInActive;
};

// checking employee manager is active or not from database or request
const employeeVerifyManager = async (employeeData) => {
  // const managerIds = [...new Set(employeeData.map(({ reporting_manager: managerId }) => managerId.toString()))];
  const managerIds = employeeData.map(({ reporting_manager: managerId }) => managerId.toString());
  const managerDetailsFromDb = await resourceMgmtRepo.employeeVerifyManager(managerIds);
  const dbManagerIds = [...new Set(managerDetailsFromDb.map(({ resource_emp_id: managerId }) => managerId.toString()))];

  let checkIsManagerFromRequest;
  if (dbManagerIds.length > 0) {
    checkIsManagerFromRequest = managerIds.filter((cv) => {
      return !dbManagerIds.find((e) => {
        return e === cv;
      });
    });
  } else checkIsManagerFromRequest = managerIds;
  const verifyReportingManagerArr = [];
  checkIsManagerFromRequest.map((currElement, indx) => {
    const verifyEmpIdExistORNot = employeeData.find((obj) => obj.resource_emp_id === currElement);
    if (verifyEmpIdExistORNot === undefined) {
      const index = employeeData.findIndex((obj) => obj.reporting_manager === currElement);
      verifyReportingManagerArr.push(indx);
    } else {
      const verifyIsReportingANDActive = employeeData.find(
        (obj) =>
          obj.resource_emp_id === currElement &&
          (obj.resource_status !== 'Active' || obj.is_reporting_manager === 'No'),
      );
      if (verifyIsReportingANDActive) {
        const index = employeeData.findIndex((obj) => obj.reporting_manager === currElement);
        verifyReportingManagerArr.push(indx);
      }
    }
  });
  return verifyReportingManagerArr;
};

const employeeEmailDuplicateCheck = async (request, employeeData) => {
  const emailIds = [...new Set(employeeData.map(({ email_id: emailId }) => emailId))];
  const emailDetailsFromDb = await resourceMgmtRepo.employeeVerifyEmail(emailIds);
  const dbEmailIds = [...new Set(emailDetailsFromDb.map(({ email_id: emailId }) => emailId))];
  const verifyEmailManagerArr = [];
  if (dbEmailIds.length > 0) {
    emailIds.map((currElement) => {
      const verifyEmailIdExistORNot = dbEmailIds.find((obj) => obj === currElement);
      if (verifyEmailIdExistORNot !== undefined) {
        const index = request.findIndex((obj) => obj.email_id === currElement);
        verifyEmailManagerArr.push(index);
      }
    });
  }

  return verifyEmailManagerArr;
};

// checking employee is reporting manager  yes or not from database or request
const isManagerVerifyStatus = async (employeeData) => {
  const isManagerVerify = employeeData.filter((obj) => obj.is_reporting_manager === 'No');
  const managerIds = [...new Set(isManagerVerify.map(({ resource_emp_id: managerId }) => managerId.toString()))];
  const managerDetailsFromDb = await resourceMgmtRepo.employeeVerifyManager(managerIds);
  const dbManagerIds = [...new Set(managerDetailsFromDb.map(({ resource_emp_id: managerId }) => managerId.toString()))];
  return dbManagerIds;
};

const inActiveDisable = async (employeeData) => {
  const isManagerVerify = employeeData.filter((obj) => obj.resource_status === 'Inactive');
  const employeeIds = [...new Set(isManagerVerify.map(({ resource_emp_id: employeeId }) => employeeId.toString()))];
  const employeeDetailsFromDb = await resourceMgmtRepo.inactiveEmployeeData(employeeIds);
  const dbemployeeIds = [
    ...new Set(employeeDetailsFromDb.map(({ resource_emp_id: employeeId }) => employeeId.toString())),
  ];
  const inActiveDisableArr = [];
  if (dbemployeeIds.length > 0) {
    dbemployeeIds.map((currElement) => {
      const index = employeeData.findIndex((obj) => obj.resource_emp_id === currElement);
      inActiveDisableArr.push(currElement);
    });
  }

  return inActiveDisableArr;
};

const checkInactiveEmpAllocation = async (employeeData) => {
  let inActiveAllocation = false;
  const isManagerVerify = employeeData.filter((obj) => obj.resource_status === 'Inactive');
  const employeeIds = [...new Set(isManagerVerify.map(({ resource_emp_id: employeeId }) => employeeId.toString()))];
  const allocationData = await resourceMgmtRepo.inactiveEmployeeAllocation(employeeIds);
  const checkAllocation = allocationData.filter((obj) => obj.allocation > 0);
  if (checkAllocation.length > 0) {
    inActiveAllocation = true;
  }
  return inActiveAllocation;
};

const getResourceByID = async (request) => {
  let resourceInfo = [];
  const updateRecords = [];
  const salaryRevisionRecords = [];
  const insertRecords = [];
  const userTableUpdating = [];
  const maternityTableUpdating = [];
  const experienceRecords = [];
  let checkEmail = [];

  /**
   * check whether manager details exist in database or not.if not exist, send 405
   */
  // check wheather employee reporting manager is manager or not   ---> checkManagerStatusAndVerifyReportingOrNot
  // const checkEmail = await employeeEmailDuplicateCheck(request)
  const emptyManagerRecords = await employeeVerifyManager(request);
  const isReportingVerify = await isManagerVerifyStatus(request);
  const inActiveDisableData = await inActiveDisable(request);
  // const resourceExperienceMismatchData = [];
  const inActiveAllocation = await checkInactiveEmpAllocation(request);

  if (!emptyManagerRecords.length && !isReportingVerify.length) {
    await Promise.all(
      request.map(async (projectCodeArr) => {
        const getResourceData = await resourceMgmtRepo.getResourceByID(projectCodeArr.resource_emp_id.toString());
        if (getResourceData) {
          const inActiveIgnore = inActiveDisableData.includes(projectCodeArr.resource_emp_id);
          if (inActiveIgnore === false) {
            const resourceTotalExp = await totalExpRepo.sumOfResourceExp(projectCodeArr.resource_emp_id);
            const years = Math.floor(resourceTotalExp.totalResourceExp);
            const remainingMonths = parseFloat((resourceTotalExp.totalResourceExp - years).toFixed(2));
            const months = Math.floor(remainingMonths * 100);
            const diffYears = years + Math.floor(months / 12);
            const diffMonths = months % 12;
            const totalExp = (diffYears + diffMonths / 100);
            // const totalExp =
            //   differenceInMonths(projectCodeArr.resource_doj) >= 12
            //     ? parseFloat(projectCodeArr.total_years_exp) +
            //       parseFloat(differenceInYears(projectCodeArr.resource_doj))
            //     : parseFloat(projectCodeArr.total_years_exp) +
            //       parseFloat(differenceInMonths(projectCodeArr.resource_doj) / 10);
            // // if (
            //   resourceTotalExp.totalResourceExp !== null &&
            //   resourceTotalExp.totalResourceExp === parseFloat(projectCodeArr.total_years_exp).toFixed(2)
            // ) 
            {
              updateRecords.push({
                resource_emp_id: projectCodeArr.resource_emp_id?.toString() ?? null,
                email_id: projectCodeArr.email_id?.toString()?.toLowerCase(),
                is_reporting_manager: projectCodeArr.is_reporting_manager?.toString()?.trim(),
                resource_name: projectCodeArr.resource_name?.toString()?.trim(),
                resource_doj: projectCodeArr.resource_doj?.toString()?.trim(),
                designation: projectCodeArr.designation?.toString()?.trim(),
                reporting_manager: projectCodeArr.reporting_manager?.toString()?.trim(),
                location: projectCodeArr.location?.toString()?.trim(),
                joined_as: projectCodeArr.joined_as?.toString()?.trim(),
                ctc: projectCodeArr.ctc?.toString()?.trim(),
                per_month: projectCodeArr.per_month?.toString()?.trim(),
                stream: projectCodeArr.stream?.toString()?.trim(),
                total_years_exp: totalExp,
                resource_status: projectCodeArr.resource_status?.toString()?.trim(),
                bu_name: projectCodeArr.bu_name?.toString()?.trim(),
                resource_lwd: projectCodeArr.resource_lwd?.toString()?.trim(),
              });
              userTableUpdating.push({
                resource_emp_id: projectCodeArr.resource_emp_id?.toString(),
                email_id: projectCodeArr.email_id?.toString()?.toLowerCase(),
              });
              maternityTableUpdating.push({
                resource_emp_id: projectCodeArr.resource_emp_id?.toString(),
                bu_name: projectCodeArr.bu_name?.toString()?.trim(),
                reporting_manager: projectCodeArr.reporting_manager?.toString()?.trim(),
              });
            }
            // else {
            //   const index = request.findIndex((obj) => obj.resource_emp_id === projectCodeArr.resource_emp_id);
            //   resourceExperienceMismatchData.push(
            //     {
            //       field: 'resource_emp_id',
            //       indexValue: index,
            //     },
            //     {
            //       field: 'total_years_exp',
            //       indexValue: index,
            //     },
            //   );
            // }
          }
        } else {
          let totalExp;
          const totalExperience = '0.00';
          const splittedExperience = totalExperience.split(/\./);
          const totalMonthExperience = parseInt(splittedExperience[1], 10);
          if (differenceInMonths(projectCodeArr.resource_doj) >= 12) {
            const totalMonthDiff = (differenceInMonths(projectCodeArr.resource_doj) % 12) + totalMonthExperience;
            const totalDaysDiff = differenceInDays
            const totalDiff = parseFloat(Math.floor(totalMonthDiff / 12)) + parseFloat(((totalMonthDiff % 12) / 100).toFixed(2)) + parseInt(splittedExperience[0], 10) + parseFloat(differenceInYears(projectCodeArr.resource_doj));
            totalExp = totalDiff;
          } else {
            const yearDiff = Math.floor((totalMonthExperience + differenceInMonths(projectCodeArr.resource_doj)) / 12);
            const monthDiff = (((totalMonthExperience + differenceInMonths(projectCodeArr.resource_doj)) % 12) / 100).toFixed(2);
            const totalDiff = yearDiff === 0 ? `${splittedExperience[0]}.${monthDiff.toString().split(/\./)[1]}` : `${parseInt(splittedExperience[0], 10) + yearDiff}.${monthDiff.toString().split(/\./)[1]}`;
            totalExp = totalDiff;
          }
          insertRecords.push({
            resource_emp_id: projectCodeArr.resource_emp_id?.toString() ?? null,
            email_id: projectCodeArr.email_id?.toString()?.toLowerCase(),
            is_reporting_manager: projectCodeArr.is_reporting_manager?.toString()?.trim(),
            resource_name: projectCodeArr.resource_name?.toString()?.trim(),
            resource_doj: projectCodeArr.resource_doj?.toString()?.trim(),
            designation: projectCodeArr.designation?.toString()?.trim(),
            reporting_manager: projectCodeArr.reporting_manager?.toString()?.trim(),
            location: projectCodeArr.location?.toString()?.trim(),
            joined_as: projectCodeArr.joined_as?.toString()?.trim(),
            ctc: projectCodeArr.ctc?.toString()?.trim(),
            per_month: projectCodeArr.per_month?.toString()?.trim(),
            stream: projectCodeArr.stream?.toString()?.trim(),
            total_years_exp: totalExp,
            resource_status: projectCodeArr.resource_status?.toString()?.trim(),
            bu_name: projectCodeArr.bu_name?.toString()?.trim(),
            resource_lwd: projectCodeArr.resource_lwd?.toString()?.trim(),
          });
          salaryRevisionRecords.push({
            resource_emp_id: projectCodeArr.resource_emp_id?.toString() ?? null,
            ctc: projectCodeArr.ctc?.toString()?.trim(),
            revision_start_date: projectCodeArr.resource_doj?.toString()?.trim(),
          });
          experienceRecords.push({
            resource_emp_id: projectCodeArr.resource_emp_id?.toString() ?? null,
            years_of_exp: totalExp,
            previous_company_details: 'AVIN systems private limited',
            joining_date: projectCodeArr.resource_doj?.toString()?.trim(),
          });
        }
      }),
    );

    if (updateRecords.length > 0) {
      // if (resourceExperienceMismatchData.length <= 0)
      {
        resourceInfo = await resourceMgmtRepo.updateResourceData(
          updateRecords,
          userTableUpdating,
          maternityTableUpdating,
        );
      }
    }
    if (insertRecords.length > 0) {
      checkEmail = await employeeEmailDuplicateCheck(request, insertRecords);
      if (!checkEmail.length) {
        resourceInfo = await resourceMgmtRepo.insertAllResourceData(insertRecords);
        if (resourceInfo.length > 0) {
          const insertSalaryRevision = await resourceMgmtRepo.insertSalaryRevisionData(salaryRevisionRecords);
          const insertExperienceRecords = await resourceMgmtRepo.insertExperienceData(experienceRecords);
        }
      }
    }
    const inActiveUsers = getInactiveUsersData(request);

    // inactive roles are deleted from prom_avin_roles table

    const deleteInActiveUsers = await deleteUserRoles(inActiveUsers);

    logger.info(`${deleteInActiveUsers} user roles are deleted`);

  }
  return {
    resourceInfo,
    emptyManagerRecords,
    isReportingVerify,
    inActiveAllocation,
    checkEmail,
    //resourceExperienceMismatchData,
  };
};

const insertResourceDetails = async (request) => {
  const updateRecords = [];
  const salaryRevisionRecords = [];
  const experienceRecords = [];
  let insertResource = [];
  let checkEmail = [];
  // check Whether employee reporting manager is manager or not   --->
  const emptyManagerRecords = await employeeVerifyManager(request);
  if (!emptyManagerRecords.length) {
    const insertRecords = [];

    await Promise.all(
      request.map(async (projectCodeArr) => {
        const getResourceData = await resourceMgmtRepo.getResourceByID(projectCodeArr.resource_emp_id.toString());
        if (getResourceData) {
          updateRecords.push({
            resource_emp_id: projectCodeArr.resource_emp_id.toString(),
            resource_name: projectCodeArr.resource_name.toString(),
          });
        } else {
          let totalExp;
          const totalExperience = '0.00';
          const splittedExperience = totalExperience.split(/\./);
          const totalMonthExperience = parseInt(splittedExperience[1], 10);
          if (differenceInMonths(projectCodeArr.resource_doj) >= 12) {
            const totalMonthDiff = (differenceInMonths(projectCodeArr.resource_doj) % 12) + totalMonthExperience;
            const totalDiff = parseFloat(Math.floor(totalMonthDiff / 12)) + parseFloat(((totalMonthDiff % 12) / 100).toFixed(2)) + parseInt(splittedExperience[0], 10) + parseFloat(differenceInYears(projectCodeArr.resource_doj));
            totalExp = totalDiff;
          } else {
            const yearDiff = Math.floor((totalMonthExperience + differenceInMonths(projectCodeArr.resource_doj)) / 12);
            const monthDiff = (((totalMonthExperience + differenceInMonths(projectCodeArr.resource_doj)) % 12) / 100).toFixed(2);
            const totalDiff = yearDiff === 0 ? `${splittedExperience[0]}.${monthDiff.toString().split(/\./)[1]}` : `${parseInt(splittedExperience[0], 10) + yearDiff}.${monthDiff.toString().split(/\./)[1]}`;
            totalExp = totalDiff;
          }
          insertRecords.push({
            resource_emp_id: projectCodeArr.resource_emp_id?.toString() ?? null,
            email_id: projectCodeArr.email_id?.toString()?.toLowerCase(),
            is_reporting_manager: projectCodeArr.is_reporting_manager?.toString()?.trim(),
            resource_name: projectCodeArr.resource_name?.toString()?.trim(),
            resource_doj: projectCodeArr.resource_doj?.toString()?.trim(),
            designation: projectCodeArr.designation?.toString()?.trim(),
            reporting_manager: projectCodeArr.reporting_manager?.toString()?.trim(),
            location: projectCodeArr.location?.toString()?.trim(),
            joined_as: projectCodeArr.joined_as?.toString()?.trim(),
            ctc: projectCodeArr.ctc?.toString()?.trim(),
            per_month: projectCodeArr.per_month?.toString()?.trim(),
            stream: projectCodeArr.stream?.toString()?.trim(),
            total_years_exp: totalExp,
            resource_status: projectCodeArr.resource_status?.toString()?.trim(),
            bu_name: projectCodeArr.bu_name?.toString()?.trim(),
            resource_lwd: projectCodeArr.resource_lwd?.toString()?.trim(),
          });
          salaryRevisionRecords.push({
            resource_emp_id: projectCodeArr.resource_emp_id?.toString() ?? null,
            ctc: projectCodeArr.ctc?.toString()?.trim(),
            revision_start_date: projectCodeArr.resource_doj?.toString()?.trim(),
          });
          experienceRecords.push({
            resource_emp_id: projectCodeArr.resource_emp_id?.toString() ?? null,
            years_of_exp: totalExp,
            previous_company_details: 'AVIN systems private limited',
            joining_date: projectCodeArr.resource_doj?.toString()?.trim(),
          });
        }
      }),
    );
    if (insertRecords.length > 0) {
      checkEmail = await employeeEmailDuplicateCheck(request, insertRecords);
      if (!checkEmail.length) {
        insertResource = await resourceMgmtRepo.insertAllResourceData(insertRecords);
        if (insertResource.length > 0) {
          const insertSalaryRevision = await resourceMgmtRepo.insertSalaryRevisionData(salaryRevisionRecords);
          const insertExperienceRecords = await resourceMgmtRepo.insertExperienceData(experienceRecords);
        }
      }
    }
  }
  return { insertResource, emptyManagerRecords, updateRecords, checkEmail };
};

const fetchAllResources = async () => {
  // fetch all user and add manager_name before returning
  const resourceData = await resourceMgmtRepo.fetchAllResources();
  const resourceWithManagerDetail = resourceData.map(({ reporting_manager, ...restOfEmployeeDetails }) => {
    const managerName = resourceData.find(({ resource_emp_id: managerId }) => managerId === reporting_manager);
    return { ...restOfEmployeeDetails, reporting_manager, reporting_manager_name: managerName.resource_name };
  });
  return resourceWithManagerDetail;
};

const getResourceById = async (request) => {
  const resourceInfo = await resourceMgmtRepo.getResourceById(request);
  return resourceInfo;
};

const fetchAllJoinedAsData = async () => {
  const joinedAsData = await resourceMgmtRepo.fetchAllJoinedAsData();
  return joinedAsData;
};

const fetchAllProjGroupNameData = async () => {
  const projGroupNameData = await resourceMgmtRepo.fetchAllProjGroupNameData();
  return projGroupNameData;
};

const fetchAllProjStatusData = async () => {
  const projStatusData = await resourceMgmtRepo.fetchAllProjStatusData();
  return projStatusData;
};

const fetchAllProjTypesData = async () => {
  const projTypesData = await resourceMgmtRepo.fetchAllProjTypesData();
  return projTypesData;
};

const fetchAllResourceStatusData = async () => {
  const resourceStatusData = await resourceMgmtRepo.fetchAllResourceStatusData();
  return resourceStatusData;
};

const fetchAllSkillData = async () => {
  const skillData = await resourceMgmtRepo.fetchAllSkillData();
  return skillData;
};

const fetchAllLocationData = async () => {
  const locationData = await resourceMgmtRepo.fetchAllLocationData();
  return locationData;
};

const fetchAllDesignationData = async () => {
  const designationData = await resourceMgmtRepo.fetchAllDesignationData();
  return designationData;
};

const fetchAllStreamData = async () => {
  const streamData = await resourceMgmtRepo.fetchAllStreamData();
  return streamData;
};

const deleteResource = async (request) => {
  const resourceData = await resourceMgmtRepo.deleteResourceDataById(request);
  return resourceData;
};

const getEmployeeDetailsFromDb = async (request) => {
  const employeeIdsFromRequest = [...new Set(request.map((ele) => ele.resource_emp_id))];
  const fetchEmployeeNameFromId = await resourceMgmtRepo.fetchSelectedEmployeeDetailsFromDb(employeeIdsFromRequest);
  return fetchEmployeeNameFromId;
};

const superVisorDetailsFromDbService = async () => {
  const supervisorDetails = await resourceMgmtRepo.getOnlySupervisorDetails();
  // stripping unnecessary data.
  const necessarySupervisorDetails = supervisorDetails.map(({ promAvinEmployeeDetailsForSupervisor }) => ({
    ...promAvinEmployeeDetailsForSupervisor,
  }));
  return necessarySupervisorDetails;
};

const checkDuplicateSalaryRevisionDetails = (salaryRevisionFromDb, currentValue) => {
  return salaryRevisionFromDb.find(({ resource_emp_id, revision_start_date }) => {
    /**
     * check whether same, @var resource_emp_id, @var revision_start_date, combination already
     * @var revision_end_date is not being validated as it always be null  in database,
     * if exist send true else send false
     */
    const duplicateSalaryRevisionDetails =
      resource_emp_id === currentValue.resource_emp_id &&
      revision_start_date === formatDate(currentValue.revision_start_date);
    return duplicateSalaryRevisionDetails !== false;
  });
};

const compareNewAndExistingSalaryRevisionDetails = (newSalaryRevision, salaryRevisionFromDb) => {
  return newSalaryRevision.reduce(
    // duplicateRevisionData is data already present in prom_salary_revision Table,
    // duplicateRevisionDataIndexValue is the index of row in Table present in frontend, it used to point
    // which rows is duplicate entry in frontend
    ([duplicateRevisionData, duplicateRevisionDataIndexValue], currentValue, arrayIndex) => {
      const isDataDuplicate = checkDuplicateSalaryRevisionDetails(salaryRevisionFromDb, currentValue);
      if (isDataDuplicate) {
        duplicateRevisionData.push(currentValue);
        duplicateRevisionDataIndexValue.push(arrayIndex);
        return [duplicateRevisionData, duplicateRevisionDataIndexValue];
      }
      return [duplicateRevisionData, duplicateRevisionDataIndexValue];
    },
    [[], []],
  );
};

const updatedPreviousRevisionEndDateForEmployee = (allEmployeeSalaryRevisionData, newSalaryRevisionData) => {
  /**
   * @summary @var newSalaryRevisionData contains new salary revision for employees.
   * if employee revision_end_date is null in this array of elements, which means employee salary is revised.
   * step 1: filter the records whether employee revision_end_date is null.
   * step 2: create a array over the filtered records and return [employee id and previous day of revision_start_date]
   *  in array.this array of array's will be used to create Map data structure {@link employeeWithRevisionEndDateMap}).
   */
  const newSalaryRevisionWithNullRevisionEndDate = newSalaryRevisionData
    .filter(({ revision_end_date }) => revision_end_date === null)
    .map(({ resource_emp_id, revision_start_date }) => {
      // returning array to create a Map with unique employee id and revision_end_date for updating old/previous record
      return [resource_emp_id, getPreviousDateFromDate(revision_start_date)];
    });

  /**
   * this is used to fetch the revision_end_date for the employee which is calculated from incoming new salary Revision
   * and this revision_end_date will be updated for the previous employee record where revision_end_date was null.
   * summary : so this is too ensure only one record for each employee will have revision_end_date as null in database.
   */
  const employeeWithRevisionEndDateMap = new Map(newSalaryRevisionWithNullRevisionEndDate);

  /**
   *  filter record which as null as revision_end_date in database to update the previous record where
   *  revision_end_date is null [revision_end_date will be revision_start_date - 1 day from new employee salary Record]
   */
  const databaseRecordWithNullRevisionEndDate = allEmployeeSalaryRevisionData
    .filter(({ revision_end_date }) => revision_end_date === null)
    .map(({ id, resource_emp_id, revision_start_date }) => {
      return {
        id,
        resource_emp_id,
        revision_start_date,
        revision_end_date: employeeWithRevisionEndDateMap.get(resource_emp_id),
      };
    });

  return databaseRecordWithNullRevisionEndDate;
};

const saveEmployeeSalaryRevision = async (salaryRevision) => {
  const onlyEmployeeIds = promToolExtractOnlyResourceEmployeeIdFromElements(salaryRevision);

  // get already existing employee salary Revision information from prom_salary_revision Table
  const allEmployeeSalaryRevisionData = await resourceMgmtRepo.getSalaryRevisionDetailsFromDatabaseWithoutTimeStamp(
    onlyEmployeeIds,
  );

  // compare new Data with existing data in database
  const [, duplicateRevisionDataIndexValue] = compareNewAndExistingSalaryRevisionDetails(
    salaryRevision,
    allEmployeeSalaryRevisionData,
  );

  // if any duplicate Record coming from frontend ,throw 405(method not allow)
  if (duplicateRevisionDataIndexValue.length > 0) {
    return {
      duplicateSalaryRevisionPresent: true,
      dataInfo: {
        // duplicateRevisionData,  // send duplicate records details only if necessary
        duplicateRevisionDataIndexValue,
      },
    };
  }

  const updatePreviousRevisionEndDate = updatedPreviousRevisionEndDateForEmployee(
    allEmployeeSalaryRevisionData,
    salaryRevision,
  );

  const updatePreviousDetailsForEmployee = await resourceMgmtRepo.updateSalaryRevisionEndDateForEmployees(
    updatePreviousRevisionEndDate,
  );

  // if no duplicate data in from frontEnd then add it to database.
  const employeeSalaryRevision = await resourceMgmtRepo.saveSalaryRevisionForEmployee(salaryRevision);

  return {
    duplicateSalaryRevisionPresent: false,
    dataInfo: {
      newEmployeeSalaryRevision: employeeSalaryRevision,
      updatePreviousDetailsForEmployee,
    },
  };
};

const updateSalaryRevisionForEmployees = async () => {
  // this function is triggered by Cron job on 6th of every month or can be triggered by
  // salary Revision update API(click of trigger revision button in frontend)
  const salaryRevisionDetailsFromDatabase = await resourceMgmtRepo.getSalaryRevisionDetailsFromDatabase();

  /**
   * @description get all records from salaryRevision Table. filter Records in which current(today's) date
   * is greater or equal to revision start date.(we are not considering revision_end_date because it will
   * null, and we are considering current date instead of null for revision_end_date). which leads below condition
   * 1) instead of this : CurrentDate >= revision_start_date && currentDate <= revision_end_date(which is
   * null and it will current date);
   * 2) CurrentDate >= revision_start_date && currentDate <= currentDate, thereby second condition
   * will always be true
   * 3) optimized condition: CurrentDate >= revision_start_date
   */
  const salaryRevisionNonCompletedRevision = salaryRevisionDetailsFromDatabase.filter(
    ({ revision_start_date: revisionStartDate }) => {
      // is currentDate is greater Or equal to revision_start_date then return true else false
      return isDateBSameOrAfterDateA(revisionStartDate, todayDate());
    },
  );

  /**
   * @description after getting all records where salary Revision is in greater or equal to
   * revision start date, update the CTC of employees in the Main Table.
   */
  const updateSalaryForEmployeeInMainTable = await Promise.all(
    salaryRevisionNonCompletedRevision.map(async ({ resource_emp_id: empId, ctc }) => {
      const updatedRecords = await resourceMgmtRepo.updateSalaryForEmployeeFromSalaryRevision(empId, ctc);
      const updatedEmployeeRecord = updatedRecords[1][0].dataValues;
      return {
        resource_emp_id: empId,
        resource_name: updatedEmployeeRecord.resource_name,
        newCTC: updatedEmployeeRecord.ctc,
      };
    }),
  );

  return updateSalaryForEmployeeInMainTable;
};

const updatingExperienceForEmployees = async () => {
  const resourceFromDatabase = await resourceMgmtRepo.fetchAllResourcesforCronJob();
  const updateExpForEmployeeInMainTable = await Promise.all(
    resourceFromDatabase.map(async ({ resource_emp_id: empId, total_years_exp: totalYearsExp }) => {
      const updatedRecords = await resourceMgmtRepo.updateExpFromResourceMgmt(empId, totalYearsExp);
      return updatedRecords;
    }),
  );
  return updateExpForEmployeeInMainTable;
};

// const updatingExperienceForEmployees = async () => {
//   const resourceFromDatabase = await resourceMgmtRepo.fetchAllResources();
//   const resouceFromPreviousCompanyDetails = await totalExpRepo.fetchAllAvinDetails();

//   const updateExpForEmployeeInMainTable = await Promise.all(
//     resourceFromDatabase.map(async ({ resource_emp_id: empId, total_years_exp: totalYearsExp }) => {
//       const updatedRecords = await resourceMgmtRepo.updateExpFromResourceMgmt(empId, totalYearsExp);
//       return updatedRecords;
//     }),
//   );
//   const updateExpInResourceExpDataTable = await Promise.all(
//     resouceFromPreviousCompanyDetails.map(async ({ resource_emp_id: empId, years_of_exp: totalYearsExp }) => {
//       const updatedExpRecords = await resourceMgmtRepo.updateExperience(empId, totalYearsExp);
//       return updatedExpRecords
//     })
//   )
//   return {
//     updateExpInResourceExpDataTable,
//     updateExpForEmployeeInMainTable
//   };
// };

const updatingExperienceForAvinEmployees = async () => {
  const resouceFromPreviousCompanyDetails = await totalExpRepo.fetchAllAvinDetails();
  const updateExpForAvinEmployeeTable = await Promise.all(
    resouceFromPreviousCompanyDetails.map(async ({ resource_emp_id: empId, years_of_exp: totalYearsExp, previous_company_details: avinDetails }) => {
      const updatedExpRecords = await resourceMgmtRepo.updateExperience(empId, totalYearsExp, avinDetails);
      return updatedExpRecords;
    }),
  );
  return updateExpForAvinEmployeeTable;
};



const filterForSalaryRevisionFetch = (requestDetails) => {
  // this condition for fetching employee all salary revision record
  if (requestDetails?.resource_emp_id) {
    return { resource_emp_id: requestDetails.resource_emp_id };
  }

  // this condition when user clicks on exports
  if (requestDetails?.resource_emp_id == null && requestDetails?.startMonth?.toString()?.length > 4) {
    const requestStartMonth = convertYearMonthToDate(requestDetails.startMonth);
    const isStartMoreThanCurrentDate = dateAGreaterThanDateB(requestStartMonth, todayDate());
    if (isStartMoreThanCurrentDate) {
      return {
        revision_start_date: { [Op.gte]: requestStartMonth },
      };
    }
    return {
      revision_start_date: { [Op.gte]: convertYearMonthToDate(requestDetails.startMonth) },
      revision_end_date: {
        [Op.or]: {
          [Op.lte]: getCurrentMonthEndDate(),
          [Op.eq]: null,
        },
      },
    };
  }
  // fail case and get all condition
  if (requestDetails?.resource_emp_id == null && requestDetails?.startMonth == null) {
    return undefined;
  }
};
const salaryRevisionFromDatabase = async (requestDetails) => {
  const filterConditionForEmployeeDetails = filterForSalaryRevisionFetch(requestDetails);
  const salaryRevisionDetails = await resourceMgmtRepo.allSalaryRevisionDetailsFromDatabase(
    filterConditionForEmployeeDetails,
  );
  return salaryRevisionDetails;
};

const updateSalaryRevisionInRevisionTable = async (updatedSalaryRevisionDetails) => {
  const updateSalaryRevisionDetails = await resourceMgmtRepo.updateSalaryRevisionDetailsInDatabase(
    updatedSalaryRevisionDetails,
  );
  return updateSalaryRevisionDetails;
};

const employeeDetailsFromSalaryRevisionTable = async () => {
  const employeeDetailsFromRevisionTable = await resourceMgmtRepo.employeeDetailsOfSalaryRevisionTable();
  return employeeDetailsFromRevisionTable;
};

const getAllPromToolEmployeeIdsInArray = async () => {
  const employeeIds = await resourceMgmtRepo.fetchAllEmployeeIdsInAnArray();
  return employeeIds[0].employeeIds;
};

const getAllPromToolEmpIdsAndTheirDOJ = async () => {
  const empIdsAndDOJ = await resourceMgmtRepo.fetchAllEmployeeIdAndDateOfJoiningInArray();
  return empIdsAndDOJ;
};
const fetchAllEmployeeAndTheirSupervisorDetails = async () => {
  const employeeWithSupervisor = await resourceMgmtRepo.fetchAllEmployeeSupervisorDetailsFromDb();
  return employeeWithSupervisor;
};

const getLatestSalaryOfEmployee = async (employeeIds) => {
  const salaryRevisionDetails = await resourceMgmtRepo.getLatestSalaryOfSelectedEmployee(employeeIds);
  return salaryRevisionDetails;
};

module.exports = {
  getLatestSalaryOfEmployee,
  getAllPromToolEmployeeIdsInArray,
  fetchAllEmployeeAndTheirSupervisorDetails,
  employeeDetailsFromSalaryRevisionTable,
  updateSalaryRevisionInRevisionTable,
  salaryRevisionFromDatabase,
  updateSalaryRevisionForEmployees,
  saveEmployeeSalaryRevision,
  superVisorDetailsFromDbService,
  fetchAllJoinedAsData,
  fetchAllProjGroupNameData,
  fetchAllProjStatusData,
  fetchAllProjTypesData,
  fetchAllResourceStatusData,
  fetchAllSkillData,
  fetchAllStreamData,
  getResourceByID,
  fetchAllResources,
  getResourceById,
  insertResourceDetails,
  deleteResource,
  getEmployeeDetailsFromDb,
  getAllPromToolEmpIdsAndTheirDOJ,
  fetchAllLocationData,
  fetchAllDesignationData,
  updatingExperienceForEmployees,
  updatingExperienceForAvinEmployees
};
