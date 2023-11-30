/* eslint-disable arrow-body-style */
/* eslint-disable max-len */
/* eslint-disable camelcase */
const {
  dayjs,
  getTodayAndNextMonthStartAndEndDates,
  checkWeekSharedBetweenTwoDifferentYear,
  endOfTheWeekDate,
  getShortMonthAbbreviation,
  addOneDay,
  monthOfDate,
  getTodayAndNextMonthTwentyForthDates,
  convertFullIntegerDateToYearMonthString,
  overLapBetweenDate,
  formatDate,
  convertToNumericMonthYear,
} = require('../../utils/date');
const promResourceAllocationHelper = require('./promResourceAllocationHelper');
const resourceMgmtRepo = require('../../repositories/promTool/resourceManagementRepository');
const promResourceAllocationRepository = require('../../repositories/promTool/promResourceAllocationRepository');
const promEngineeringCostRepository = require('../../repositories/promTool/averageEnggCostRepository');
const {
  fetchAllEmpIdsInArrayExpectMainPeople,
  fetchAllProjectIdsInArrayExpectBuffer,
  fetchAllEmployeeSupervisorDetailsFromDb,
  fetchAllResources
} = require('../../repositories/promTool/resourceManagementRepository');
const { groupByEmployeeId, createWeeksForTheMonthWithZeroAllocation } = require('./promReportsService');
const { getBufferProjectFromDatabase } = require('../../repositories/promTool/projectDataRepository');
const {
  managerMailingDataForPartialOrUnallocatedData,
  managerMailingDataUnallocatedData,
  managerMailingDataForBufferEmployeeList,
  managerMailingDataForPlannedActualResourceCount,
  managerMailingDataForPartialAllocatedResources,
  allGroupHeadForPartialAllocatedResources
} = require('../../utils/EmailSchema');
const { fetchAllEmployeeAndTheirSupervisorDetails } = require('./resourceManagementService');
const { sendMail } = require('../../utils/email');
const logger = require('../../utils/logger');

const fetchAllResourceAllocationData = async () => {
  const resourceAllocationData = await promResourceAllocationRepository.resourceAllocationData();
  return resourceAllocationData;
};

const fetchAllocationDetails = async () => {
  const allocationDetails = await promResourceAllocationRepository.allocationDetails();
  return allocationDetails;
};

const getAllocationDetailsByProject = async (projectCodeId) => {
  const projectAllocationDetails = await promResourceAllocationRepository.getAllocationDetailsByProjectId(
    projectCodeId,
  );
  return projectAllocationDetails;
};

const deleteResourceAllocationDetailsService = async (rowIds) => {
  const deleteResourceAllocation = await promResourceAllocationRepository.deleteResourceAllocationInDb(rowIds);
  return deleteResourceAllocation;
};

// if [project_code,resource_emp_id,start_date,format_date] combination already exist in database,then its duplicate row
const checkDuplicateDataExistenceInDb = (resourceAllocationFromDb, currentValue) => {
  return resourceAllocationFromDb.find(({ project_code, resource_emp_id, start_date, end_date }) => {
    /**
     * check whether same @var project_code ,@var resource_emp_id, @var start_date, @var end_date combination already
     * exist in database, if exist send true else send false
     */
    const duplicateResourceBoolean =
      project_code === currentValue.project_code &&
      resource_emp_id === currentValue.resource_emp_id &&
      start_date === formatDate(currentValue.start_date) &&
      end_date === formatDate(currentValue.end_date);
    return duplicateResourceBoolean !== false;
  });
};

const compareNewAndExistingResourceAllocationData = (updatedOrNewResource, resourceAllocationFromDb) => {
  const [
    newResourceAllocationData,
    duplicateResourceAllocationData,
    resourceAllocationUpdateData,
    duplicateResourceIndexValue,
  ] = updatedOrNewResource.reduce(
    (
      // duplicateIndexValue consist of index from the frontend row of table,it used to point which row is duplicate
      // in frontend
      [newResourceData, duplicateResourceData, resourceDataForUpdate, duplicateIndexValue],
      currentValue,
      arrayIndex,
    ) => {
      /**
       * if @var ra_id is coming from frontend then user is trying to update the existing data
       */
      if (currentValue?.ra_id) {
        resourceDataForUpdate.push({
          ra_id: currentValue.ra_id,
          resource_emp_id: currentValue.resource_emp_id.toString().trim(),
          project_code: currentValue.project_code.toString().trim(),
          supervisor: currentValue.supervisor.toString().trim(),
          start_date: currentValue.start_date.toString().trim(),
          end_date: currentValue.end_date.toString().trim(),
          allocation: currentValue.allocation.toString().trim(),
          billable_resource: currentValue.billable_resource.toString().trim(),
          resource_status_in_project: currentValue.resource_status_in_project?.toString().trim(),
        });
        return [newResourceData, duplicateResourceData, resourceDataForUpdate, duplicateIndexValue];
      }
      /**
       * if no @var ra_id is present for the element, then user is trying to add new record.
       * in order to allow to save,check whether project_code,resource_emp_id ,start_date,end_date combination
       * doesn't exist already in database.if not exist then allow user to save
       */
      const isDataDuplicate = checkDuplicateDataExistenceInDb(resourceAllocationFromDb, currentValue);

      if (isDataDuplicate) {
        duplicateResourceData.push(currentValue);
        duplicateIndexValue.push(arrayIndex);
        return [newResourceData, duplicateResourceData, resourceDataForUpdate, duplicateIndexValue];
      }

      // newResourceData array consist of non-duplicate/fresh record.
      newResourceData.push({
        resource_emp_id: currentValue.resource_emp_id.toString().trim(),
        project_code: currentValue.project_code.toString().trim(),
        supervisor: currentValue.supervisor.toString().trim(),
        start_date: currentValue.start_date.toString().trim(),
        end_date: currentValue.end_date.toString().trim(),
        allocation: currentValue.allocation.toString().trim(),
        billable_resource: currentValue.billable_resource.toString().trim(),
        resource_status_in_project: currentValue.resource_status_in_project?.toString().trim(),
      });
      return [newResourceData, duplicateResourceData, resourceDataForUpdate, duplicateIndexValue];
    },
    [[], [], [], []],
  );

  return {
    newResourceAllocationData,
    duplicateResourceAllocationData,
    resourceAllocationUpdateData,
    duplicateResourceIndexValue,
  };
};

const verifyEmployeeAndSupervisorCombination = async (updatedOrNewResource) => {
  const allEmployeeWithSupervisorDetails = await fetchAllEmployeeAndTheirSupervisorDetails();
  const employeeSupervisorMap = new Map(
    allEmployeeWithSupervisorDetails.map(({ resource_emp_id, reporting_manager }) => [
      resource_emp_id,
      reporting_manager,
    ]),
  );

  const nonMatchingDetails = updatedOrNewResource
    .map((frontEnd, index) => {
      const employeeSupervisorMatch = frontEnd.supervisor === employeeSupervisorMap.get(frontEnd.resource_emp_id);
      if (!employeeSupervisorMatch) {
        return {
          index,
          field: 'supervisor',
          errorMessage: "Mapped Supervisor doesn't match with employee's supervisor Data",
        };
      }
      return false; // false means resource_emp_id and supervisor are matching
    })
    .filter((ele) => ele !== false); // filter out element which are needed to be shown as error in frontend
  return nonMatchingDetails;
};

const checkCostPlanDataForAllMonthForAllData = async (updatedResource) => {
  // get costPlan data for all project from database
  const allCostPlanForProjectsFromDb = await promResourceAllocationRepository.getAllProjectResourcePlan();

  /**
   * @description create a Array SET(No repeated data) for project_code(as ResourceProjectCode) and
   * month_year(as ResourceMonthYear) object, so it will be easy to compare with costPlan data.
   * @var resourceAllocationData is SET(No repeated data) of project_code and month_year.
   * @param projectAndMonthYearSET is empty at first and contains distinctive object of
   * { resourceProjectCode,resourceMonthYear }.which will be used to compare with cost plan
   * data from database and check whether {resourceProjectCode, resourceMonthYear} exist in cost
   * plan table.
   * @var current is the current element in the performing cycle.
   */
  const resourceAllocationData = updatedResource.reduce((projectAndMonthYearSET, current) => {
    // check start date is in projectAndMonthYearSET Array,because start_date month and end_date month can be same
    // it will avoid multiple entries of month for same project_code
    const resourceStartDateAlreadyExistInArray = projectAndMonthYearSET.find(
      ({ resourceProjectCode, resourceMonthYear }) => {
        return (
          resourceProjectCode === current.project_code &&
          resourceMonthYear === convertFullIntegerDateToYearMonthString(current.start_date)
        );
      },
    );

    if (!resourceStartDateAlreadyExistInArray) {
      projectAndMonthYearSET.push({
        resourceProjectCode: current.project_code,
        resourceMonthYear: convertFullIntegerDateToYearMonthString(current.start_date),
        projectName: current.project_name,
      });
    }
    // check end date is in projectAndMonthYearSET Array,because start_date month and end_date month can be same
    // it will avoid multiple entries of month for same project_code
    const resourceEndDateAlreadyExistInArray = projectAndMonthYearSET.find(
      ({ resourceProjectCode, resourceMonthYear }) => {
        return (
          resourceProjectCode === current.project_code &&
          resourceMonthYear === convertFullIntegerDateToYearMonthString(current.end_date)
        );
      },
    );

    if (!resourceEndDateAlreadyExistInArray) {
      projectAndMonthYearSET.push({
        resourceProjectCode: current.project_code,
        resourceMonthYear: convertFullIntegerDateToYearMonthString(current.end_date),
        projectName: current.project_name,
      });
    }
    return projectAndMonthYearSET;
  }, []);

  /** filter the months(year-month) by comparing with database, if month(sent from user) doesn't exist
   *  in database(cost_plan table).then add to a Array(@var projectCodeAndMonthYearArray) and send to user
   *  to inform that cost plan for this project and particular month.
   */
  const noCostPlanForMonthYearData = resourceAllocationData.reduce(
    (projectCodeAndMonthYearArray, { resourceProjectCode, resourceMonthYear, projectName }) => {
      const costExistInDatabase = allCostPlanForProjectsFromDb.find(({ project_code, month_year }) => {
        return project_code === resourceProjectCode && resourceMonthYear === month_year;
      });
      if (!costExistInDatabase) {
        projectCodeAndMonthYearArray.push({ resourceProjectCode, resourceMonthYear, projectName });
      }
      return projectCodeAndMonthYearArray;
    },
    [],
  );

  return noCostPlanForMonthYearData;
};

const getAllBufferProjectFromDb = async () => {
  const allBufferProject = await promResourceAllocationRepository.getAllBufferProjectFromDb();
  return allBufferProject;
};

const checkUpdatingDataThreshold = (existingDataPreviousRecords, existingDataUpdatedRecords) => {
  const verifyExistingDataPreviousAndNewData = promResourceAllocationHelper.verifyResourceAllocationThreshold(
    existingDataPreviousRecords,
    existingDataUpdatedRecords,
  );
  return verifyExistingDataPreviousAndNewData;
};

/**
 *
 * @param {Array<Object>} resourceAllocationUpdateData [From frontEnd] this are data which are from database but are
 *    modified/updated
 * @param {Array<Object>} allResourceAllocationDetails [from db] this are all the allocation records regarding the
 *  employees from database
 * @returns the records from the allResourceAllocationDetails excluding resourceAllocationUpdateData records.
 */
const getOverlappingExistingDataByDate = (resourceAllocationUpdateData, allResourceAllocationDetails) => {
  // primaryKeySET saved primaryKey of rows which will be used to filter/exclude those rows from final return
  const primaryKeySET = [...new Set(resourceAllocationUpdateData.map((ele) => ele.ra_id))];

  /**
   *  @description find all the overlapping records(by using dates[start_date,end_date]) from allResourceAllocationDetails
   *  with resourceAllocationUpdateData[start_date,end_date].then filter out records from allResourceAllocationDetails where
   *  ra_id from resourceAllocationUpdateData.
   *  use case @description : By excluding (updated existing data) from the (database existing data), we can calculate
   *  updated existing data allocation result. i.e(by updating the existing data records with another allocation, is the threshold
   *  value is below or equal to 1 only).if its below or equal to 1 then proceed to next functions otherwise throw error.
   *
   */
  const overLappingDataFromDb = allResourceAllocationDetails
    .filter(({ start_date, end_date }) => {
      const overlappingData = resourceAllocationUpdateData.some((ele) => {
        const isOverLapping = overLapBetweenDate(start_date, end_date, ele.start_date, ele.end_date);
        return isOverLapping; // returns true or false
      });
      return overlappingData;
    })
    .filter((ele) => !primaryKeySET.includes(ele.ra_id));

  return overLappingDataFromDb;
};

const calculateThresholdForUpdatingOfExistingDetails = (resourceAllocationUpdateData, allResourceAllocationDetails) => {
  /**
   * @summary this functionality is to check only the threshold of updated existing data if
   * user made modification to existing data.
   * @description {@link_resourceAllocationUpdateData} contains all the rows which are already exist
   *        database but user modified the allocation.so the steps for processing the updated value are:
   *  step 1:get the database rows which are overlapping with dates from resourceAllocationUpdateData
   *         and which are not equal to ra_id(primary key).
   *  step 2:By using overLappingExistingData, we can compare newly updated existing rows and old existing rows threshold
   *         (i.e more than or equal to 1). if more than 1 return error to frontEnd or else move to process new records
   *         threshold validation.
   */
  const overlappingExistingData = getOverlappingExistingDataByDate(
    resourceAllocationUpdateData,
    allResourceAllocationDetails,
  );

  // this validation for modifying/updating existing records
  const verifyExistingDataUpdateThreshold = checkUpdatingDataThreshold(
    overlappingExistingData,
    resourceAllocationUpdateData,
  );

  if (verifyExistingDataUpdateThreshold.exceededAllocationIndexArray.length > 0) {
    return {
      updatedAllocationForExistingCrossed: true,
      verifyExistingDataUpdateThreshold,
    };
  }
  return { updatedAllocationForExistingCrossed: false };
};

/**
 * @description both creating and updating Allocation Resource are performed in this function
 * @param {Array<Object>} updatedResource => contains both new records and existing records which
 * are updated/added by user.
 * @returns {Object<Object>} indicating validation pass case along with index value if failed
 *  else return success case with added data.
 */
const updateAllocationResourceService = async (updatedResource) => {
  // saving emp_ids to fetch their records which are related to them for validation in succeeding steps
  const employeeIdsArray = [...new Set(updatedResource.map((ele) => ele.resource_emp_id))];

  const allResourceAllocationDetails =
    await promResourceAllocationRepository.getSelectedResourceAllocationDetailsDateFormatted(employeeIdsArray);

  // compare incoming data with database details. if user trying to save duplicate data,return.
  const {
    newResourceAllocationData,
    duplicateResourceAllocationData,
    resourceAllocationUpdateData,
    duplicateResourceIndexValue,
  } = compareNewAndExistingResourceAllocationData(updatedResource, allResourceAllocationDetails);

  const costPlanDataForAllMonthFromRequest = await checkCostPlanDataForAllMonthForAllData(updatedResource);

  if (duplicateResourceAllocationData.length > 0) {
    // if duplicate encountered then return error
    return {
      duplicateResourcePresent: true,
      dataInfo: { duplicateResourceAllocationData, duplicateResourceIndexValue, costPlanDataForAllMonthFromRequest },
    };
  }

  /**
   * @description divide the already existing database details and new/fresh details.then =>
   * step 1: consider the records where ra_id is coming(which means user is updating the existing record
   *         with new allocation) compare the user updated existing records and verify resource allocation
   *         threshold only for those record to see whether by replacing with new allocation for existing
   *         record the allocation wont across 1. if it crosses 1 then throw error indicating the updated
   *         existing records data itself crosses 1 before even comparing new record data.
   * step 2: if updating existing records success,then take the fresh records and verify Resource Allocation
   *         threshold,by comparing with database allocation(updated [which means user can send existing data
   *         by modifying it along with new data, where existing data threshold must be calculated in first step]).
   * Note  : All the new Records allocation will be compared with database(updated) allocation
   */

  // step 1: validate existing data modification if user modified/updated.
  if (resourceAllocationUpdateData.length > 0) {
    const existingDataThreshold = calculateThresholdForUpdatingOfExistingDetails(
      resourceAllocationUpdateData,
      allResourceAllocationDetails,
    );

    // if modification of existing data validation threshold is not passed then return error in frontEnd.
    if (existingDataThreshold.updatedAllocationForExistingCrossed) {
      return {
        duplicateResourceIndexValue: existingDataThreshold.verifyExistingDataUpdateThreshold,
        thresholdCrossForUpdatingExistingData: existingDataThreshold.updatedAllocationForExistingCrossed,
      };
    }
  }

  /** step 2:
   * a) As existing data updating validation is passed. then consider updated existing data(i.e @var resourceAllocationUpdateData)
   *  and replace(i.e merging in memory not to database) the records with @var allResourceAllocationDetails data.so this fully updated
   *  database details will be used to validate new records.
   */
  const updatedDatabaseWithLatestAllocation = allResourceAllocationDetails.map((ele) => {
    return resourceAllocationUpdateData.find((elementPresent) => elementPresent.ra_id === ele.ra_id) || ele;
  });

  // b) use the fully updated database allocation details to validate new/fresh records from frontEnd
  const verifyAllResourceAllocationThreshold = promResourceAllocationHelper.verifyResourceAllocationThreshold(
    updatedDatabaseWithLatestAllocation,
    newResourceAllocationData,
  );

  // if threshold validation of fresh is not passed.then return error to frontend.
  if (verifyAllResourceAllocationThreshold.exceededAllocationIndexArray.length > 0) {
    return {
      thresholdExceeded: true,
      allocationDetails: verifyAllResourceAllocationThreshold,
    };
  }

  // update the existing records if it elements exists in resourceAllocationUpdateData & if existing data threshold also under 1
  // if all condition passed for updated existing records, save to database and return success
  const updateResourceAllocationToDatabase = await promResourceAllocationRepository.updateAllocationData(
    resourceAllocationUpdateData,
  );

  // if all condition passed for updated existing records, save to database and return success
  const newResourceAllocationToDatabase = await promResourceAllocationRepository.addResourceAllocationDetailsToDB(
    newResourceAllocationData,
  );

  return {
    duplicateResourcePresent: false,
    dataInfo: {
      newResourceAllocationToDatabase,
      updateResourceAllocationToDatabase,
      costPlanDataForAllMonthFromRequest,
    },
  };
};

const getEmployeeProjectCodes = async (employeeIds) => {
  const getEmployeeProjectUnderGroup = await promResourceAllocationRepository.getEmployeeGroupAndItsProjectCodesFromDb(
    employeeIds,
  );
  return getEmployeeProjectUnderGroup;
};

const addProjectResourcePlanAndCostToDatabase = async (projectDetails) => {
  const arrayOfProjectResourcePlanData = projectDetails.map(
    ({ project_code, month_year, planned_resource, planned_cost }) => {
      return {
        // id is necessary as No unique key column present in resource_cost_plan table to
        // update existing data if modification required
        id: `${project_code}_${month_year}`, // primary key
        project_code,
        month_year,
        planned_resource,
        planned_cost,
      };
    },
  );

  // add the resource cost plan data to Database
  const addProjectResourceToDb = await promResourceAllocationRepository.addProjectResourcePlan(
    arrayOfProjectResourcePlanData,
  );
  return addProjectResourceToDb;
};

const updateProjectResourcePlanAndCostToDatabase = async (projectDetails) => {
  const AllEngineeringCost = await promEngineeringCostRepository.fetchAllEnggCost();
  // get Engineering cost and calculate planned cost and save to Data

  const calculatedPlannedCost = (monthYear, plannedResource) => {
    const monthYearData = AllEngineeringCost.find(
      ({ average_engg_date: averageEnggDate }) => averageEnggDate === monthYear,
    );
    // throw Error that No monthYear(Ex: 04-2022) data is Present and catch error in controller
    if (!monthYearData) throw new Error(`NoAverageCost_${monthYear}`);
    // formula = plannedResource * monthYearData.average_engg_cost
    return parseFloat(plannedResource) * monthYearData.average_engg_cost;
  };

  const arrayOfProjectResourcePlanData = projectDetails.map(({ id, project_code, month_year, planned_resource }) => {
    return {
      id,
      project_code,
      month_year,
      planned_resource,
      planned_cost: calculatedPlannedCost(month_year, planned_resource),
    };
  });

  // add the resource cost plan data to Database
  const addProjectResourceToDb = await promResourceAllocationRepository.updateProjectResourcePlan(
    arrayOfProjectResourcePlanData,
  );
  return addProjectResourceToDb;
};

const getAllProjectResourcePlanAndCostFromDb = async (filter) => {
  // if user Require 'ALL' project Resource cost data
  if (filter.project_code === 'All') {
    const resourcePlanDetailsWithNoFilter = await promResourceAllocationRepository.getAllProjectResourcePlan();
    return resourcePlanDetailsWithNoFilter;
  }

  // if user Require individual project data
  const { project_code: projectCode } = filter;
  const resourcePlanDetails = await promResourceAllocationRepository.getProjectPlannedResourceAndPlannedCostByProjectId(
    projectCode,
  );
  return resourcePlanDetails;
};

const getMonthBeforeAndAfterTheGivenMonthInShortForm = (date) => {
  // (2022-03-04) => Mar-22
  const givenDateToMonthYearShortForm = getShortMonthAbbreviation(date);

  // month before the Given date,Ex: Feb-22 if Mar-22 is Given Date
  const oneMonthBeforeTheGivenDate = getShortMonthAbbreviation(dayjs(date).subtract(1, 'month'));

  // month after the Given date,Ex: Apr-22 if Mar-22 is Given Date
  const oneMonthAfterTheGivenDate = getShortMonthAbbreviation(dayjs(date).add(1, 'month'));

  return {
    // Ex:currentPreviousAndNextMonthShortName = [Apr-22,Mar-22,May-22]
    currentPreviousAndNextMonthsShortName: [
      givenDateToMonthYearShortForm,
      oneMonthBeforeTheGivenDate,
      oneMonthAfterTheGivenDate,
    ],
    givenDateToMonthYearShortForm,
    oneMonthBeforeTheGivenDate,
    oneMonthAfterTheGivenDate,
  };
};

// discard employee Who are fully allocated(1) for the Month, And Get only Employee who are partial allocated
// or not allocated At All
const removeEmployeeWithFullAllocation = (employeeAllocationForMonth) => {
  // if employee is allocated, get Max of all week allocation and Set as Month allocation of the Employee
  const highestAllocationForEachEmployee = employeeAllocationForMonth.map(({ employeeMonthAllocation, employeeId }) => {
    return {
      employeeId,
      highestAllocationForMonth: parseFloat(Math.max(...Object.values(employeeMonthAllocation)).toFixed(2)),
    };
  });

  // if employee is Fully Allocated (i.e 1),filter out ,as we need only partial and unallocated Employee
  const partialOrUnallocatedEmployees = highestAllocationForEachEmployee.filter(
    ({ highestAllocationForMonth }) => highestAllocationForMonth !== 1,
  );

  return partialOrUnallocatedEmployees;
};

const resourceAllocationDataForParticularMonths = (allocationDataArray) => {
  // monthWithWeek will save the Weekly resource Allocation of Employee, it will be final returned value.
  const monthWithWeek = {};

  // cron job will run on every 25th of month, and it will check the Next month Allocation
  // so we are using nextMonthStartDate and nextMonthEndDate
  const { nextMonthStartDate } = getTodayAndNextMonthStartAndEndDates();

  // converting the next Month and End date to ShortForm ,because this is reused functionality-
  // in reusable function which are developed using short form(Ex:May-22)
  const { currentPreviousAndNextMonthsShortName, givenDateToMonthYearShortForm } =
    getMonthBeforeAndAfterTheGivenMonthInShortForm(nextMonthStartDate);

  /**
   * @borrows whole functionality from @function calculateWeekWiseAllocationGroupedByMonthYear()
   * from promReportsService.js expect @function {@link createMonthsWithItsWeeks} as here it is
   * optimized to only calculate max of three months allocation
   */
  const calculateWeekWiseAllocationGroupedByMonth = (startDate, endDate, allocation) => {
    const createMonthsWithItsWeeks = (date, ResourceAllocation) => {
      const shortMonthWithYear = getShortMonthAbbreviation(date); // Arp-22

      // here we are considering currentMonth(usually next month allocation we are checking), previous,Next month
      // in currentPreviousAndNextMonthsShortName Array (Ex: [Apr-22,Mar-22,May-22]) and only allow this within this
      // month range for optimized Calculation and to avoid unnecessary month data calculation
      // Ex:[Apr-22,Mar-22,May-22].includes(Apr-22),Then all to initialize the Month.
      if (!currentPreviousAndNextMonthsShortName.includes(shortMonthWithYear)) {
        return monthWithWeek;
      }

      if (
        !Object.keys(monthWithWeek).includes(shortMonthWithYear) &&
        currentPreviousAndNextMonthsShortName.includes(shortMonthWithYear)
      ) {
        monthWithWeek[shortMonthWithYear] = createWeeksForTheMonthWithZeroAllocation(date); // create month's week with empty values
      }

      const weekIndex = checkWeekSharedBetweenTwoDifferentYear(date); // week index Example:week-10

      monthWithWeek[shortMonthWithYear][`WEEK-${weekIndex}`] += parseFloat(ResourceAllocation);
      return monthWithWeek;
    };

    const weekAllocationForProject = (date, resAllocation) => {
      // this function fills the Empty month object(Ex: {} ) with month-Week Data (Ex:{Jan-22:{week-1:{}}})
      createMonthsWithItsWeeks(date, resAllocation); // allocated resource to Respective weeks in a Month
    };

    /** @borrows whole functionality from @function calculateWeekWiseAllocationGroupedByMonthYear() */
    // main Logic for week calculation Starts From Here ----
    const endDateLocalTime = endDate;
    let incrementalDate = startDate; // Ex: 2022-03-21

    if (!dayjs(incrementalDate).isSameOrAfter(endDateLocalTime, 'date')) {
      while (dayjs(incrementalDate).isAfter(endDateLocalTime, 'date') === false) {
        const lastDateOfTheWeek = endOfTheWeekDate(incrementalDate); // 2022-03-28T00:00:00.000Z
        if (
          dayjs(lastDateOfTheWeek).isSameOrAfter(endDateLocalTime, 'date') === false &&
          monthOfDate(incrementalDate) === monthOfDate(lastDateOfTheWeek)
        ) {
          // week is in Same Month and Less than End Date, so add allocation to that Week of the Month
          weekAllocationForProject(incrementalDate, allocation);
          incrementalDate = addOneDay(lastDateOfTheWeek);
        } else if (
          dayjs(lastDateOfTheWeek).isSameOrAfter(endDateLocalTime, 'date') === false &&
          (monthOfDate(incrementalDate) === monthOfDate(lastDateOfTheWeek)) === false
        ) {
          // example: incremental:2022-11-28  lastDateOfTheWeek(2022-12-04) >= endDateLocalTime(2022-12-01)
          // week is shared by Two Months
          // add allocation to last week of the month And 1st week of Next Month
          weekAllocationForProject(incrementalDate, allocation);
          weekAllocationForProject(lastDateOfTheWeek, allocation);
          incrementalDate = addOneDay(lastDateOfTheWeek);
        } else if (
          dayjs(lastDateOfTheWeek).isSameOrAfter(endDateLocalTime, 'date') === true &&
          (monthOfDate(incrementalDate) === monthOfDate(lastDateOfTheWeek)) === false
        ) {
          // where week start date is in one month and week end date in another month,(consider example of last week
          // of Nov-22 and first week of Dec - 22), this condition implies where endDate is in middle of week.

          // but week is shared by Two Months so add allocation to last week of the month And 1st week of Next Month

          // if endDate is in middle of the week && month of (start_date) === month of (end_date)
          // then only add allocation to last week of the month
          if ((monthOfDate(incrementalDate) === monthOfDate(endDateLocalTime)) === true) {
            weekAllocationForProject(incrementalDate, allocation);
          } else {
            // if endDate is in middle of the week && month of (start_date) !== month of (end_date), which means
            // start of the week is in one month and end of the week is in another month.
            // then add allocation to last week of the (start_date) month and first week of end_date month
            weekAllocationForProject(incrementalDate, allocation);
            weekAllocationForProject(endDateLocalTime, allocation);
          }
          incrementalDate = addOneDay(lastDateOfTheWeek);
        } else if (dayjs(lastDateOfTheWeek).isSameOrAfter(endDateLocalTime, 'date') === true) {
          // add allocation to last Date of the Week as lastDateOfTheWeek is Crossed the EndDateLocalTme
          weekAllocationForProject(endDateLocalTime, allocation);
          incrementalDate = addOneDay(lastDateOfTheWeek);
        }
        // continue;
      }
    }
  };

  // Main function logic start Here, for each row in database calculate resource Allocation for each week in a month
  allocationDataArray.forEach(({ start_date: startDate, end_date: endDate, allocation }) => {
    calculateWeekWiseAllocationGroupedByMonth(startDate, endDate, allocation);
  });
  // return only the month required by cron job out of all month data (Ex:only Jun-22)
  return monthWithWeek[givenDateToMonthYearShortForm];
};

const calculateAndGetPartialOrUnallocatedEmployeeForAMonth = (resourceGroupedByResourceEmpId) => {
  const getEmployeeAllocationInfoForGivenMonth = (resourceGroupedByEmployeeId) => {
    const employeeIdsFromObject = Object.keys(resourceGroupedByEmployeeId);

    // data is grouped by Employee, for Each Employee Id calculate Allocation for the particular month
    const allocation = employeeIdsFromObject.map((ele) => {
      // resourceDataInForParticularMonths is where week wise allocation calculation is performed
      const employeeMonthAllocation = resourceAllocationDataForParticularMonths(resourceGroupedByResourceEmpId[ele]);
      return { employeeMonthAllocation, employeeId: ele };
    });
    return allocation;
  };

  const employeeAllocationForMonth = getEmployeeAllocationInfoForGivenMonth(resourceGroupedByResourceEmpId);

  const partialOrUnallocatedEmployees = removeEmployeeWithFullAllocation(employeeAllocationForMonth);

  return partialOrUnallocatedEmployees;
};

const compareEmployeeDataAndResourceAllocationEmployeeData = (allEmployeeDetails, allResourceAllocationData) => {
  // creating a set of employee id from resource allocation employee id for optimized operation
  const resourceAllocatedEmployeeSet = [...new Set(allResourceAllocationData.map((ele) => ele.resource_emp_id))];

  const notAllocatedEmployeeDetails = allEmployeeDetails.reduce((notAllocatedEmployee, employeeId) => {
    // checking whether employee is allocated at least once in resource_allocation table

    if (!resourceAllocatedEmployeeSet.includes(employeeId)) {
      // returns Ex: [{employeeId:001,highestAllocationForMonth:0},{},{},.....]
      // the creating the object here will reduce the one loop while combining with resourceAllocation Employees
      // -unallocated data
      return [...notAllocatedEmployee, { employeeId, highestAllocationForMonth: 0 }];
    }
    return [...notAllocatedEmployee];
  }, []);

  // @returned employees are not allocated at all(either in next month or not at all in resource allocation table).
  return notAllocatedEmployeeDetails;
};

const checkWhetherEmployeeIsFullyAllocated = async () => {
  // fetch all Employee Details except [status:Inactive and Designation:president or vice president]
  const allEmployeeDetails = await fetchAllEmpIdsInArrayExpectMainPeople();

  const { nextMonthStartDate, nextMonthEndDate } = getTodayAndNextMonthStartAndEndDates();

  /**
   only fetch resource_allocation details which overlap with next month start and next end
   because cron job is checking whether employee is allocated to next or not.
   plus only fetching next month start and end date rows will give us necessary details to process
   otherwise 3/4/5 years before data will also fetched which is unnecessary cpu cycle wastage.
   * */
  const allResourceData = await promResourceAllocationRepository.getAllResourceDetailsForCronJob({
    nextMonthStartDate,
    nextMonthEndDate,
  });

  /**
   * @description
   * compare and check whether Employee from employee Table are allocated(at least once) in Resource Allocation table.
   * if not then new employee are added to database and not given allocated(not given work) to any project for
   * next month.so consider these employee as unallocated employee and add these to @var unAllocatedEmployees
   * and @var partialOrUnallocatedEmployees object at Last step before returning
   */
  const notAllocatedEmployees = compareEmployeeDataAndResourceAllocationEmployeeData(
    allEmployeeDetails,
    allResourceData,
  );

  /**
   * grouping based on resource_emp_id for allResourceData(resource allocation table).
   * these data(@var resourceGroupedByResourceEmpId) are used determine whether the already allocated employee
   * are also allocated to next month
   */
  const resourceGroupedByResourceEmpId = groupByEmployeeId(allResourceData);

  /**
   * only calculating resource allocation for the employee from resource Allocation table(@var allResourceData).
   * The unallocated employee (@var notAllocatedEmployees) from Avin_employee_details table which is result of
   * comparing with resource allocation table where employee is not allocated at all for next month.
   */
  const partialOrUnallocatedEmployees =
    calculateAndGetPartialOrUnallocatedEmployeeForAMonth(resourceGroupedByResourceEmpId);

  const totalPartialOrUnAllocatedEmployees = partialOrUnallocatedEmployees.concat(notAllocatedEmployees);

  /**
   * @var partialOrUnallocatedEmployees is used by cron job on 25 to which check both partial and
   * unAllocated employee.
   * @var unAllocatedEmployees will be used by cron job on 27 to move all unallocated employees to Buffer
   * project
   */
  return {
    partialOrUnallocatedEmployees: totalPartialOrUnAllocatedEmployees,
    unAllocatedEmployees: notAllocatedEmployees,
  };
};

const checkProjectActualAllocationCount = async () => {
  const { currentMonthStartDate, currentMonthEndDate } = getTodayAndNextMonthStartAndEndDates();
  const currentMonthYear = convertToNumericMonthYear(currentMonthStartDate);
  const allProjectData = await promResourceAllocationRepository.getProjectPlannedActualResourceCount(
    {
      currentMonthStartDate,
      currentMonthEndDate,
    },
    currentMonthYear,
  );
  const projectResCount = [];
  allProjectData.flatMap((actualCount) => {
    actualCount.projectGroupFk.flatMap((plannedCount) => {
      const actualAllocation = plannedCount.promAvinResourceAllocation.reduce(
        (total, obj) => parseFloat(obj.allocation) + parseFloat(total),
        0,
      );
      const employeeIds = [
        ...new Set(
          plannedCount.promAvinResourceAllocation.map(({ resource_emp_id: employeeId }) => employeeId.toString()),
        ),
      ];
      if (
        (employeeIds.length && actualAllocation) < plannedCount.promAvinProjectResourceAndCostPlan[0].planned_resou ||
        (employeeIds.length && actualAllocation) > plannedCount.promAvinProjectResourceAndCostPlan[0].planned_resou
      ) {
        projectResCount.push({
          bu_name: actualCount.bu_name,
          project_code: plannedCount.project_code,
          project_name: plannedCount.project_name,
          project_manager: plannedCount.project_manager,
          project_manager_name: plannedCount.promAvinEmployeeDetails.resource_name,
          project_manager_email: plannedCount.promAvinEmployeeDetails.email_id,
          plannedResourceCount: plannedCount.promAvinProjectResourceAndCostPlan[0].planned_resou,
          actualResourceCount: employeeIds.length.toFixed(2),
          actualAllocation: actualAllocation.toFixed(2),
        });
      }
    });
  });
  return projectResCount;
};

/**
 * @param {Array<Object>} employeeAllocatedData
 * @example [ { employeeId: '001', highestAllocationForMonth: 0.7 },
              { employeeId: '002', highestAllocationForMonth: 0 } ]
 * @param {Array<Object>} managerWithTheirEmployeeAndTheirManagerDetails
 * @returns
 */
const createManagerInfoWithTheirEmployeeAndManagerDetails = (
  employeeAllocatedData,
  managerWithTheirEmployeeAndTheirManagerDetails,
) => {
  /**
   * {@link managerWithTheirEmployeeAndTheirManagerDetails} contains employee details and their reporting
   * manager and reporting_manager's manager details(which is 1 level).
   * so this should be optimized to below structure :
   * @example :[ { managerDetails,managersEmployees:[], managersManagerInfo() }, {},....... ].

   */
  const [managerWithEmpAndTheirManagerDetails] = managerWithTheirEmployeeAndTheirManagerDetails.reduce(
    ([managerWihManagersAndEmployeeInfo, managerEmployeeIdSet], currentEmployeeDetails) => {
      /**
       * {@link managerEmployeeIdSet} is used to store which manager Details is already saved in managerWihManagersAndEmployeeInfo
       */

      const {
        email_id,
        resource_name,
        reporting_manager,
        employeeId,
        reportingManagerDetails: { reportingManagerDetails: managersManagerInfo, ...managerDetails },
      } = currentEmployeeDetails;
      const { highestAllocationForMonth } = employeeAllocatedData.find((ele) => ele.employeeId === employeeId);

      // if manager details already saved in database, then only add manager employee details to array
      if (!managerEmployeeIdSet.has(reporting_manager)) {
        managerEmployeeIdSet.add(reporting_manager);

        managerWihManagersAndEmployeeInfo.push({
          managersEmployees: [{ employeeId, email_id, resource_name, reporting_manager, highestAllocationForMonth }],
          email: managerDetails.email_id,
          managerId: managerDetails.resource_emp_id,
          managersManagerInfo,
        });
        return [managerWihManagersAndEmployeeInfo, managerEmployeeIdSet];
      }

      // else find index of manager details in array and append their employee details into managesEmployees Array
      const indexOfVariable = managerWihManagersAndEmployeeInfo.findIndex(
        (ele) => ele.managerId === managerDetails.resource_emp_id,
      );

      managerWihManagersAndEmployeeInfo[indexOfVariable].managersEmployees.push({
        employeeId,
        email_id,
        resource_name,
        reporting_manager,
        highestAllocationForMonth,
      });
      return [managerWihManagersAndEmployeeInfo, managerEmployeeIdSet];
    },
    [[], new Set()],
  );

  /**
   * @returns {Array<Object>}
   * [ { managersEmployees: [ [Object], [Object], [Object], [Object], [Object] ],
         email: 'employee1@email.com',
         managerId: '001',
         managersManagerInfo: { email_id: 'employee4@email.com',
                                 resource_name: 'employeeName4',
                                 resource_emp_id: '004' }
                                },
       { managersEmployees: [ [Object], [Object] ],
         email: 'employee2@email.com',
         managerId: '002',
         managersManagerInfo: { email_id: 'employee3@email.com',
                                resource_name: 'employeeName3',
                                resource_emp_id: '003' }
                              }
      ]
   */
  return managerWithEmpAndTheirManagerDetails;
};

const getEmployeeManagerAndTheirManagerDetails = async (employeeWithPartialOrNoAllocation) => {
  // extract employee ids
  const employeeIds = employeeWithPartialOrNoAllocation.map(({ employeeId }) => employeeId);
  // get employee manager and their manager info using employee ids
  const allEmployeeDetailsWithManager =
    await promResourceAllocationRepository.getEmployeeManagerWithTheirManagerDetails(employeeIds);
  return allEmployeeDetailsWithManager;
};

const getEmployeeGroupHeads = async (employeeWithPartialOrNoAllocation) => {
  // extract employee ids
  const employeeIds = employeeWithPartialOrNoAllocation.map(({ employeeId }) => employeeId);
  // get employee manager and their manager info using employee ids
  const allEmployeeDetailsWithGroupHeads =
    await promResourceAllocationRepository.getEmployeeManagerWithTheirGroupHeadsDetails(employeeIds);

  return allEmployeeDetailsWithGroupHeads;
};

const sendMailToManagerAndManagersManager = async (managerWithTheirEmployeeAndTheirManagerDetails) => {
  const mailSentToManagers = await Promise.all(
    managerWithTheirEmployeeAndTheirManagerDetails.map(
      async ({ managersEmployees, managersManagerInfo: { email_id: theirManagerEmailId }, email }) => {
        // const resourceData = await resourceMgmtRepo.fetchAllResources();
        // const managerName = resourceData.find(({ resource_emp_id: reporting_manager }) => reporting_manager === reporting_manager);
        const mailingHtmlData = managerMailingDataForPartialOrUnallocatedData(managersEmployees, 'RM Tool');
        const mailSent = await sendMail(
          mailingHtmlData.subject,
          mailingHtmlData.text,
          mailingHtmlData.managerHtmlData,
          email,
          undefined, // sending undefined as there are no file to attach
          theirManagerEmailId,
        );
        return mailSent;
      },
    ),
  );
  return mailSentToManagers;
};

const sendMailToManagerAndAllGroupHeads = async (plannedActualResourceDetails) => {

  const groupHeadMailsCC = [...new Set(plannedActualResourceDetails.groupHeadData.map((ele) => ele.email_id))];

  const mailSentToManagers = await Promise.all(

    plannedActualResourceDetails.groupHeadData.map(async (groupInfo) => {

      // async ({ managersEmployees, managersManagerInfo: { email_id: theirManagerEmailId }, email }) => {

      const resourceMailData = plannedActualResourceDetails.plannedActualResource.filter(

        (ele) => ele.bu_name === groupInfo.bu_name,

      );

      // const projectManagerMailsTo = resourceMailData.map((ele) => ele.project_manager_email);

      const projectManagerMailsTo = [...new Set(resourceMailData.map((ele) => ele.project_manager_email.toString()))];

      if (projectManagerMailsTo.length > 0) {

        const mailingHtmlData = managerMailingDataForPlannedActualResourceCount(resourceMailData, 'RM Tool');

        const managerList = groupHeadMailsCC.filter((element) => projectManagerMailsTo.includes(element));

        let duplicateEmail = groupHeadMailsCC;

        if (managerList.length > 0) {

          duplicateEmail = groupHeadMailsCC.filter((mail) => !projectManagerMailsTo.includes(mail));

          duplicateEmail = duplicateEmail.length > 0 ? duplicateEmail : undefined;

        }

        const mailSent = await sendMail(

          mailingHtmlData.subject,

          mailingHtmlData.text,

          mailingHtmlData.managerHtmlData,

          projectManagerMailsTo,

          undefined, // sending undefined as there are no file to attach

          duplicateEmail,

        );
        return mailSent;
      }
      return false;
    }),

  );

  return mailSentToManagers;

};

const checkEmployeeAllocationAndGetManagersDetails = async () => {
  // get partial allocated employees from avin_resource_allocation table
  const { partialOrUnallocatedEmployees } = await checkWhetherEmployeeIsFullyAllocated();

  // using employee ids get employee manager and their manager info
  const allEmployeeDetailsWithManagerAndTheirManagerDetails = await getEmployeeManagerAndTheirManagerDetails(
    partialOrUnallocatedEmployees,
  );

  // structure and merger manager details with employee details for sending minimal Number of Mail
  const managerWithTheirEmployeeAndTheirManagerDetails = createManagerInfoWithTheirEmployeeAndManagerDetails(
    partialOrUnallocatedEmployees,
    allEmployeeDetailsWithManagerAndTheirManagerDetails,
  );

  return managerWithTheirEmployeeAndTheirManagerDetails;
};

const checkProjectPlannedActualResourceDetails = async () => {
  const plannedActualResource = await checkProjectActualAllocationCount();
  const groupHeadData = await promResourceAllocationRepository.getGroupHeadInfo();
  return { plannedActualResource, groupHeadData };
};

const checkUnAllocatedEmployeeAndGetTheirManagersDetails = async () => {
  const { unAllocatedEmployees } = await checkWhetherEmployeeIsFullyAllocated();

  const allEmployeeDetailsWithManagerAndTheirManagerDetails = await getEmployeeManagerAndTheirManagerDetails(
    unAllocatedEmployees,
  );

  const managerWithTheirEmployeeAndTheirManagerDetails = createManagerInfoWithTheirEmployeeAndManagerDetails(
    unAllocatedEmployees,
    allEmployeeDetailsWithManagerAndTheirManagerDetails,
  );

  return managerWithTheirEmployeeAndTheirManagerDetails;
};

const moveUnAllocatedEmployeesToBufferProject = async (employeeAllocationWithManagerDetails) => {
  const { todayLocalDate, nextMonthTwentyForth } = getTodayAndNextMonthTwentyForthDates();

  /**
  {@link employeeIdsFromDifferentManagers} contains list of employee Ids map array,Then get employeeIds from this array of object.
   this employeeId will be used to get their group buffer(project) information from database.
   */
  const employeeIdsFromDifferentManagers = employeeAllocationWithManagerDetails.flatMap((managerEmployeeArray) => {
    return managerEmployeeArray.managersEmployees.map((ele) => ele.employeeId);
  });

  const employeeIdsFromDifferentManagersSet = [...new Set(employeeIdsFromDifferentManagers)]; // remove duplicate id if any.

  // get buffer project for the employee's group
  const bufferProjectFromDatabase = await getBufferProjectFromDatabase(employeeIdsFromDifferentManagersSet);

  const generateAllocationRowsToInsert = bufferProjectFromDatabase.map(
    ({
      resource_emp_id: resourceEmpId,
      reporting_manager: managerId,
      employeeGroupName: { projectGroupFk: bufferProjectCode },
    }) => {
      return {
        resource_emp_id: resourceEmpId.toString().trim(),
        project_code: bufferProjectCode.project_code,
        supervisor: managerId,
        start_date: todayLocalDate,
        billable_resource: 0,
        end_date: nextMonthTwentyForth,
        allocation: 1,
        resource_status_in_project: 'Buffer',
      };
    },
  );

  /**
   * Main process of moving employee to resource allocation with Buffer Project
   * add employee to database ,allocated to Buffer project with start date as 28th and end date as Next Month 24th
   */
  const addedResource = await promResourceAllocationRepository.addResourceToBufferProjectAndUpdateStatus(
    generateAllocationRowsToInsert,
  );
  return addedResource;
};

const sendMailForMovingEmployeeToBufferProject = async (
  employeeAllocationWithManagerDetails,
  employeeMovedToBufferProject,
) => {
  const mailSentToManagers = await Promise.all(
    employeeAllocationWithManagerDetails.map(
      async ({ managersEmployees, managersManagerInfo: { email_id: theirManagerEmailId }, email }) => {
        const mailingHtmlData = managerMailingDataUnallocatedData(managersEmployees, 'RM Tool');
        const mailSent = await sendMail(
          mailingHtmlData.subject,
          mailingHtmlData.text,
          mailingHtmlData.managerHtmlData,
          email,
          undefined, // sending undefined as there are no file to attach
          theirManagerEmailId,
        );
        return mailSent;
      },
    ),
  );

  logger.info(employeeMovedToBufferProject.length, 'employee moved to Buffer project');
  logger.info(mailSentToManagers.length, "mail are sent to manager and manages's manager");

  return { employeeMovedToBuffer: employeeMovedToBufferProject.length, mailSentToManagers: mailSentToManagers.length };
};

const cronJobGetPartialOrUnAllocatedEmployee = async () => {
  // get all employee who are unallocated or partial allocated for next month
  const employeeAllocationWithManagerDetails = await checkEmployeeAllocationAndGetManagersDetails();

  // send mail to manager and manager's manager
  const sendMailsToManagers = await sendMailToManagerAndManagersManager(employeeAllocationWithManagerDetails);
  // check all are true inside array ,if all element are true Then all emails are sent
  logger.info(sendMailsToManagers.length, ' mail are sent to managers');
  return { sendMailsToManagers };
};

const cronJobGetPlannedActualResourceCount = async () => {
  const plannedActualResourceDetails = await checkProjectPlannedActualResourceDetails();
  const sendMailsToManagers = await sendMailToManagerAndAllGroupHeads(plannedActualResourceDetails);

  // send mail to manager and Group head's
  // check all are true inside array ,if all element are true Then all emails are sent
  logger.info(sendMailsToManagers.length, ' mail are sent to managers');
  return { sendMailsToManagers };
};

const checkAllocationAndMoveToBenchIfNotAllocated = async () => {
  // get employee details who are unallocated for next month
  const employeeAllocationWithManagerDetails = await checkUnAllocatedEmployeeAndGetTheirManagersDetails();

  // move the employee to buffer project in avin_resource_allocation
  const employeeMovedToBufferProject = await moveUnAllocatedEmployeesToBufferProject(
    employeeAllocationWithManagerDetails,
  );
  const sendMailToManager = await sendMailForMovingEmployeeToBufferProject(
    employeeAllocationWithManagerDetails,
    employeeMovedToBufferProject,
  );

  return sendMailToManager;
};

const sendBufferListToManagerAndTheirManager = async (employeeDetailsWithManagerDetails) => {
  const mailSentToManagers = await Promise.all(
    employeeDetailsWithManagerDetails.map(
      async ({ managersEmployees, managersManagerInfo: { email_id: theirManagerEmailId }, email }) => {
        const mailingHtmlData = managerMailingDataForBufferEmployeeList(managersEmployees, 'RM Tool');
        const mailSent = await sendMail(
          mailingHtmlData.subject,
          mailingHtmlData.text,
          mailingHtmlData.managerHtmlData,
          email,
          undefined, // sending undefined as there are no file to attach
          theirManagerEmailId,
        );
        return mailSent;
      },
    ),
  );
  return mailSentToManagers;
};

const getBufferProjectEmployees = async () => {
  // get all employee who are in buffer project in avin_resource_allocation table
  const bufferEmployeeDb = await promResourceAllocationRepository.getBufferProjectEmployees();

  // extract their employee ids
  const employeeIdsFromDetails = bufferEmployeeDb.flatMap(({ promAvinResourceAllocation: allocationArray }) => {
    return allocationArray.map((ele) => ({
      employeeId: ele.resource_emp_id,
    }));
  });

  // using employee ids get employee manager and their manager info
  const allEmployeeDetailsWithManagerAndTheirManagerDetails = await getEmployeeManagerAndTheirManagerDetails(
    employeeIdsFromDetails,
  );

  // structure and merger manager details with employee details for sending minimal Number of Mail
  const managerWithTheirEmployeeAndTheirManagerDetails = createManagerInfoWithTheirEmployeeAndManagerDetails(
    employeeIdsFromDetails,
    allEmployeeDetailsWithManagerAndTheirManagerDetails,
  );
  // send mail to manager and manager's manager
  const sentMailToManagers = await sendBufferListToManagerAndTheirManager(
    managerWithTheirEmployeeAndTheirManagerDetails,
  );

  logger.info(sentMailToManagers);
  return { sentMailToManagers, employeeIdsFromDetails, managerWithTheirEmployeeAndTheirManagerDetails };
};

const allGroupsPrtiallyAllocatedResourceData = async (managerWithTheirEmployeeAndTheirManagerDetails) => {
  const allResourceInfo = await fetchAllResources()
  const allResourcePartialData = []
  managerWithTheirEmployeeAndTheirManagerDetails.map((ele) => {
    ele.managersEmployees.map((ele1) => {
      const grpName = allResourceInfo.find((ele) => ele.resource_emp_id === ele1.employeeId);
      const managerName = allResourceInfo.find((ele) => ele.resource_emp_id === ele1.reporting_manager);
      allResourcePartialData.push({
        employeeId: ele1.employeeId,
        resourceName: ele1.resource_name,
        groupName: grpName.bu_name,
        reportingManager: `${ele1.reporting_manager} - ${managerName.resource_name}`,
        highestAllocationForMonth: 1 - ele1.highestAllocationForMonth
      })

    })
  })
  return allResourcePartialData
}

const cronJobGetPartialAllocatedEmployee = async () => {
  // get all employee who are unallocated or partial allocated for next month
  const employeeAllocationWithManagerDetails = await checkEmployeeAllocationAndGetManagersDetails123();
  const employeeMovedToBufferProject = await movePartiallyAllocatedEmployeesToBufferProject(
    employeeAllocationWithManagerDetails,
  );
  // const groupHeadData = await promResourceAllocationRepository.getGroupHeadInfo();
  const sendMailsToManagers = await sendMailToManagerAndAllGroupHeadsAllocationEOM(
    employeeAllocationWithManagerDetails
  );
  // // send mail to manager and manager's manager
  // const sendMailsToManagers = await sendMailToManagerAndManagersManager123(employeeAllocationWithManagerDetails, employeeMovedToBufferProject);

  // check all are true inside array ,if all element are true Then all emails are sent
  logger.info(sendMailsToManagers.length, ' mails are sent to managers');
  return { sendMailsToManagers };
};

const cronJobGetPartialAllocatedEmployeeToAllGroupHeads = async () => {
  // get all employee who are unallocated or partial allocated for next month
  const employeeAllocationWithManagerDetails = await checkEmployeeAllocationAndGetManagersDetails123();
  const allGroupsPrtiallyAllocatedResourceInfo = await allGroupsPrtiallyAllocatedResourceData(employeeAllocationWithManagerDetails.managerWithTheirEmployeeAndTheirManagerDetails)
  // const groupHeadData = await promResourceAllocationRepository.getGroupHeadInfo();
  const sendMailsToGroupHeads = await sendMailToAllGroupHeadsAllocationEOM(
    allGroupsPrtiallyAllocatedResourceInfo,
    employeeAllocationWithManagerDetails.groupHeadData
  );


  // check all are true inside array ,if all element are true Then all emails are sent
  logger.info(sendMailsToManagers.length, ' mails are sent to managers');
  return { sendMailsToGroupHeads };
};


const checkEmployeeAllocationAndGetManagersDetails123 = async () => {
  // get partial allocated employees from avin_resource_allocation table
  const { partialOrUnallocatedEmployees } = await checkWhetherEmployeeIsFullyAllocated123();
  // using employee ids get employee manager and their manager info
  const allEmployeeDetailsWithManagerAndTheirManagerDetails = await getEmployeeManagerAndTheirManagerDetails(
    partialOrUnallocatedEmployees,
  );
  const groupHeadData = await promResourceAllocationRepository.getGroupHeadInfo();

  // structure and merger manager details with employee details for sending minimal Number of Mail
  const managerWithTheirEmployeeAndTheirManagerDetails =
    createManagerInfoWithTheirEmployeeAndManagerANdGroupHeadsDetails(
      partialOrUnallocatedEmployees,
      allEmployeeDetailsWithManagerAndTheirManagerDetails,
      // groupHeadData,
    );

  return { managerWithTheirEmployeeAndTheirManagerDetails, groupHeadData };
};

const movePartiallyAllocatedEmployeesToBufferProject = async (employeeAllocationWithManagerDetails) => {
  const { todayLocalDate, nextMonthTwentyForth } = getTodayAndNextMonthTwentyForthDates();

  /**
  {@link employeeIdsFromDifferentManagers} contains list of employee Ids map array,Then get employeeIds from this array of object.
   this employeeId will be used to get their group buffer(project) information from database.
   */
  const employeeIdsFromDifferentManagers = employeeAllocationWithManagerDetails.managerWithTheirEmployeeAndTheirManagerDetails.flatMap((managerEmployeeArray) => {
    return managerEmployeeArray.managersEmployees.map((ele) => ele.employeeId);
  });
  const employeeIdsFromDifferentManagersSet = [...new Set(employeeIdsFromDifferentManagers)]; // remove duplicate id if any.

  // get buffer project for the employee's group
  const bufferProjectFromDatabase = await getBufferProjectFromDatabase(employeeIdsFromDifferentManagersSet);
  const generateAllocationRowsToInsert = bufferProjectFromDatabase.map(
    ({
      resource_emp_id: resourceEmpId,
      reporting_manager: managerId,
      employeeGroupName: { projectGroupFk: bufferProjectCode },
    }) => {
      const employeeAllocation = employeeAllocationWithManagerDetails.managerWithTheirEmployeeAndTheirManagerDetails.flatMap((managerEmployeeArray) => {
        return managerEmployeeArray.managersEmployees.filter((ele) => ele.employeeId === resourceEmpId);
      });
      return {
        resource_emp_id: resourceEmpId.toString().trim(),
        project_code: bufferProjectCode.project_code,
        supervisor: managerId,
        start_date: todayLocalDate,
        billable_resource: 0,
        end_date: nextMonthTwentyForth,
        allocation: (1 - employeeAllocation[0].highestAllocationForMonth).toFixed(2),
        resource_status_in_project: 'Buffer',
      };
    },
  );
  const addedResource = await promResourceAllocationRepository.addPartiallyResourceToBufferProjectAndUpdateStatus(
    generateAllocationRowsToInsert,
  );
  return addedResource;
};

const checkWhetherEmployeeIsFullyAllocated123 = async () => {
  const allEmployeeDetails = await fetchAllEmpIdsInArrayExpectMainPeople();
  const { nextMonthStartDate, nextMonthEndDate } = getTodayAndNextMonthStartAndEndDates();
  const allResourceData = await promResourceAllocationRepository.getAllResourceDetailsForCronJob({
    nextMonthStartDate,
    nextMonthEndDate,
  });
  const notAllocatedEmployees = compareEmployeeDataAndResourceAllocationEmployeeData(
    allEmployeeDetails,
    allResourceData,
  );
  const resourceGroupedByResourceEmpId = groupByEmployeeId(allResourceData);
  const partialOrUnallocatedEmployees =
    calculateAndGetPartialOrUnallocatedEmployeeForAMonth123(resourceGroupedByResourceEmpId);
  const totalPartialOrUnAllocatedEmployees = partialOrUnallocatedEmployees;
  return {
    partialOrUnallocatedEmployees: totalPartialOrUnAllocatedEmployees,
  };
};

const calculateAndGetPartialOrUnallocatedEmployeeForAMonth123 = (resourceGroupedByResourceEmpId) => {

  const getEmployeeAllocationInfoForGivenMonth = (resourceGroupedByEmployeeId) => {
    const employeeIdsFromObject = Object.keys(resourceGroupedByEmployeeId);

    // data is grouped by Employee, for Each Employee Id calculate Allocation for the particular month
    const allocation = employeeIdsFromObject.map((ele) => {
      // resourceDataInForParticularMonths is where week wise allocation calculation is performed
      const employeeMonthAllocation = resourceAllocationDataForParticularMonths(resourceGroupedByResourceEmpId[ele]);
      return { employeeMonthAllocation, employeeId: ele };
    });
    return allocation;
  };

  const employeeAllocationForMonth = getEmployeeAllocationInfoForGivenMonth(resourceGroupedByResourceEmpId);

  const partialOrUnallocatedEmployees = removeEmployeeWithFullAllocation(employeeAllocationForMonth);

  return partialOrUnallocatedEmployees;
};

const sendMailToManagerAndManagersManager123 = async (managerWithTheirEmployeeAndTheirManagerDetails) => {
  const mailSentToManagers = await Promise.all(
    managerWithTheirEmployeeAndTheirManagerDetails.map(
      async ({ managersEmployees, managersManagerInfo: { email_id: theirManagerEmailId }, email }) => {
        const mailingHtmlData = groupHeadMailingDataForPartialData(managersEmployees, 'RM Tool');
        log;
        const mailSent = await sendMail(
          mailingHtmlData.subject,
          mailingHtmlData.text,
          mailingHtmlData.managerHtmlData,
          email,
          undefined, // sending undefined as there are no file to attach
          theirManagerEmailId,
        );
        return mailSent;
      },
    ),
  );
  return mailSentToManagers;
};

const createManagerInfoWithTheirEmployeeAndManagerANdGroupHeadsDetails = (
  employeeAllocatedData,
  managerWithTheirEmployeeAndTheirManagerDetails,
  //allEmployeeGroupHeads,
) => {
  /**
   * {@link managerWithTheirEmployeeAndTheirManagerDetails} contains employee details and their reporting
   * manager and reporting_manager's manager details(which is 1 level).
   * so this should be optimized to below structure :
   * @example :[ { managerDetails,managersEmployees:[], managersManagerInfo() }, {},....... ].

   */
  const [managerWithEmpAndTheirManagerDetails] = managerWithTheirEmployeeAndTheirManagerDetails.reduce(
    ([managerWihManagersAndEmployeeInfo, managerEmployeeIdSet], currentEmployeeDetails) => {
      /**
       * {@link managerEmployeeIdSet} is used to store which manager Details is already saved in managerWihManagersAndEmployeeInfo
       */

      const {
        email_id,
        resource_name,
        reporting_manager,
        employeeId,
        reportingManagerDetails: { reportingManagerDetails: managersManagerInfo, ...managerDetails },
      } = currentEmployeeDetails;
      const { highestAllocationForMonth } = employeeAllocatedData.find((ele) => ele.employeeId === employeeId);

      // if manager details already saved in database, then only add manager employee details to array
      if (!managerEmployeeIdSet.has(reporting_manager)) {
        managerEmployeeIdSet.add(reporting_manager);

        managerWihManagersAndEmployeeInfo.push({
          managersEmployees: [{ employeeId, email_id, resource_name, reporting_manager, highestAllocationForMonth }],
          email: managerDetails.email_id,
          managerId: managerDetails.resource_emp_id,
          managersManagerInfo,
        });
        return [managerWihManagersAndEmployeeInfo, managerEmployeeIdSet];
      }

      // else find index of manager details in array and append their employee details into managesEmployees Array
      const indexOfVariable = managerWihManagersAndEmployeeInfo.findIndex(
        (ele) => ele.managerId === managerDetails.resource_emp_id,
      );

      managerWihManagersAndEmployeeInfo[indexOfVariable].managersEmployees.push({
        employeeId,
        email_id,
        resource_name,
        reporting_manager,
        highestAllocationForMonth,
      });
      return [managerWihManagersAndEmployeeInfo, managerEmployeeIdSet];
    },
    [[], new Set()],
  );

  /**
   * @returns {Array<Object>}
   * [ { managersEmployees: [ [Object], [Object], [Object], [Object], [Object] ],
         email: 'employee1@email.com',
         managerId: '001',
         managersManagerInfo: { email_id: 'employee4@email.com',
                                 resource_name: 'employeeName4',
                                 resource_emp_id: '004' }
                                },
       { managersEmployees: [ [Object], [Object] ],
         email: 'employee2@email.com',
         managerId: '002',
         managersManagerInfo: { email_id: 'employee3@email.com',
                                resource_name: 'employeeName3',
                                resource_emp_id: '003' }
                              }
      ]
   */
  return managerWithEmpAndTheirManagerDetails;
};

const sendMailToManagerAndAllGroupHeadsAllocationEOM = async (employeeAllocationWithManagerDetails) => {
  // const groupHeadMailsCC = employeeAllocationWithManagerDetails.groupHeadData.map((ele) => ele.email_id);
  const groupHeadMailsCC = [...new Set(employeeAllocationWithManagerDetails.groupHeadData.map((ele) => ele.email_id))];
  const mailSentToManagers = await Promise.all(
    employeeAllocationWithManagerDetails.managerWithTheirEmployeeAndTheirManagerDetails.map(async (projectInfo) => {
      // async ({ managersEmployees, managersManagerInfo: { email_id: theirManagerEmailId }, email }) => {
      // const resourceMailData = employeeAllocationWithManagerDetails.allEmployeeDetailsWithManagerAndTheirManagerDetails.filter(
      //   (ele) => ele.bu_name === groupInfo.bu_name,
      // );
      // const projectManagerMailsTo = resourceMailData.map((ele) => ele.project_manager_email);
      // const reportingManagerMailsTo = [...new Set(resourceMailData.map((ele) => ele.reporting_manager_email.toString()))];
      const resourceData = await resourceMgmtRepo.fetchAllResources();
      const resourceWithManagerDetail = projectInfo.managersEmployees.map(({ reporting_manager, ...restOfEmployeeDetails }) => {
        const managerName = resourceData.find(({ resource_emp_id: managerId }) => managerId === reporting_manager);
        return { ...restOfEmployeeDetails, reporting_manager: `${reporting_manager} - ${managerName.resource_name}` };
      });
      const mailingHtmlData = managerMailingDataForPartialAllocatedResources(
        // projectInfo.managersEmployees,
        resourceWithManagerDetail,
        'RM Tool',
      );
      const headList = groupHeadMailsCC.includes(projectInfo.email)
      let duplicateEmail = [];
      if (headList === true) {
        duplicateEmail = groupHeadMailsCC.filter((mail) => mail !== projectInfo.email);
        duplicateEmail = duplicateEmail.length > 0 ? duplicateEmail : undefined
        // const index = groupHeadMailsCC.indexOf(projectInfo.email);
        //   if (index >= 0) {
        //     groupHeadMailsCC.splice(index, 1);
        //   }
      }
      const mailSent = await sendMail(
        mailingHtmlData.subject,
        mailingHtmlData.text,
        mailingHtmlData.managerHtmlData,
        projectInfo.email,
        undefined, // sending undefined as there are no file to attach
        duplicateEmail,
      );
      return mailSent;
    }),
  );
  return mailSentToManagers;
};
//reporting_manager_name: managerName.resource_name

const sendMailToAllGroupHeadsAllocationEOM = async (allGroupsPrtiallyAllocatedResourceInfo, groupHeadData) => {
  if (allGroupsPrtiallyAllocatedResourceInfo.length > 0) {
    let groupHeadMails = [...new Set(groupHeadData.map((ele) => ele.email_id))];
    const mailingHtmlData = allGroupHeadForPartialAllocatedResources(
      allGroupsPrtiallyAllocatedResourceInfo,
      'RM Tool',
    );
    const mailSent = await sendMail(
      mailingHtmlData.subject,
      mailingHtmlData.text,
      mailingHtmlData.managerHtmlData,
      groupHeadMails,
      undefined, // sending undefined as there are no file to attach
      undefined,
    );
    return mailSent;
  }
  return false;
};

module.exports = {
  getEmployeeProjectCodes,
  verifyEmployeeAndSupervisorCombination,
  deleteResourceAllocationDetailsService,
  fetchAllocationDetails,
  updateProjectResourcePlanAndCostToDatabase,
  fetchAllResourceAllocationData,
  getAllocationDetailsByProject,
  updateAllocationResourceService,
  addProjectResourcePlanAndCostToDatabase,
  getAllProjectResourcePlanAndCostFromDb,
  checkWhetherEmployeeIsFullyAllocated,
  cronJobGetPartialOrUnAllocatedEmployee,
  checkAllocationAndMoveToBenchIfNotAllocated,
  getBufferProjectEmployees,
  getAllBufferProjectFromDb,
  cronJobGetPlannedActualResourceCount,
  cronJobGetPartialAllocatedEmployee,
  sendMailToAllGroupHeadsAllocationEOM,
  cronJobGetPartialAllocatedEmployeeToAllGroupHeads
};
