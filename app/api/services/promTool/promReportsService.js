/* eslint-disable arrow-body-style */
/* eslint-disable object-curly-newline */
/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
const { Op } = require('sequelize');
const promReportsRepository = require('../../repositories/promTool/promReportsRepository');
const promResourceResourceAllocationRepo = require('../../repositories/promTool/promResourceAllocationRepository');
const claimsRepository = require('../../repositories/promTool/claimsRepository');
const projectRepo = require('../../repositories/promTool/projectDataRepository');
const promAvinEmployeeDetailsRepo = require('../../repositories/promTool/resourceManagementRepository');
const avgEnggRepo = require('../../repositories/promTool/averageEnggCostRepository');

const {
  getAllMonthsFromArrayOfDates,
  getCurrentMonthEndDate,
  convertYearMonthToStringDate,
  getShortMonthAbbreviation,
  monthOfDate,
  addOneDay,
  endOfTheWeekDate,
  getTotalWeeks,
  formatToLocalTime,
  getWeekOfDate,
  startOfMonth,
  dayjs,
  checkWeekSharedBetweenTwoDifferentYear,
  DateFomMonthYear,
  eachMonthYearInAndBetweenDates,
  convertYearMonthToDate,
  getMonthEndDateFromDate,
  getFullDate,
  dateRange,
  removeCommon,
  weeksCountEveryMonth,
  getWeeksInMonth,
  allMonthsInMonthYearFormatForFilters,
  getNumericYearMonthFromStringDate,
  getEarliestStartAndPreviousMonthAsEndDate,
  latestYearMonthFromArray,
  getPreviousMonthDatesFromCurrentDate,
  checkMonthOverLapBetweenDate,
  formatDate,
  dateAGreaterThanDateB,
  getMonthEndDateFromNormalDate,
  isDateAYearMonthGreaterThanDateBYearMonth,
  getPreviousMonthEndDate,
  getShortMonthYearAbbreviation,
  convertToNumericMonthYear,
  getOnlyYearFromFullDate,
} = require('../../utils/date');
const logger = require('../../utils/logger');

const createFilterConditionForProjectSelection = (filterCriteria) => {
  const result = {};
  if (filterCriteria?.project_name) result.project_name = filterCriteria.project_name;
  if (filterCriteria?.project_bu_name) result.project_bu_name = filterCriteria.project_bu_name;
  if (filterCriteria?.project_code) result.project_code = filterCriteria.project_code;
  return result;
};

const costUtilizationFilterForAllProject = (costUtilizationRequest) => {
  const filterForAllProject = {};
  if (costUtilizationRequest?.start_date) {
    filterForAllProject.start_date = convertYearMonthToDate(costUtilizationRequest.start_date);
  }
  if (costUtilizationRequest?.end_date) {
    filterForAllProject.end_date = getMonthEndDateFromDate(costUtilizationRequest.end_date);
  }
  return filterForAllProject;
};
const computeStartAndEndDateForUser = (costUtilizationRequest, startAndEndDateFromAllProject) => {
  // if user is requesting with start_date and end_date then use user requested start_date & end_date
  if (costUtilizationRequest.start_date && costUtilizationRequest.end_date) {
    return costUtilizationRequest;
  }

  // else calculate start_date & end_date by considering all project start_date and end_date
  // and pick the earliest start_date and latest end_date among all the project
  const { startDateYearMonth: start_date, endDateYearMonth: end_date } =
    getEarliestStartAndPreviousMonthAsEndDate(startAndEndDateFromAllProject);
  return { ...costUtilizationRequest, start_date, end_date };
};

const createWeeksForTheMonthWithZeroAllocation = (date) => {
  const month = {};
  const dateFormatted = formatToLocalTime(date);
  const weeksInTheMonth = getTotalWeeks(dateFormatted); // Example: 5 weeks in Month
  const monthStartDate = formatToLocalTime(startOfMonth(new Date(dateFormatted)));
  let WeekIndexInYear = getWeekOfDate(monthStartDate);
  for (let i = 0; i < weeksInTheMonth; i += 1) {
    month[`WEEK-${WeekIndexInYear}`] = parseFloat(0.0);
    WeekIndexInYear += 1;
  }
  /**
   * @returns {Object<key,value>}{ 'WEEK-40': 0,'WEEK-41': 0,'WEEK-42': 0,'WEEK-43': 0,'WEEK-44': 0,'WEEK-45': 0 }
   */
  return month;
};

const calculateWeekWiseAllocationGroupedByMonthYear = (startDate, endDate, allocation, monthWithWeek) => {
  // Create month and initialize all Weeks to 0 allocation Resource

  const createMonthsWithItsWeeks = (date, ResourceAllocation) => {
    const shortMonthWithYear = getShortMonthAbbreviation(date); // example : Apr-22
    // create month if Not Exist
    if (!Object.keys(monthWithWeek).includes(shortMonthWithYear)) {
      monthWithWeek[shortMonthWithYear] = createWeeksForTheMonthWithZeroAllocation(date);
    }
    // check whether week is shared between two different years
    const weekIndex = checkWeekSharedBetweenTwoDifferentYear(date);
    monthWithWeek[shortMonthWithYear][`WEEK-${weekIndex}`] += parseFloat(ResourceAllocation);
    return monthWithWeek;
  };

  const weekAllocationForProject = (date, resAllocation) => {
    // allocated resource to Respective weeks in a Month using date
    createMonthsWithItsWeeks(date, resAllocation);
  };

  // Main Logic Starts From Here ----
  const endDateLocalTime = endDate;
  let incrementalDate = startDate; // incrementalDate is also called first date of the week

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
  return monthWithWeek;
};

const employeeAllocationGroupedByMonthYear = (allocationDataArray) => {
  const monthWithWeek = {};

  allocationDataArray.forEach(({ start_date: startDate, end_date: endDate, allocation }) => {
    // for each row data From database perform allocation
    calculateWeekWiseAllocationGroupedByMonthYear(startDate, endDate, allocation, monthWithWeek);
  });
  /**
   * @returns {Object<<key,value>>}
   * @example output :{
    'Oct-22': { 'WEEK-40': 0, 'WEEK-41': 0.45, 'WEEK-42': 0.45, 'WEEK-43': 0.45,'WEEK-44': 0.45,'WEEK-45': 0.45 },
    'Nov-22': { 'WEEK-45': 0.45, 'WEEK-46': 0.45,'WEEK-47': 0,'WEEK-48': 0,'WEEK-49': 0 }
                      }
   */
  return monthWithWeek;
};

const findPlannedResourceForTheMonth = (monthYear, plannedData) => {
  const plannedResource = plannedData.find(
    ({ month_year: plannedMonthYear }) => convertYearMonthToStringDate(plannedMonthYear) === monthYear,
  );
  // if resource is not planned and allocated , Send as unallocated (0)
  if (plannedResource === undefined) return '0';
  const { planned_resource } = plannedResource;
  return parseFloat(planned_resource).toFixed(2);
};

const calculateActualAndPlanned = (finalMonthsData, plannedResourceForProject) => {
  // get How many Months-Name Calculated and store in Array
  const monthsOfAllocatedData = Object.keys(finalMonthsData); // Months-Name

  // loop over Months-Name Array and Calculate the highest Allocation in Each Week
  const allMonthsResourceData = monthsOfAllocatedData.reduce((monthlyAllocationData, monthYear) => {
    const allWeekAllocationDataForTheMonthInArray = Object.values(finalMonthsData[monthYear]);

    monthlyAllocationData[monthYear] = {
      // only consider Highest allocation of the Month
      allocatedResource: Math.max(...allWeekAllocationDataForTheMonthInArray).toFixed(2),
      plannedResource: findPlannedResourceForTheMonth(monthYear, plannedResourceForProject),
    };

    return { ...monthlyAllocationData };
  }, {});

  /**
   *   @returns {Object<<Keys,value>>}{
   *   'Oct-22': { allocatedResource: '0.45', plannedResource: '5.00' },
   *   'Nov-22': { allocatedResource: '0.45', plannedResource: '8.50' }}
   */
  return allMonthsResourceData;
};

const addRemainingMonthsAsZeroResources = (realResource, allMonthsInFromFilters, plannedCostFromDb) => {
  const finalDataWithResource = { ...realResource }; // real Actual resource And planned resource calculated Data.
  const monthsWithRealData = Object.keys(realResource); // month-year name as Keys in name

  /**
   * if month-year is not present in calculated(i.e present in @var finalDataWithResource) then send it as month with
   * empty Actual Data.
   */
  const monthsNotInResourceData = allMonthsInFromFilters.filter((ele) => monthsWithRealData.includes(ele) === false);

  /**
   * @param {string} element is month name for which data for calculation of allocated resource is not present.
   * @var {Array<String>} monthsNotInResourceData is Array of months which as no data in Database for this project.
   * @description this forEach will check whether the particular month as planned Resource data even though this
   * array of month no data for AllocatedResource calculation.if plannedResource is present for the Month,then add it
   * or send both AllocatedResource = 0 and plannedResource = 0 for that month
   */

  monthsNotInResourceData.forEach((element) => {
    const plannedCostForTheMonth = plannedCostFromDb.find(
      ({ month_year: monthYear }) => element === convertYearMonthToStringDate(monthYear),
    );
    if (plannedCostForTheMonth) {
      const { planned_resource } = plannedCostForTheMonth;
      finalDataWithResource[element] = {
        allocatedResource: '0',
        plannedResource: parseFloat(planned_resource).toFixed(2),
      };
    } else if (plannedCostForTheMonth === undefined) {
      finalDataWithResource[element] = { allocatedResource: '0', plannedResource: '0' };
    }
  });
  return finalDataWithResource;
};

const sortInMonthYearOrder = (resourceData) => {
  const monthAsKeys = Object.keys(resourceData);
  const sortedMonths = monthAsKeys.sort((a, b) => {
    const date1 = DateFomMonthYear(a);
    const date2 = DateFomMonthYear(b);
    if (dayjs(date2) > dayjs(date1)) return -1;
    if (!(dayjs(date2) > dayjs(date1))) return 1;
    return 0;
  });
  const sortedAllocationData = sortedMonths.reduce((sortedInMonthYear, current) => {
    sortedInMonthYear[current] = resourceData[current];
    return { ...sortedInMonthYear };
  }, {});
  return sortedAllocationData;
};

// get Resource Utilization – High Level (Project - Resource Level) and
//  Resource Utilization – Detailed Level (Resource Level)
const userExists = (resourceEmpId, projectCode, totalResult) => {
  return totalResult.some((el) => {
    return el.empId === resourceEmpId && el.projectCode === projectCode;
  });
};
const upsert = (totalResult, item) => {
  const i = totalResult.findIndex((_item) => _item.empId === item.empId);
  if (i > -1) {
    Object.keys(totalResult[i]).forEach((a) => {
      const indiItemObj = item[a];
      if (totalResult[i][a] && item[a] !== item.empId && totalResult[i][a] && item[a] !== item.resourceName) {
        for (const idxKey in totalResult[i][a]) {
          if (Object.hasOwnProperty.call(totalResult[i][a], idxKey)) {
            for (const itemKey in indiItemObj) {
              if (Object.hasOwnProperty.call(indiItemObj, itemKey)) {
                const element1 = indiItemObj[itemKey];
                if (idxKey === itemKey) {
                  const max =
                    parseFloat(totalResult[i][a][idxKey]) > parseFloat(element1)
                      ? parseFloat(totalResult[i][a][idxKey])
                      : parseFloat(element1);
                  const add = max === 0 ? 0 : max.toFixed(2);
                  totalResult[i][a][idxKey] = add;
                }
              }
            }
          }
        }
      }
    });
  }

  return totalResult;
};

const formFilterConditionForFetch = (request) => {
  if (request.projectGroup[0] === 'All') {
    return undefined;
  }
  return { project_bu_name: request.projectGroup };
};

const isProjectStartDateValid = (projectStartDateFromDatabase, previousMonthEndDate) => {
  if (projectStartDateFromDatabase == null) {
    return null;
  }
  const formattedProjectStartDate = formatDate(projectStartDateFromDatabase);
  return dateAGreaterThanDateB(previousMonthEndDate, formattedProjectStartDate) ? formattedProjectStartDate : null;
};

const formatDatesOfStartAndEndDate = (objectOfProjectStartAndEndDate, requestBody) => {
  // projectStartDateFromDb contains earlier start date from database.
  const projectStartDateFromDb = objectOfProjectStartAndEndDate.project_start_date;
  const previousMonthEndDate = getPreviousMonthEndDate();

  // if projectStart from database is null then no project start date in database, show no Record found error in UI.
  const projectStartDate = isProjectStartDateValid(projectStartDateFromDb, previousMonthEndDate);

  return {
    start_date: projectStartDate,

    // only allow end_date to previous month end date if project start date is available
    end_date: projectStartDate == null ? null : previousMonthEndDate,

    // use below code if project_end_date is required instead of previous month end date
    // end_date: formatDate(objectOfProjectStartAndEndDate.project_end_date),
    projectGroup: requestBody.projectGroup,
  };
};

const fetchAndPerformStartAndEndDateCalculationForGroupByCount = async (requestBody) => {
  if (requestBody?.startDate != null && requestBody?.endDate != null) {
    return {
      // example: convert Year-month(2022-06) format to YYYY-MM-DD format and return
      start_date: convertYearMonthToDate(requestBody.startDate),
      end_date: getMonthEndDateFromDate(requestBody.endDate),
      projectGroup: requestBody.projectGroup,
    };
  }

  const groupFilterCondition = formFilterConditionForFetch(requestBody);
  const projectStartAndEndInfo = await promReportsRepository.getProjectMinStartDateAndMaxEndDate(groupFilterCondition);
  const projectStartAndEndDateFormatted = formatDatesOfStartAndEndDate(projectStartAndEndInfo, requestBody);
  return projectStartAndEndDateFormatted;
};

const resourceMonthlyAllocationData = (
  requestedMonths,
  removeCommonList,
  allocationCount,
  weekArr,
  actualWeekArr,
  startDate,
  endDate,
  resourceData,
  projectInfo,
  resourceRequest,
) => {
  let totalObj;
  if (resourceRequest.project_code) {
    totalObj = {
      projectCode: projectInfo.project_code,
      projectName: projectInfo.project_name,
      projectBUName: projectInfo.project_bu_name,
      empId: resourceData.resource_emp_id,
      resourceName: resourceData.promAvinEmployeeDetails.resource,
    };
  } else {
    totalObj = {
      empId: projectInfo.resource_emp_id,
      resourceName: projectInfo.resource,
    };
  }

  requestedMonths.forEach((monthData) => {
    const date = monthData;
    const startYear = date.slice(0, 4);
    const startMonth = date.slice(5, 7);
    const monthlyWeekCount = weeksCountEveryMonth(startYear, startMonth);
    let continuousWeekCount = 1;
    // if date exists in remove common list then allocation will be zero
    if (removeCommonList.includes(date) === true) {
      allocationCount = 0;
      const obj = {};
      if (monthlyWeekCount !== 0) {
        let i = 1;
        do {
          const numberOfWeek = `CW${continuousWeekCount}${date}`;
          i += 1;
          continuousWeekCount += 1;
          obj[numberOfWeek] = allocationCount;
        } while (i <= monthlyWeekCount);
        totalObj[date] = { ...obj };
      } else {
        weekArr.push({
          week: 0,
        });
        actualWeekArr.push({
          allocationStartDate: date,
          weekData: weekArr,
        });
      }
    } else {
      const dataExistedYear = date.slice(0, 4);
      const dataExistedMonth = date.slice(5, 7);
      const weeksList = getWeeksInMonth(dataExistedYear, dataExistedMonth);
      weeksList.forEach((existedWeek) => {
        const obj = {};
        if (startDate <= existedWeek.end && endDate >= existedWeek.start) {
          allocationCount = resourceData.allocation;
          const numberOfWeek = `CW${continuousWeekCount}${date}`;
          continuousWeekCount += 1;
          obj[numberOfWeek] = allocationCount;
          totalObj[date] = { ...totalObj[date], ...obj };
        } else {
          allocationCount = 0;
          const numberOfWeek = `CW${continuousWeekCount}${date}`;
          continuousWeekCount += 1;
          obj[numberOfWeek] = allocationCount;

          totalObj[date] = { ...totalObj[date], ...obj };
        }
      });
    }
  });
  return totalObj;
};

const projWiseAllocationData = (
  promAvinResourceAllocation,
  startDate,
  endDate,
  requestedMonths,
  projectInfo,
  totalResult,
  resourceRequest,
  employeeResourceAllocation,
  getDatesInfo,
) => {
  let resourceMonthlyData;
  const reportsInfo = resourceRequest.project_code ? promAvinResourceAllocation : employeeResourceAllocation;
  if (reportsInfo.length === 0 && resourceRequest.resource_emp_id) {
    reportsInfo.push({
      start_date: getDatesInfo.request.start_date,
      end_date: getDatesInfo.request.end_date,
      allocation: 0,
    });
  }
  reportsInfo.forEach((resourceData) => {
    const actualWeekArr = [];
    const allocationCount = 0;
    const weekArr = [];
    startDate = resourceData.start_date;
    endDate = resourceData.end_date;
    const totalMonths = dateRange(startDate, endDate);
    const removeCommonList = removeCommon(requestedMonths, totalMonths);
    resourceMonthlyData = resourceMonthlyAllocationData(
      requestedMonths,
      removeCommonList,
      allocationCount,
      weekArr,
      actualWeekArr,
      startDate,
      endDate,
      resourceData,
      projectInfo,
      resourceRequest,
    );
    const userCheck = userExists(resourceMonthlyData.empId, resourceMonthlyData.projectCode, totalResult);

    if (userCheck === true) {
      totalResult = upsert(totalResult, resourceMonthlyData);
    } else totalResult.push(resourceMonthlyData);
  });
  return totalResult;
};

const monthWiseResourceData = (projWiseAllocationInfo) => {
  projWiseAllocationInfo.forEach(({ empId, resourceName, ...rest }) => {
    Object.keys(rest).forEach((eachMonth) => {
      const allWeeksAllocationData = Object.values(rest[eachMonth]);
      const allWeeksAllocationSummation = allWeeksAllocationData.reduce((acc, curr) => {
        return parseFloat(curr) + acc;
      }, 0.0);
      const averageOfMonthData =
        parseFloat(allWeeksAllocationSummation / allWeeksAllocationData.length) === 0
          ? 0
          : parseFloat(allWeeksAllocationSummation / allWeeksAllocationData.length).toFixed(2);
      rest[eachMonth].total = averageOfMonthData;
    });
  });
  return projWiseAllocationInfo;
};

const getDatesFilter = (request, projectDetails) => {
  if (request.start_date !== null && request.end_date !== null) {
    const addStartDate = '-01';
    request.start_date = request.start_date.concat(addStartDate);
    request.end_date = request.end_date.concat(addStartDate);
  } else {
    const getMaxStartDate = new Date(Math.min(...projectDetails.map((e) => new Date(e.project_start_date))));
    request.start_date = formatToLocalTime(getMaxStartDate);
    request.end_date = getPreviousMonthDatesFromCurrentDate();
  }
  const allRequestedMonths = dateRange(request.start_date, request.end_date);
  const requestedMonths = allRequestedMonths.map((monthNum) => monthNum.slice(0, -3));
  return { request, requestedMonths };
};

const getDatesFilterResourceUtilization = (request, projectDetails) => {
  if (request.start_date !== null && request.end_date !== null) {
    const addStartDate = '-01';
    request.start_date = request.start_date.concat(addStartDate);
    request.end_date = request.end_date.concat(addStartDate);
  } else {
    const getMaxStartDate = new Date(Math.min(...projectDetails.map((e) => new Date(e.project_start_date))));
    request.start_date = formatToLocalTime(getMaxStartDate);
    request.end_date = getPreviousMonthDatesFromCurrentDate();
  }
  const allRequestedMonths = dateRange(request.start_date, request.end_date);
  const requestedMonths = allRequestedMonths.map((monthNum) => monthNum);
  return { request, requestedMonths };
};

const FetchMaxProjectStartDate = async (request) => {
  const getMaxDate = await projectRepo.getMaxProjectStartDate(request);
  return getMaxDate;
};

const getMaxProjectStartDateForgeneric = async (request) => {
  const getMaxDate = await projectRepo.getMaxProjectStartDateForgeneric(request);
  return getMaxDate;
};

const FetchMaxProjectStartDateForGeneric = async (request) => {
  const getMaxDate = await projectRepo.getMaxProjectStartDateBasedProject(request);
  return getMaxDate;
};

const FetchMaxResourceStartDate = async (request) => {
  const getMaxDate = await projectRepo.getMaxResourceStartDate(request);
  return getMaxDate;
};

const getDatesFilterFromResourceData = async (request) => {
  if (request.start_date !== null && request.end_date !== null) {
    const getFullDateData = getFullDate(request.start_date, request.end_date);
    request.start_date = getFullDateData.newStartDate;
    request.end_date = getFullDateData.newEndDate;
  } else {
    const getMaxStartDate = await FetchMaxResourceStartDate(request);
    if (getMaxStartDate === null) {
      return [];
    }
    getMaxStartDate.start_date = getMaxStartDate === null ? '' : getMaxStartDate.start_date;
    request.start_date = formatToLocalTime(getMaxStartDate.start_date);
    request.end_date = getPreviousMonthDatesFromCurrentDate();
  }
  const allRequestedMonths = dateRange(request.start_date, request.end_date);
  const requestedMonths = allRequestedMonths.map((monthNum) => monthNum);
  return { request, requestedMonths };
};

const getDatesFilterFromProjectData = async (request) => {
  if (request.start_date !== null && request.end_date !== null) {
    const getFullDateData = getFullDate(request.start_date, request.end_date);
    request.start_date = getFullDateData.newStartDate;
    request.end_date = getFullDateData.newEndDate;
  } else {
    const getMaxStartDate = await FetchMaxProjectStartDate(request);
    request.start_date = formatToLocalTime(getMaxStartDate.project_start_date);
    request.end_date = getPreviousMonthDatesFromCurrentDate();
  }
  const allRequestedMonths = dateRange(request.start_date, request.end_date);
  const requestedMonths = allRequestedMonths.map((monthNum) => monthNum.slice(0, -3));
  return { request, requestedMonths };
};

const getHighLevelProjectResourceAllocation = async (costUtilizationRequest) => {
  // if (costUtilizationRequest.start_date === null && costUtilizationRequest.end_date === null) {
  const resourceFromDateAndToDate = await getDatesFilterFromProjectData(costUtilizationRequest);
  // } else resourceFromDateAndToDate = costUtilizationFilterForAllProject(costUtilizationRequest);
  resourceFromDateAndToDate.start_date = resourceFromDateAndToDate.request.start_date;
  resourceFromDateAndToDate.end_date = resourceFromDateAndToDate.request.end_date;
  // create a filter for project_code, project name and project_bu_name to fetch from project_details Table
  const projectFilterCondition = createFilterConditionForProjectSelection(costUtilizationRequest);
  // fetch raw data for processing from database
  const getAllProjectCostUtilizationData = await promReportsRepository.getResourceAllocationForCostUtilization(
    resourceFromDateAndToDate,
    projectFilterCondition,
  );
  // if user didn't specify start_date and end_date then consider the earliest start_end and latest end_date
  // from all the project and use to show the result in frontEnd. else use user's start_date and end_date
  const requiredStartAndEndDateForUser = computeStartAndEndDateForUser(
    costUtilizationRequest,
    getAllProjectCostUtilizationData,
  );

  if (getAllProjectCostUtilizationData.length === 0 || getAllProjectCostUtilizationData == null) return [];
  return getAllProjectCostUtilizationData;
};

// get resource utilization reports based on project/project-resource level/ resource level
// If user selected only group and project means we are considering start month as project start date and
// end month as previous month of the current month
// If user not passed end month means considering end month as previous month
// If only resource level reports means user should select start and end month
const getReportsData = async (resourceRequest) => {
  let projectAllocationData;
  let getDatesInfo;
  if (resourceRequest.project_code) {
    projectAllocationData = await getHighLevelProjectResourceAllocation(resourceRequest);
    getDatesInfo = getDatesFilterResourceUtilization(resourceRequest, projectAllocationData);

    // // for high level project- resource functionality
    // reportsInfo = await promReportsRepository.fetchAllReportsByProjCode(resourceRequest);
  } else if (resourceRequest.resource_emp_id[0] === 'All') {
    // for detailed level all employees
    // fetching all employees from employee list
    const getAllEmpIds = await promAvinEmployeeDetailsRepo.fetchAllResources();
    const empIds = getAllEmpIds.map(({ resource_emp_id: resourceEmpId, resource_name: resource }) => {
      return { resourceEmpId, resource };
    });
    // fetching employees from resource allocation table
    getDatesInfo = await getDatesFilterFromResourceData(resourceRequest);
    if (getDatesInfo.length === 0) {
      return [];
    }
    projectAllocationData = await promReportsRepository.getResourceAllocationDetailedLevel(getDatesInfo);
    const existedEmpIds = projectAllocationData.map(({ resource_emp_id: resourceEmpId, resource }) => {
      return { resourceEmpId, resource };
    });
    const zeroEmpIDS = empIds.filter(
      (item) => !existedEmpIds.some((itemToBeRemoved) => itemToBeRemoved.resourceEmpId === item.resourceEmpId),
    );
    if (zeroEmpIDS.length > 0) {
      for (const NEEmpId of zeroEmpIDS) {
        projectAllocationData.push({
          resource_emp_id: NEEmpId.resourceEmpId,
          resource: NEEmpId.resource,
          promAvinResourceAllocation: [
            { start_date: resourceRequest.start_date, end_date: resourceRequest.end_date, allocation: 0 },
          ],
        });
      }
    }
  } else {
    getDatesInfo = await getDatesFilterFromResourceData(resourceRequest);
    if (getDatesInfo.length === 0) {
      return [];
    }
    projectAllocationData = await promReportsRepository.getResourceAllocationDetailedLevel(getDatesInfo);
    if (
      projectAllocationData.length === 0 ||
      !projectAllocationData.some((eachProject) => eachProject.employeeResourceAllocation.length > 0) ||
      projectAllocationData == null
    ) {
      return [];
    }
  }
  const totalResult = [];

  let startDate;
  let endDate;
  let projWiseAllocationInfo;
  projectAllocationData.forEach((reportsInfo) => {
    projWiseAllocationInfo = projWiseAllocationData(
      reportsInfo.promAvinResourceAllocation,
      startDate,
      endDate,
      getDatesInfo.requestedMonths,
      reportsInfo,
      totalResult,
      resourceRequest,
      reportsInfo.employeeResourceAllocation,
      getDatesInfo,
    );
  });
  const finalResult = monthWiseResourceData(projWiseAllocationInfo);
  return finalResult;
};

const resourceUtilizationFilterForAllProject = (resourceUtilizationRequest) => {
  const filterForAllProject = {};
  if (resourceUtilizationRequest?.start_date) {
    filterForAllProject.start_date = convertYearMonthToDate(resourceUtilizationRequest.start_date);
  }
  if (resourceUtilizationRequest?.end_date) {
    filterForAllProject.end_date = getMonthEndDateFromDate(resourceUtilizationRequest.end_date);
  }
  return filterForAllProject;
};

const groupByEmployeeId = (costUtilizationData, groupByKey = 'resource_emp_id') => {
  const groupedByEmployeeId = costUtilizationData.reduce((previousValue, currentValue) => {
    (previousValue[currentValue[groupByKey]] = previousValue[currentValue[groupByKey]] ?? []).push(currentValue);
    return previousValue;
  }, {});
  return groupedByEmployeeId;
};

const getAverageOfAllocationPerMonth = (monthData, monthName) => {
  const weekData = monthData[monthName];

  const weeklyAllocatedDataForTheMonth = Object.values(weekData); // all week allocation in array
  const totalWeekInMonth = weeklyAllocatedDataForTheMonth.length; // no. of week in that month

  // summation of week data
  const summationOfAllWeek = weeklyAllocatedDataForTheMonth.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0,
  );
  // average of the month formula = summation of all week data/total week of the month.
  return parseFloat((summationOfAllWeek / totalWeekInMonth).toFixed(2)); // using average formula
};

const allocateCostForEachEmployee = (projectCostResourceData) => {
  const calculateMonthlyMaxAllocationForEmployee = (monthWithAllocationValues) => {
    const allMonthNameAsKeys = Object.keys(monthWithAllocationValues);
    const finalDataHere = allMonthNameAsKeys.reduce((eachMonth, currentMonth) => {
      eachMonth[currentMonth] = getAverageOfAllocationPerMonth(monthWithAllocationValues, currentMonth);
      return { ...eachMonth };
    }, {});
    return finalDataHere;
  };

  // -------------------------------- Main Process starts Here --------------------------
  /**
   * @var {Object<Key,Array>>} projectCostResourceData contains object of employee allocation details
   * grouped by employee id. this is used so we can perform employee wise operation
   * @example for projectCostResourceData
   * {'001': [ { project_code: 'A000D1',resource_emp_id: '0482',start_date: '2022-06-11',
   *              end_date: '2022-06-12',allocation: '0.10' },
              ],
      '002': [{ project_code: 'A000D1',resource_emp_id: '0466',start_date: '2022-05-31',
                 end_date: '2022-06-28',allocation: '0.10' }
              ]}
   */
  const eachEmployeeDetailsWithMonthlyAllocation = Object.keys(projectCostResourceData).map((currentEmployeeId) => {
    const monthWithWeek = {}; // this is main Object Which saves employee year-month wise allocation.

    projectCostResourceData[currentEmployeeId].forEach(({ start_date: startDate, end_date: endDate, allocation }) => {
      /**
       * @var monthWithWeek will contains month wise allocation for the @var currentEmployeeId
       * @example for monthWithWeek Object after allocation operation for employee Id 0001
       * { 'Jun-22': { 'WEEK-23': 0,  'WEEK-24': 0,   'WEEK-25': 0.1,'WEEK-26': 0,'WEEK-27': 0},
           'Nov-22': { 'WEEK-45': 0.1,'WEEK-46': 0.25,'WEEK-47': 0,  'WEEK-48': 0,'WEEK-49': 0}
         }
       */
      calculateWeekWiseAllocationGroupedByMonthYear(startDate, endDate, allocation, monthWithWeek);
    });

    /**
     * it will save average allocation along all the week in a month
     * @example employeeMonthlyAllocation : { 'Jun-22': 0.02, 'Nov-22': 0.07 }
     */
    const employeeMonthlyAllocation = calculateMonthlyMaxAllocationForEmployee(monthWithWeek);

    return { employeeId: currentEmployeeId, employeeMonthlyAllocation };
  });

  /**
   * @returns {Array<Object>}
   * @example output : [{ employeeId : '001', employeeMonthlyAllocation: { 'Jun-22': 0.02, 'Nov-22': 0.07 } },
   *                    {..........},{...........}],
   */
  return eachEmployeeDetailsWithMonthlyAllocation;
};

const calculateExpensesForTheMonth = (salaryPerMonth, monthlyExpenses) => {
  const monthlyTotalSalaryPerAllocation = { ...salaryPerMonth };
  const addExpenseToTheMonth = (expenseType, amount, approvedDate) => {
    const shortMonthYearAbbreviation = getShortMonthAbbreviation(approvedDate);
    if (Object.keys(monthlyTotalSalaryPerAllocation).includes(shortMonthYearAbbreviation)) {
      if (!Object.keys(monthlyTotalSalaryPerAllocation[shortMonthYearAbbreviation]).includes(expenseType)) {
        monthlyTotalSalaryPerAllocation[shortMonthYearAbbreviation][expenseType] = parseFloat(0.0);
      }
      monthlyTotalSalaryPerAllocation[shortMonthYearAbbreviation][expenseType] = parseFloat(
        (monthlyTotalSalaryPerAllocation[shortMonthYearAbbreviation][expenseType] + parseFloat(amount)).toFixed(2),
      );
    }
  };

  // logic starts starts inside this function
  // if Expense is approved,add the Expense to the approved_date Month
  monthlyExpenses.forEach(({ expense_type, amount, approved_date }) => {
    if (approved_date !== null) addExpenseToTheMonth(expense_type, amount, approved_date);
  });
  return monthlyTotalSalaryPerAllocation;
};

const calculateTotalCostFromSalaryAndExpenses = (monthlySalaryPlusExpenses) => {
  const allMonthlyData = {};
  Object.keys(monthlySalaryPlusExpenses).forEach((monthYear) => {
    allMonthlyData[monthYear] = {
      actualTotalCost: Object.values(monthlySalaryPlusExpenses[monthYear]).reduce((a, b) => a + b),
    };
  });
  return allMonthlyData;
};

const initialRemainingExpenseToZeroCost = (monthlySalaryPlusExpenses, expenseTypeArray) => {
  // initial unspecified or empty Expenses to 0
  const expensesNames = expenseTypeArray.map(({ expense_type: expenseType }) => expenseType);
  const monthNameAsKeys = Object.keys(monthlySalaryPlusExpenses);
  monthNameAsKeys.forEach((month) => {
    expensesNames.forEach((singleExpense) => {
      if (!Object.keys(monthlySalaryPlusExpenses[month]).includes(singleExpense)) {
        monthlySalaryPlusExpenses[month][singleExpense] = parseFloat(0.0);
      }
    });
  });
  return monthlySalaryPlusExpenses;
};

const addRemainingMonthsAsZeroCostDetailedLevel = (realResource, allMonthsInFromFilters) => {
  // months with No data , initialize with 0 for all Attribute(totalSalaryPerAllocation,travel expense,..)

  const finalDataWithResource = { ...realResource };
  const monthsWithRealData = Object.keys(realResource);
  const monthsNotInResourceData = allMonthsInFromFilters.filter((ele) => monthsWithRealData.includes(ele) === false);
  monthsNotInResourceData.forEach((element) => {
    finalDataWithResource[element] = {
      TotalSalaryPerAllocation: 0,
      'Travel Expense': 0,
      'Cab Expense': 0,
      'Food Expense': 0,
      'Project Equipment Cost': 0,
      UER: 0,
      'Sales Commission': 0,
      'Consultancy fee': 0,
      Other: 0,
      Total: 0,
    };
  });
  return finalDataWithResource;
};

const addRemainingMonthsAsZeroCost = (realResource, allMonthsInFromFilters, plannedCostFromInDb) => {
  const finalDataWithResource = { ...realResource }; // all calculated Data
  const monthsNameWithRealDataAsKey = Object.keys(realResource); // only month name as keys

  // create array of months which data are required for user but no Actual Resource Data for that month
  const monthsNotInResourceData = allMonthsInFromFilters.filter(
    (ele) => monthsNameWithRealDataAsKey.includes(ele) === false,
  );

  /**
   * @param {string} element is month name for which data for calculation of actual resource is not present
   * @var {Array<String>} monthsNotInResourceData is Array of months which as no data in Database for
   *  this project
   * @description this forEach will check whether the particular month as planned cost data even though this
   * array of month no data for ActualCost calculation.if plannedCost is present for the Month,then add it
   * or send both ActualTotalCost = 0 and plannedCost = 0 for that month
   */
  monthsNotInResourceData.forEach((element) => {
    const plannedCostForTheMonth = plannedCostFromInDb.find(
      ({ month_year: monthYear }) => element === convertYearMonthToStringDate(monthYear),
    );
    if (plannedCostForTheMonth) {
      const { planned_cost } = plannedCostForTheMonth;
      finalDataWithResource[element] = {
        actualTotalCost: 0,
        plannedCost: parseFloat(planned_cost),
      };
    } else if (plannedCostForTheMonth === undefined) {
      finalDataWithResource[element] = {
        actualTotalCost: 0,
        plannedCost: 0,
      };
    }
  });

  return finalDataWithResource;
};

const addPlannedCostForTheMonth = (totalCost, plannedCost) => {
  /**
   * if cost plan for the particular is not there means we are considering as 0.0,but we should
   * let know user know which month data is considered as Zero,so saving it in @var noCostPlanInDatabaseForTheMonth
   */
  const noCostPlanInDatabaseForTheMonth = [];

  /**
   * @description if month actual cost is calculated and planned cost for that month is present,
   * then add planned cost for that month
   */
  Object.keys(totalCost).forEach((currentMonth) => {
    const plannedCostPerMonth = plannedCost.find(
      ({ month_year: monthYear }) => currentMonth === convertYearMonthToStringDate(monthYear),
    );
    // if resource is not planned(i.e not present in database) for that particular month, Send as 0.00
    if (plannedCostPerMonth) {
      const { planned_cost } = plannedCostPerMonth;
      totalCost[currentMonth].plannedCost = parseFloat(planned_cost).toFixed(2);
    } else if (plannedCostPerMonth === undefined) {
      totalCost[currentMonth].plannedCost = parseFloat(0.0);
      noCostPlanInDatabaseForTheMonth.push(currentMonth);
    }
  });

  return { actualAndPlannedTotalCostForMonths: totalCost, noCostPlanInDatabaseForTheMonth };
};

const calculateTheSumOfTheExpensesOfTheMonth = (allMonthWithExpenses) => {
  // calculate some of Months Expense and save as Total in Month object
  Object.keys(allMonthWithExpenses).forEach((monthYear) => {
    allMonthWithExpenses[monthYear].Total = Object.values(allMonthWithExpenses[monthYear]).reduce((a, b) => a + b);
  });

  return allMonthWithExpenses;
};

const calculateSalaryPerAllocation = (ctc, allocation) => {
  // formula = (ctc/12) * employee Allocation for the month;
  return parseFloat((parseInt(ctc, 10) / 12 * allocation).toFixed(2));
};

const considerLatestSalaryForEmployeeIfNotAvailable = (allMonthYearInArray) => {
  return latestYearMonthFromArray(allMonthYearInArray);
};

// call this function if no ctc for previous month/particular month.
const throwNoCtcError = (employeeId, singleMonth) => {
  logger.error(`No CTC for employee id ${employeeId} for ${singleMonth}`);
  throw new Error('No ctc', { cause: `No CTC for employee id ${employeeId} for ${singleMonth}` });
};

const calculateCtcIFAvailableOrThrowError = (employeeCTCForMonths, singleMonth, employeeId) => {
  // take the latest salary of the employee from the array
  const latestSalaryMonthOfEmployee = considerLatestSalaryForEmployeeIfNotAvailable(employeeCTCForMonths.keys());

  /**
   * check whether the current iteration month is less than latest salary month
   * which means employee salary revision is not present for old previous/old (i.e employee salary revision for
   * particular month is missing in old records) */
  const isSalaryForOldMonthNotPresent = isDateAYearMonthGreaterThanDateBYearMonth(
    singleMonth,
    latestSalaryMonthOfEmployee,
  );
  if (!isSalaryForOldMonthNotPresent) {
    // no ctc for old record
    throwNoCtcError(employeeId, singleMonth);
  }

  // if searching month is in future then consider and return latest salary of the employee
  return employeeCTCForMonths?.get(latestSalaryMonthOfEmployee);
};

/**
 * @param {Array<Object>} employeeDetailsWithAllocation
 * @example for employeeDetailsWithAllocation params
 * [{ employeeId: '0001',employeeMonthlyAllocation: { 'Jun-22': 0.1 } },
 *  { employeeId: '0002',employeeMonthlyAllocation: { 'Nov-22': 0.1, 'Jun-22': 0.02 }}]
 */
const calculateTotalSalaryPerMonthAllocation = (employeeDetailsWithAllocation, employeeSalaryForParticularMonths) => {
  /**
   * 
   * @summary all Employee salary will considered and added as TotalSalaryPerAllocation for particular months
   * {@link monthYearSalaryPerAllocationData} to store monthly wise totalSalaryPerAllocation
   */
  const monthYearSalaryPerAllocationData = {};

  employeeDetailsWithAllocation.forEach(({ employeeId, employeeMonthlyAllocation }) => {
    Object.keys(employeeMonthlyAllocation).forEach((singleMonth) => {
      // select employee ctc for the month from employeeMonthlyAllocation Map

      const employeeCTCForMonths = employeeSalaryForParticularMonths?.get(employeeId);
      // if employee details only not present, then throw error indicating no employee data for this month
      // if (employeeCTCForMonths == null) throwNoCtcError(employeeId, singleMonth);
      // const employeeCTCForCurrentIterationMonth = employeeCTCForMonths?.get(singleMonth);

      let employeeCTCForCurrentIterationMonth = employeeCTCForMonths?.get(singleMonth);
      employeeCTCForCurrentIterationMonth =
        employeeCTCForCurrentIterationMonth === undefined ? 0 : employeeCTCForCurrentIterationMonth;
      const employeeCTC =
        employeeCTCForCurrentIterationMonth == null
          ? calculateCtcIFAvailableOrThrowError(employeeCTCForMonths, singleMonth, employeeId)
          : employeeCTCForCurrentIterationMonth;

      if (employeeCTC == null) throwNoCtcError(employeeId, singleMonth);
      // if monthYearSalaryPerAllocationData  Object doesn't includes month Data(i.e example : "Jun-22")
      // then create month object to it or else add(sum operation) salary allocation to month
      if (!Object.keys(monthYearSalaryPerAllocationData).includes(singleMonth)) {
        monthYearSalaryPerAllocationData[singleMonth] = { TotalSalaryPerAllocation: parseFloat(0.0) };
      }

      monthYearSalaryPerAllocationData[singleMonth].TotalSalaryPerAllocation = parseFloat(
        (
          monthYearSalaryPerAllocationData[singleMonth].TotalSalaryPerAllocation +
          calculateSalaryPerAllocation(employeeCTC, employeeMonthlyAllocation[singleMonth])
        ).toFixed(2),
      );
    });
  });

  /**
   * @returns Object of month wise (totalSalaryPerAllocation) Details
   * @example output for parameter input
   * returning output: { 'Jun-22': { TotalSalaryPerAllocation: 898.04 },
                         'Nov-22': { TotalSalaryPerAllocation: 740.73 }  }
   */
  return monthYearSalaryPerAllocationData;
};

const calculateGrandTotalOfAllMonthActualCostHighLevel = (sortedCostData) => {
  // adding all Cost from Actual and Total Cost
  const grandTotalOfActualCost = Object.keys(sortedCostData).reduce(
    (finalTotalCost, currentMonth) => finalTotalCost + parseFloat(sortedCostData[currentMonth].actualTotalCost),
    0,
  );
  const grandTotalOfPlannedCost = Object.keys(sortedCostData).reduce(
    (finalTotalCost, currentMonth) => finalTotalCost + parseFloat(sortedCostData[currentMonth].plannedCost),
    0,
  );
  return { grandTotalOfActualCost, grandTotalOfPlannedCost };
};

const calculateGrandTotalOfAllMonthActualCostDetailedLevel = (sortedCostData) => {
  const grandTotalOfActualCost = Object.keys(sortedCostData).reduce(
    (finalTotalCost, currentMonth) => finalTotalCost + parseFloat(sortedCostData[currentMonth].Total),
    0,
  );
  return parseFloat(parseFloat(grandTotalOfActualCost).toFixed(2));
};

const calculateGrandTotalOfPlannedCostOfAllMonths = (
  AllMonthlyDataWithActualCost,
  plannedCost,
  monthlyActualCostExcluding,
) => {
  const noCostPlanInDatabaseForTheMonth = [];

  /**
   * @var actualCostExcludingEmptyMonths this array is used to store the month names where real
   * resource allocation is calculated.
   * if cost plan doesn't exist for this month then add data to noCostPlanInDatabaseForTheMonth array.
   * Reason : AllMonthlyDataWithActualCost contains Empty months for user input ,where empty months may or
   * may not have costPlan details in tables, but actualCostExcludingEmptyMonths must have Cost plan in table.
   */
  const actualCostExcludingEmptyMonths = Object.keys(monthlyActualCostExcluding);
  const allMonthsName = Object.keys(AllMonthlyDataWithActualCost);

  const totalPlannedCostOfAllMonth = allMonthsName.reduce((previousValue, currentValue) => {
    const currentMonth = plannedCost.find(
      ({ month_year: monthYear }) => convertYearMonthToStringDate(monthYear) === currentValue,
    );

    if (currentMonth) {
      const total = previousValue + parseFloat(currentMonth.planned_cost);
      return total;
    }
    if (!currentMonth && actualCostExcludingEmptyMonths.includes(currentValue)) {
      noCostPlanInDatabaseForTheMonth.push(currentValue);
    }
    return previousValue;
  }, 0);

  return { grandTotalOfPlannedCost: totalPlannedCostOfAllMonth, noCostPlanInDatabaseForTheMonth };
};

const sortExpenseInOrder = (monthlyUnsortedExpenseData, AllExpenses) => {
  const expensesNames = AllExpenses.map(({ expense_type: expenseType }) => expenseType);

  // sorting here itself for frontEnd requirements
  const allExpenseNames = ['TotalSalaryPerAllocation', ...expensesNames, 'Total'];
  const sortedExpensesInMonth = Object.keys(monthlyUnsortedExpenseData).reduce((sortedExpenseObject, singleMonth) => {
    sortedExpenseObject[singleMonth] = {};
    allExpenseNames.forEach((expense) => {
      sortedExpenseObject[singleMonth][expense] = monthlyUnsortedExpenseData[singleMonth][expense];
    });
    return sortedExpenseObject;
  }, {});
  return sortedExpensesInMonth;
};

// to be used as Helper function
const groupArrayOfObjectByKey = (arrayOfObject, groupByKey = 'resource_emp_id') => {
  return arrayOfObject.reduce((previousValue, currentValue) => {
    (previousValue[currentValue[groupByKey]] = previousValue[currentValue[groupByKey]] ?? []).push(currentValue);
    return previousValue;
  }, {});
};

// to be used as Helper function
const createMapByGroupKey = (arrayOfObject, groupByKey = 'resource_emp_id') => {
  const mapByKey = new Map();
  arrayOfObject.forEach((ele) => {
    const key = ele[groupByKey];
    const previousValue = mapByKey.get(key) ?? []; // check whether Map is undefined,else return empty array
    const getPreviousValueOrAddNew = [...previousValue, ele]; // add element and return array
    mapByKey.set(key, getPreviousValueOrAddNew);
  });
  return mapByKey;
};

const getSalaryRevisionDetailsForEmployeeForProjectCode = async (employeeIdsInArray, dates) => {
  /**
   @var {Array<Object>} SalaryRevisionDetailsForEmployee contains salaryRevision Details from db
   [{ resource_emp_id: '001',revision_start_date: '2022-08-24',revision_end_date: '2022-09-09',ctc: '222'},
   {resource_emp_id: '002', revision_start_date: '2022-09-10',revision_end_date: null,ctc: '89999'},]
   */
  const salaryRevisionDetailsForEmployee = await promReportsRepository.getEmployeeSalaryRevisionUnderProjectCode(
    employeeIdsInArray,
  );

  const createCustomMapByGroupKey = () => {
    const currentMonthEndDate = getCurrentMonthEndDate();
    const mapByKey = new Map();
    salaryRevisionDetailsForEmployee.forEach((ele) => {
      const key = ele.resource_emp_id;
      const previousValue = mapByKey.get(key) ?? []; // check whether Map is undefined,else return empty array

      // check whether revision_end_date is null, if null then make it current Month date, else return
      const element =
        ele.revision_end_date === null
          ? {
            ...ele,
            revision_end_date: dateAGreaterThanDateB(ele.revision_start_date, dates.end_date)
              ? getMonthEndDateFromNormalDate(ele.revision_start_date)
              : dates.end_date,
          }
          : ele;

      const getPreviousValueOrAddNew = [...previousValue, element]; // add element and return array
      // add above array to employee Id Key in Map
      mapByKey.set(key, getPreviousValueOrAddNew);
    });

    return mapByKey;
  };

  // create a Map By using employee id as Key and salary Revision Details(Array of Elements) as Value
  return createCustomMapByGroupKey(salaryRevisionDetailsForEmployee);
};

/**
 * @param {Map< key, Array<Object>>} salaryRevisionDetailsForEmployee contains employee's all salary Revision
 * Details in Array and Employee id as key.
 */
const divideSalaryRevisionAndAllocateCTCAcrossMonthsForAllEmployee = (salaryRevisionDetailsForEmployee) => {
  /**
   * iterate over the each key,value in Map and modified the main Map(salaryRevisionDetailsForEmployee)
   * to key as employee id and value as(another Map) of monthYear with corresponding CTC
   */
  for (const [mapKey, mapValueOfEmployeeSalaryRevision] of salaryRevisionDetailsForEmployee) {
    /**
   * @return from this @var employeeMonthlyAllocation below
   * @example
   * input :[
   *   {resource_emp_id: '001',revision_start_date: '2022-07-01',revision_end_date: '2022-08-31',ctc: '222',},
       {resource_emp_id: '001',revision_start_date: '2022-09-01',revision_end_date: '2022-11-30',ctc: '89999',},
      ];
   * output : [
          { monthYear: 'Jul-22', ctc: '222', resource_emp_id: '001' },
          { monthYear: 'Aug-22', ctc: '222', resource_emp_id: '001' },
          { monthYear: 'Sep-22', ctc: '89999', resource_emp_id: '001' },
          { monthYear: 'Oct-22', ctc: '89999', resource_emp_id: '001' },
          { monthYear: 'Nov-22', ctc: '89999', resource_emp_id: '001' }
          ]
   */
    const employeeMonthlyCTC = mapValueOfEmployeeSalaryRevision.reduce(
      (
        /**
         * {@link monthYearCTCArray} will contains all the employee month with corresponding ctc
         */
        monthYearCTCArray,
        { revision_start_date: start_date, revision_end_date: end_date, resource_emp_id, ctc },
      ) => {
        const monthYearInArray = getAllMonthsFromArrayOfDates([{ start_date, end_date }]).map((monthYear) => {
          return { monthYear: convertYearMonthToStringDate(monthYear), ctc, resource_emp_id };
        });

        return [...monthYearCTCArray, ...monthYearInArray];
      },
      [],
    );
    const mapOfEmployeeMonthlyCTC = new Map(employeeMonthlyCTC.map(({ ctc, monthYear }) => [monthYear, ctc]));
    salaryRevisionDetailsForEmployee.set(mapKey, mapOfEmployeeMonthlyCTC);
  }
  /**
   * {@link salaryRevisionDetailsForEmployee} is Map of key(employee id) and value as salaryRevision Array.
   * after the iteration from for Loop the value(salaryRevision Array Details) month wise Ctc is computed 
   * and replaced with below output(example):
   * {@link salaryRevisionDetailsForEmployee} @returns Map(2) {
      '0001' => Map(5) {'Jul-22' => '222','Aug-22' => '222', 'Sep-22' => '89999','Oct-22' => '89999'},
      '0002' => Map(11) {'Jun-22' => '222','Jul-22' => '222','Aug-22' => '88888','Sep-22' => '88888'}
      }
   */
  return salaryRevisionDetailsForEmployee;
};

const filterOutUnnecessaryMonthDetails = (sortedData, allMonthRequiredByUser) => {
  const monthYearKeysArrayFromObject = Object.keys(sortedData);

  const monthDataNotRequired = monthYearKeysArrayFromObject.filter((ele) => !allMonthRequiredByUser.includes(ele));

  monthDataNotRequired.forEach((deleteMonthYearData) => {
    delete sortedData[deleteMonthYearData];
  });
};

const calculateHighLevelCostUtilizationForProject = async (
  getHighLevelCostUtilizationData,
  costUtilizationRequest,
  projectCode,
  resourceFromDateAndToDate,
) => {
  // group the data by resource_emp_id
  const projectCostDataGroupByEmployeeId = groupByEmployeeId(getHighLevelCostUtilizationData);

  /**
  1. allocate the resource for employee for all months and assign the Highest allocation of all week for the Month
  2. allocating the Resource is same as resource Allocation but here little difference
     present ,refer getResourceUtilizationData function above
  3. example output for single employee(Element) in the Array
      => {
          employeeId: '500',
          employeeMonthlyAllocation: { 'Feb-22': 0.75, 'Mar-22': 0.7, 'Jan-22': 0.75 }
        },
*/
  const employeeDetailsWithAllocation = allocateCostForEachEmployee(projectCostDataGroupByEmployeeId);

  /**
   * @summary this @var salaryRevisionDetailsForEmployee contains all the Salary Revision Details for Employee
   * under the Project.salary of the employee varies across year.so salary allocation for month will be
   * calculated based employee salary at that particular time.
   */
  const salaryRevisionDetailsForEmployee = await getSalaryRevisionDetailsForEmployeeForProjectCode(
    Object.keys(projectCostDataGroupByEmployeeId), resourceFromDateAndToDate
  );
  const salaryRevisionDividedAcrossMonths = divideSalaryRevisionAndAllocateCTCAcrossMonthsForAllEmployee(
    salaryRevisionDetailsForEmployee,
  );
  // for every month in object perform salary Allocation.
  // formula = (allocation of the Employee for that Month) X (ctc of the Employee from salaryRevision / 12)
  const monthlyCostDetailsForSalary = calculateTotalSalaryPerMonthAllocation(
    employeeDetailsWithAllocation,
    salaryRevisionDividedAcrossMonths,
  );
  // get all expenses made for the project by using project_code
  const claimsForTheProjectPerMonth = await claimsRepository.getAllClaimsByProjectId(projectCode);
  // add expenses(ex:travel Expense ,food expenses) done in the particular month for the project.
  // condition: only add the Expense to month if it has approver date.
  // sample output: 'Jan-22': { salaryPerAllocation: 1650, 'Food Expense': 20500 }
  const monthlySalaryPlusExpenses = calculateExpensesForTheMonth(
    monthlyCostDetailsForSalary,
    claimsForTheProjectPerMonth,
  );
  // add the salaryPerAllocation and Expenses for all months
  // actualTotalCost = salaryPerAllocation + All the Expenses(Food ,travel)
  // sample output : 'Jan-22': { actualTotalCost: 22150 }
  const totalCost = calculateTotalCostFromSalaryAndExpenses(monthlySalaryPlusExpenses);

  // get all planned cost for the project from Database
  const plannedTotalCostForMonths =
    await promResourceResourceAllocationRepo.getProjectPlannedResourceAndPlannedCostByProjectId(projectCode);

  // add planned Cost to the month object to show actual cost of project and plannedCost of project
  // sample Output: 'Jan-22': { actualTotalCost: 22150, plannedCost: 7500 }
  const { actualAndPlannedTotalCostForMonths, noCostPlanInDatabaseForTheMonth } = addPlannedCostForTheMonth(
    totalCost,
    plannedTotalCostForMonths,
  );

  // all the Month required by the user
  // Ex: from Jan to Dec (send all months in a array for next function)
  const allMonthsInFilters = eachMonthYearInAndBetweenDates(
    convertYearMonthToDate(costUtilizationRequest.start_date),
    getMonthEndDateFromDate(costUtilizationRequest.end_date),
  );

  // the months data which are not present for project but selected by user are sent as zero Values
  // sample output : "Apr-22": { "actualTotalCost": 0,"plannedCost": 0 },
  // sample output if planedCost is present in database for particular month :"Apr-22":{
  //  "actualTotalCost":0,"plannedCost":2,}
  const addExtraMonthsAsZeroCost = addRemainingMonthsAsZeroCost(
    actualAndPlannedTotalCostForMonths, // this variable is calculated for available months data
    allMonthsInFilters, // all month name required for user
    plannedTotalCostForMonths, // planned cost for months from the database
  );

  // months are not in calender order ,so sort into Calender order
  const sortedCostData = sortInMonthYearOrder(addExtraMonthsAsZeroCost);

  // filter out extra months data which are coming due to overlapping rows from database.
  filterOutUnnecessaryMonthDetails(sortedCostData, allMonthsInFilters);

  const { grandTotalOfActualCost, grandTotalOfPlannedCost } =
    calculateGrandTotalOfAllMonthActualCostHighLevel(sortedCostData);

  // converting object of object to Array of Object ,for frontend requirement
  const dataInArrayOfObject = Object.entries(sortedCostData).map((obj) => ({ [obj[0]]: obj[1] }));

  return {
    highLevelData: dataInArrayOfObject,
    totalActualCost: parseFloat(parseFloat(grandTotalOfActualCost).toFixed(2)),
    totalPlannedCost: grandTotalOfPlannedCost,
    noCostPlanInDatabaseForTheMonth,
  };
};

const calculatedDetailLevelCostUtilizationData = async (
  detailedLevelData,
  costUtilizationRequest,
  projectCode,
  allExpensesName,
  resourceFromDateAndToDate,
) => {
  /**
   @inheritdoc {@link calculateHighLevelCostUtilizationForProject} calculateHighLevelCostUtilizationForProject
   function for explanation / comments as it same functionality.
   @description the difference between the high level data and detailed data is, In high level we are not showing
   expense types and their amount in frontend but we are processing it. In detailed level we just need to send those
   expense types to show in frontend, so in detailed level we have one or two extra step to sort expense type and send
   back to frontend.
   */
  const projectCostDataGroupedByEmployeeId = groupByEmployeeId(detailedLevelData);

  const employeeDetailsWithAllocation = allocateCostForEachEmployee(projectCostDataGroupedByEmployeeId);
  /**
   * @summary this @var salaryRevisionDetailsForEmployee contains all the Salary Revision Details for Employee
   * under the Project.salary of the employee varies across year.so salary allocation for month will be
   * calculated based employee salary at that particular time.
   */
  const salaryRevisionDetailsForEmployee = await getSalaryRevisionDetailsForEmployeeForProjectCode(
    Object.keys(projectCostDataGroupedByEmployeeId), resourceFromDateAndToDate
  );
  const salaryRevisionDividedAcrossMonths = divideSalaryRevisionAndAllocateCTCAcrossMonthsForAllEmployee(
    salaryRevisionDetailsForEmployee,
  );

  const monthlyCostDetailsForSalary = calculateTotalSalaryPerMonthAllocation(
    employeeDetailsWithAllocation,
    salaryRevisionDividedAcrossMonths,
  );

  const claimsForTheProjectPerMonth = await claimsRepository.getAllClaimsByProjectId(projectCode);

  const monthlySalaryPlusExpenses = calculateExpensesForTheMonth(
    monthlyCostDetailsForSalary,
    claimsForTheProjectPerMonth,
  );

  const monthlySalaryExpensesWithNonExpenses = initialRemainingExpenseToZeroCost(
    monthlySalaryPlusExpenses,
    allExpensesName,
  );

  const allMonthsInFilters = eachMonthYearInAndBetweenDates(
    convertYearMonthToDate(costUtilizationRequest.start_date),
    getMonthEndDateFromDate(costUtilizationRequest.end_date),
  );

  const addExtraMonthsAsZeroCost = addRemainingMonthsAsZeroCostDetailedLevel(
    monthlySalaryExpensesWithNonExpenses,
    allMonthsInFilters,
  );

  const plannedCostForEachMonth =
    await promResourceResourceAllocationRepo.getProjectPlannedResourceAndPlannedCostByProjectId(projectCode);

  const totalSumForAllExpensesAndSalary = calculateTheSumOfTheExpensesOfTheMonth(addExtraMonthsAsZeroCost);

  const sortedCostDetailedData = sortInMonthYearOrder(totalSumForAllExpensesAndSalary);

  const costSortedInMonthAndExpense = sortExpenseInOrder(sortedCostDetailedData, allExpensesName);

  // filter out extra months data which are coming due to overlapping rows from database.
  filterOutUnnecessaryMonthDetails(costSortedInMonthAndExpense, allMonthsInFilters);

  const grandTotalCostOfAllMonth = calculateGrandTotalOfAllMonthActualCostDetailedLevel(costSortedInMonthAndExpense);

  const { grandTotalOfPlannedCost, noCostPlanInDatabaseForTheMonth } = calculateGrandTotalOfPlannedCostOfAllMonths(
    costSortedInMonthAndExpense,
    plannedCostForEachMonth,
    monthlySalaryPlusExpenses, // this is used to exclude unnecessary month in noCostPlanForMonth array
  );

  // this is for frontEnd data.
  const dataInArrayOfObject = Object.entries(costSortedInMonthAndExpense).map((obj) => ({ [obj[0]]: obj[1] }));

  return {
    detailedLevelData: { dataInArrayOfObject, costSortedInMonthAndExpense },
    totalActualCost: grandTotalCostOfAllMonth,
    totalPlannedCost: grandTotalOfPlannedCost,
    noCostPlanInDatabaseForTheMonth,
  };
};

const calculateResourceUtilizationForProject = async (
  resourceAllocationDetailsForProject,
  fetchingDataRequest,
  projectCode,
) => {
  // get all the monthly planned cost data for this project_code
  const plannedResourceForProject =
    await promResourceResourceAllocationRepo.getProjectPlannedResourceAndPlannedCostByProjectId(projectCode);

  // main resource Data calculation is performed and allocated for each month which are from database
  const allocationForAllMonths = employeeAllocationGroupedByMonthYear(resourceAllocationDetailsForProject);

  // calculate Actual Resource By considering the Highest Allocation in Each Month and planned Resource for that Month.
  const actualAndPlannedResourcePerMonth = calculateActualAndPlanned(allocationForAllMonths, plannedResourceForProject);

  // create all the months required by user in a array
  const allMonthsFromFilters = eachMonthYearInAndBetweenDates(
    convertYearMonthToDate(fetchingDataRequest.start_date),
    getMonthEndDateFromDate(fetchingDataRequest.end_date),
  );

  // for all remaining months which no data is present in database to calculate the actual Resource
  // send those months as Zero i.e = { allocatedResource: 0, plannedResource: '0' }
  // if planned Resource is Present for that Particular Month then send with planned resource.
  const addExtraMonthsAsZeroResource = addRemainingMonthsAsZeroResources(
    actualAndPlannedResourcePerMonth,
    allMonthsFromFilters,
    plannedResourceForProject,
  );

  const sortedResourceData = sortInMonthYearOrder(addExtraMonthsAsZeroResource);

  filterOutUnnecessaryMonthDetails(sortedResourceData, allMonthsFromFilters);

  // converting from object of Object to Array of Object for frontend ease
  return Object.entries(sortedResourceData).map((obj) => ({ [obj[0]]: obj[1] }));
};

const getResourceUtilizationDataForProject = async (resourceUtilizationFilterRequest) => {
  // create a filter for project_code, project name and project_bu_name to fetch from project_details Table
  const projectFilterCondition = createFilterConditionForProjectSelection(resourceUtilizationFilterRequest);

  const resourceFromDateAndToDate = await getDatesFilterFromProjectData(resourceUtilizationFilterRequest);
  resourceFromDateAndToDate.start_date = resourceFromDateAndToDate.request.start_date;
  resourceFromDateAndToDate.end_date = resourceFromDateAndToDate.request.end_date;
  // get allocated resource using Date(month start to month End)
  const allResourceAllocationDetails = await promReportsRepository.getResourceUtilizationDataHighLevelProjectReports(
    projectFilterCondition,
    resourceFromDateAndToDate,
  );

  // if no data From database Return no content for this Project
  if (
    allResourceAllocationDetails.length === 0 ||
    !allResourceAllocationDetails.some((eachProject) => eachProject.promAvinResourceAllocation.length > 0) ||
    allResourceAllocationDetails == null
  ) {
    return [];
  }

  // if user didn't specify start_date and end_date then consider the earliest start_end and latest end_date
  // from all the project and use to show the result in frontEnd. else use user's start_date and end_date
  const requiredStartAndEndDateForUser = computeStartAndEndDateForUser(
    resourceUtilizationFilterRequest,
    allResourceAllocationDetails,
  );

  const allHighLevelResourceUtilizationDetails = await Promise.all(
    allResourceAllocationDetails.map(
      async ({
        project_code: projectCode,
        project_name: projectName,
        project_bu_name: projectBUName,
        promAvinResourceAllocation,
      }) => {
        const highLevelDetails = await calculateResourceUtilizationForProject(
          promAvinResourceAllocation,
          requiredStartAndEndDateForUser,
          projectCode,
        );
        return { projectCode, projectName, projectBUName, highLevelDetails };
      },
    ),
  );

  return allHighLevelResourceUtilizationDetails;
};

/**
 * @description to get all project(from database) cost utilization(high level) data.
 * @param {Object} costUtilizationRequest contains incoming user request input
 * such as start_date and end_date.
 * @returns Array of Object containing(cost utilization) data for each project.
 */
const getHighLevelCostUtilizationForProject = async (costUtilizationRequest) => {
  const resourceFromDateAndToDate = await getDatesFilterFromProjectData(costUtilizationRequest);
  resourceFromDateAndToDate.start_date = resourceFromDateAndToDate.request.start_date;
  resourceFromDateAndToDate.end_date = resourceFromDateAndToDate.request.end_date;

  // create a filter for project_code, project name and project_bu_name to fetch from project_details Table
  const projectFilterCondition = createFilterConditionForProjectSelection(costUtilizationRequest);

  // fetch raw data for processing from database
  // const getAllProjectCostUtilizationData = await promReportsRepository.getResourceAllocationForCostUtilization(
  const getAllProjectCostUtilizationData = await promReportsRepository.getResourceAllocationForCostUtilization(
    resourceFromDateAndToDate,
    projectFilterCondition,
  );

  if (getAllProjectCostUtilizationData.length === 0 || getAllProjectCostUtilizationData == null) {
    return [];
  }

  // if user didn't specify start_date and end_date then consider the earliest start_end and latest end_date
  // from all the project and use to show the result in frontEnd. else use user's start_date and end_date
  const requiredStartAndEndDateForUser = computeStartAndEndDateForUser(
    costUtilizationRequest,
    getAllProjectCostUtilizationData,
  );

  const allProjectHighLevelDetails = await Promise.all(
    getAllProjectCostUtilizationData.map(
      async ({
        project_code: projectCode,
        project_name: projectName,
        project_bu_name: projectBUName,
        promAvinResourceAllocation,
      }) => {
        /**
         * main cost utilization logic performed when @fires @function calculateHighLevelCostUtilizationForProject()
         * {@link calculateHighLevelCostUtilizationForProject} takes independent project data, performs cost utilization
         * logic on the particular project and returns necessary data
         */
        const { highLevelData, totalActualCost, totalPlannedCost, noCostPlanInDatabaseForTheMonth } =
          await calculateHighLevelCostUtilizationForProject(
            promAvinResourceAllocation,
            requiredStartAndEndDateForUser, // this considers earliest start_date and latest end_date from all projects
            projectCode,
            resourceFromDateAndToDate
          );
        return {
          projectCode,
          projectName,
          projectBUName,
          totalPlannedCost,
          totalActualCost,
          highLevelData,
          noCostPlanInDatabaseForTheMonth,
        };
      },
    ),
  );

  const [noCostPlanProjectNames, noCostPlanProjectDetails] = allProjectHighLevelDetails.reduce(
    ([noCostProjectName, noCostPlanProjectDetail], { noCostPlanInDatabaseForTheMonth, projectCode, projectName }) => {
      if (noCostPlanInDatabaseForTheMonth.length > 0) {
        noCostProjectName.push(projectName);
        noCostPlanProjectDetail.push({ projectCode, projectName, noCostPlanInDatabaseForTheMonth });
      }
      return [noCostProjectName, noCostPlanProjectDetail];
    },
    [[], []],
  );

  // noCostPlanInDatabaseForTheMonth is Not required in Frontend as it dynamically showing
  const removedNoCostDataFromOutput = allProjectHighLevelDetails.map(
    ({ noCostPlanInDatabaseForTheMonth, ...restOfData }) => restOfData,
  );

  const checkTotalAndPlannedCost = allProjectHighLevelDetails.filter(
    (obj) => obj.totalPlannedCost === 0 && obj.totalActualCost === 0,
  );
  if (checkTotalAndPlannedCost.length === allProjectHighLevelDetails.length) {
    return [];
  } else {
    return {
      highLevelData: removedNoCostDataFromOutput,
      noCostPlanProjectNames,
      noCostPlanProjectDetails,
      allProjectHighLevelDetails,
    };
  }
};

/**
 * @description get project cost utilization(detailed level) data.
 * @param {Object} costUtilizationRequest contains incoming user request input
 * such as start_date and end_date.
 * @returns Array of Object containing(cost utilization) data for each project.
 */
const getDetailedLevelCostUtilizationForProject = async (costUtilizationRequest) => {
  const resourceFromDateAndToDate = await getDatesFilterFromProjectData(costUtilizationRequest);
  resourceFromDateAndToDate.start_date = resourceFromDateAndToDate.request.start_date;
  resourceFromDateAndToDate.end_date = resourceFromDateAndToDate.request.end_date;

  // create a filter for project_code, project name and project_bu_name to fetch from project_details Table
  const projectFilterCondition = createFilterConditionForProjectSelection(costUtilizationRequest);

  // fetch raw data for processing from database
  const getAllProjectCostUtilizationData = await promReportsRepository.getResourceAllocationForCostUtilization(
    resourceFromDateAndToDate,
    projectFilterCondition,
  );

  // if no database from database then return empty array
  if (
    getAllProjectCostUtilizationData.length === 0 ||
    !getAllProjectCostUtilizationData.some((eachProject) => eachProject.promAvinResourceAllocation.length > 0) ||
    getAllProjectCostUtilizationData == null
  ) {
    return [];
  }
  // if user didn't specify start_date and end_date then consider the earliest start_end and latest end_date
  // from all the project and use to show the result in frontEnd. else use user's start_date and end_date
  const requiredStartAndEndDateForUser = computeStartAndEndDateForUser(
    costUtilizationRequest,
    getAllProjectCostUtilizationData,
  );
  // all Expenses Name will be used in All project expallExpensesNameense details calculation.so fetch it before processing any details
  // and pass it to individual project calculation.
  const allExpensesName = await claimsRepository.fetchAllExpenseTypeData();
  const allProjectDetailedLevel = await Promise.all(
    getAllProjectCostUtilizationData.map(
      async ({
        project_code: projectCode,
        project_name: projectName,
        project_bu_name: projectBUName,
        project_start_date,
        po_ro_sow_value,
        promAvinResourceAllocation,
      }) => {
        /**
         * main cost utilization logic performed when @fires @function calculatedDetailLevelCostUtilizationData()
         * {@link calculatedDetailLevelCostUtilizationData} takes independent project data, performs cost utilization
         * logic on the particular project and returns necessary data
         */
        const { detailedLevelData, totalActualCost, totalPlannedCost, noCostPlanInDatabaseForTheMonth } =
          await calculatedDetailLevelCostUtilizationData(
            promAvinResourceAllocation,
            requiredStartAndEndDateForUser,
            projectCode,
            allExpensesName,
            resourceFromDateAndToDate,
          );
        return {
          projectCode,
          projectName,
          projectBUName,
          totalPlannedCost,
          totalActualCost,
          detailedLevelData,
          project_start_date,
          po_ro_sow_value,
          noCostPlanInDatabaseForTheMonth,
        };
      },
    ),
  );
  const [noCostPlanProjectNames, noCostPlanProjectDetails] = allProjectDetailedLevel.reduce(
    ([noCostProjectName, noCostPlanProjectDetail], { noCostPlanInDatabaseForTheMonth, projectCode, projectName }) => {
      if (noCostPlanInDatabaseForTheMonth.length > 0) {
        noCostProjectName.push(projectName);
        noCostPlanProjectDetail.push({ projectCode, projectName, noCostPlanInDatabaseForTheMonth });
      }
      return [noCostProjectName, noCostPlanProjectDetail];
    },
    [[], []],
  );
  const removedNoCostDataFromOutput = allProjectDetailedLevel.map(
    ({ noCostPlanInDatabaseForTheMonth, ...restOfData }) => restOfData,
  );
  return {
    projectDetailedLevel: removedNoCostDataFromOutput,
    noCostPlanProjectDetails,
    noCostPlanProjectNames,
    allProjectDetailedLevel,
    resourceFromDateAndToDate,
  };
};
// check for reusable
const getDatesFilterForGenericData = async (request) => {
  if (request.date !== '') {
    const getFullDateData = getFullDate(request.date, request.date);
    request.start_date = getFullDateData.newStartDate;
    request.end_date = getFullDateData.newEndDate;
  } else {
    const getMaxStartDate = await getMaxProjectStartDateForgeneric(request);
    request.start_date = formatToLocalTime(getMaxStartDate.project_start_date);
    request.end_date = getPreviousMonthDatesFromCurrentDate();
  }
  const allRequestedMonths = dateRange(request.start_date, request.end_date);
  const requestedMonths = allRequestedMonths.map((monthNum) => monthNum.slice(0, -3));
  return { request, requestedMonths };
};

// check for resuable
const getDetailedLevelCostUtilizationForProjectForGeneric = async (costUtilizationRequest) => {
  const resourceFromDateAndToDate = await getDatesFilterForGenericData(costUtilizationRequest);
  resourceFromDateAndToDate.start_date = resourceFromDateAndToDate.request.start_date;
  resourceFromDateAndToDate.end_date = resourceFromDateAndToDate.request.end_date;

  // create a filter for project_code, project name and project_bu_name to fetch from project_details Table
  const projectFilterCondition = createFilterConditionForProjectSelection(costUtilizationRequest);

  // fetch raw data for processing from database
  const getAllProjectCostUtilizationData = await promReportsRepository.getResourceAllocationForCostUtilization(
    resourceFromDateAndToDate,
    projectFilterCondition,
  );

  // if no database from database then return empty array
  if (
    getAllProjectCostUtilizationData.length === 0 ||
    !getAllProjectCostUtilizationData.some((eachProject) => eachProject.promAvinResourceAllocation.length > 0) ||
    getAllProjectCostUtilizationData == null
  ) {
    return [];
  }

  // if user didn't specify start_date and end_date then consider the earliest start_end and latest end_date
  // from all the project and use to show the result in frontEnd. else use user's start_date and end_date
  const requiredStartAndEndDateForUser = computeStartAndEndDateForUser(
    costUtilizationRequest,
    getAllProjectCostUtilizationData,
  );

  // all Expenses Name will be used in All project expense details calculation.so fetch it before processing any details
  // and pass it to individual project calculation.
  const allExpensesName = await claimsRepository.fetchAllExpenseTypeData();

  const allProjectDetailedLevel = await Promise.all(
    getAllProjectCostUtilizationData.map(
      async ({
        project_code: projectCode,
        project_name: projectName,
        project_bu_name: projectBUName,
        project_start_date,
        po_ro_sow_value,
        promAvinResourceAllocation,
      }) => {
        /**
         * main cost utilization logic performed when @fires @function calculatedDetailLevelCostUtilizationData()
         * {@link calculatedDetailLevelCostUtilizationData} takes independent project data, performs cost utilization
         * logic on the particular project and returns necessary data
         */
        const { detailedLevelData, totalActualCost, totalPlannedCost, noCostPlanInDatabaseForTheMonth } =
          await calculatedDetailLevelCostUtilizationData(
            promAvinResourceAllocation,
            requiredStartAndEndDateForUser,
            projectCode,
            allExpensesName,
            resourceFromDateAndToDate
          );

        return {
          projectCode,
          projectName,
          projectBUName,
          totalPlannedCost,
          totalActualCost,
          detailedLevelData,
          project_start_date,
          po_ro_sow_value,
          noCostPlanInDatabaseForTheMonth,
        };
      },
    ),
  );
  const [noCostPlanProjectNames, noCostPlanProjectDetails] = allProjectDetailedLevel.reduce(
    ([noCostProjectName, noCostPlanProjectDetail], { noCostPlanInDatabaseForTheMonth, projectCode, projectName }) => {
      if (noCostPlanInDatabaseForTheMonth.length > 0) {
        noCostProjectName.push(projectName);
        noCostPlanProjectDetail.push({ projectCode, projectName, noCostPlanInDatabaseForTheMonth });
      }
      return [noCostProjectName, noCostPlanProjectDetail];
    },
    [[], []],
  );

  const removedNoCostDataFromOutput = allProjectDetailedLevel.map(
    ({ noCostPlanInDatabaseForTheMonth, ...restOfData }) => restOfData,
  );

  return {
    projectDetailedLevel: removedNoCostDataFromOutput,
    noCostPlanProjectDetails,
    noCostPlanProjectNames,
    allProjectDetailedLevel,
    resourceFromDateAndToDate,
  };
};

// get project revenue reports for selection of all projects,start date and end date
const getProjRevenue = async (request) => {
  const getDatesInfo = await getDatesFilterFromProjectData(request);
  const getProjectRevenue = await projectRepo.getProjectRevenue(getDatesInfo.request, getDatesInfo.requestedMonths);
  const totalRevenueArr = [];
  getProjectRevenue.flatMap((projectMonthWiseRevenue) => {
    const totalActualRevenue = projectMonthWiseRevenue.promAvinProjectOperationData.reduce(
      (total, obj) => parseFloat(obj.revenue) + parseFloat(total),
      0,
    );
    const projWiseRevenueObj = {
      projectCode: projectMonthWiseRevenue.project_code,
      projectName: projectMonthWiseRevenue.project_name,
      projectBUName: projectMonthWiseRevenue.project_bu_name,
      totalActualRevenue,
    };
    projWiseRevenueObj.totalActualRevenue = totalActualRevenue.toFixed(2);
    const monthWiseTableData = [];
    getDatesInfo.requestedMonths.flatMap((getformat) => {
      const getMonthlyResourceCostPlannedData =
        projectMonthWiseRevenue.promAvinProjectOperationData.find((el) => el.revenue_date === getformat) || 0;
      const actualRevenue = getMonthlyResourceCostPlannedData === 0 ? 0 : getMonthlyResourceCostPlannedData.revenue;
      const getPlannedRevenue = dayjs(getformat).isBetween(
        projectMonthWiseRevenue.project_start_date,
        projectMonthWiseRevenue.project_end_date,
        null,
        '[]',
      );
      const plannedRevenue = getPlannedRevenue === true ? parseFloat(projectMonthWiseRevenue.po_ro_sow_value).toFixed(2) : 0;
      monthWiseTableData.push({
        [getformat]: { actualRevenue, plannedRevenue },
      });
      const totalPlannedRevenue = monthWiseTableData.reduce(
        (total, entry) => total + parseFloat(entry[Object.keys(entry)[0]].plannedRevenue),
        0
      );
      projWiseRevenueObj.totalPlannedRevenue = totalPlannedRevenue.toFixed(2);
      projWiseRevenueObj.totalPlannedRevenue = totalPlannedRevenue === 0 ? 0 : parseFloat(totalPlannedRevenue).toFixed(2);;
      projWiseRevenueObj.monthWiseTableData = monthWiseTableData;
    });
    return totalRevenueArr.push(projWiseRevenueObj);
  });
  return totalRevenueArr;
};

const getProjRevenueOld = async (request) => {
  const getDatesInfo = await getDatesFilterFromProjectData(request);
  const getProjectRevenue = await projectRepo.getProjectRevenue(getDatesInfo.request, getDatesInfo.requestedMonths);
  const totalRevenueArr = [];
  getProjectRevenue.flatMap((projectMonthWiseRevenue) => {
    const totalRevenue = projectMonthWiseRevenue.promAvinProjectOperationData.reduce(
      (total, obj) => parseFloat(obj.revenue) + parseFloat(total),
      0,
    );
    const projWiseRevenueObj = {
      projectCode: projectMonthWiseRevenue.project_code,
      projectName: projectMonthWiseRevenue.project_name,
      projectBUName: projectMonthWiseRevenue.project_bu_name,
      totalRevenue,
    };
    getDatesInfo.requestedMonths.flatMap((getformat) => {
      const getMonthlyResourceCostPlannedData =
        projectMonthWiseRevenue.promAvinProjectOperationData.find((el) => el.revenue_date === getformat) || 0;
      const actualRevenue = getMonthlyResourceCostPlannedData === 0 ? 0 : getMonthlyResourceCostPlannedData.revenue;

      const getPlannedRevenue = dayjs(getformat).isBetween(el.project_start_date, el.project_end_date, null, '[]');
      const totalPlannedRevenue = getPlannedRevenue.reduce(
        (total, obj) => parseFloat(obj.po_ro_sow_value) + parseFloat(total),
        0,
      );
      const plannedRevenue = getPlannedRevenue === true ? projectMonthWiseRevenue.po_ro_sow_value : 0;
      projWiseRevenueObj.push({
        [getformat]: { actualRevenue, plannedRevenue },
      });

      // projWiseRevenueObj[getformat] = revenue;
    });
    return totalRevenueArr.push(projWiseRevenueObj);
  });
  return totalRevenueArr;
};

const filterMonthOverlappingAllocation = (
  monthName,

  arrayOfAllocationDetails,
) => {
  const overlappingMonthAllocation = arrayOfAllocationDetails.flatMap((element) => {
    const filteredArray = element.promAvinResourceAllocation.filter((ele) => {
      const isMonthOverLapping = checkMonthOverLapBetweenDate(monthName, monthName, ele.start_date, ele.end_date);
      return isMonthOverLapping;
    });
    return filteredArray;
  });

  const totalAllocationAndBillable = {
    month: monthName,
    allocation: 0.0,
    billable_resource: 0.0,
  };

  overlappingMonthAllocation.forEach((ele) => {
    totalAllocationAndBillable.billable_resource += parseFloat(ele.billable_resource);
    totalAllocationAndBillable.allocation += parseFloat(ele.allocation);
  });

  return {
    month: totalAllocationAndBillable.month,
    allocation: parseFloat(totalAllocationAndBillable.allocation.toFixed(2)),
    billable_resource: parseFloat(totalAllocationAndBillable.billable_resource.toFixed(2)),
  };
};

const filterMonthOverlappingAllocationResource = (monthName, arrayOfAllocationDetails) => {
  const filteredArray = arrayOfAllocationDetails.filter((ele) => {
    const isMonthOverLapping = checkMonthOverLapBetweenDate(monthName, monthName, ele.start_date, ele.end_date);
    return isMonthOverLapping;
  });

  const totalAllocationAndBillable = {
    month: monthName,
    allocation: 0.0,
    billable_resource: 0.0,
  };

  filteredArray.forEach((ele) => {
    totalAllocationAndBillable.billable_resource += parseFloat(ele.billable_resource);
    totalAllocationAndBillable.allocation += parseFloat(ele.allocation);
  });
  return {
    month: totalAllocationAndBillable.month,
    allocation: parseFloat(totalAllocationAndBillable.allocation.toFixed(2)),
    billable_resource: parseFloat(totalAllocationAndBillable.billable_resource.toFixed(2)),
  };
};

const getMonthlyPlannedResource = (
  requestedMonths,
  promAvinProjectResourceAndCostPlan,
  promAvinResourceAllocation,
  allProjectDetailedLevel,
  project_code,
) => {
  const allMonthsData = [];
  let cumulativeActualCost = 0;
  requestedMonths.forEach((getformat) => {
    const monthlyObj = {};
    const getMonthlyPlannedResourceCost =
      promAvinProjectResourceAndCostPlan.find((el) => el.month_year === getformat) || 0;
    const monthWiseResourceCostObj = {
      plannedResourceLoading: getMonthlyPlannedResourceCost === 0 ? 0 : getMonthlyPlannedResourceCost.planned_resource,
      plannedResourceCost: getMonthlyPlannedResourceCost === 0 ? 0 : getMonthlyPlannedResourceCost.planned_cost,
    };
    const allocationMonthData = filterMonthOverlappingAllocationResource(getformat, promAvinResourceAllocation);
    monthWiseResourceCostObj.actualResourceLoading = allocationMonthData.allocation === 0 ? 0 : allocationMonthData.allocation.toFixed(2);
    monthWiseResourceCostObj.actualCost = allocationMonthData.allocation;
    allProjectDetailedLevel.flatMap((element) => {
      if (element.projectCode === project_code) {
        const getActualCost = element.detailedLevelData.costSortedInMonthAndExpense;
        const checkMonth = Object.keys(getActualCost).find(
          (key) => getNumericYearMonthFromStringDate(key) === getformat,
        );
        monthWiseResourceCostObj.actualCost = getActualCost[checkMonth].Total;
        cumulativeActualCost += parseFloat(monthWiseResourceCostObj.actualCost);
        monthWiseResourceCostObj.diffInCost = parseFloat(
          monthWiseResourceCostObj.plannedResourceCost - getActualCost[checkMonth].Total,
        ).toFixed(2);
      }
    });
    monthWiseResourceCostObj.cumulativeActualCost = cumulativeActualCost.toFixed(2);
    monthlyObj[getformat] = monthWiseResourceCostObj;
    allMonthsData.push(monthlyObj);
  });

  return allMonthsData;
};

const getResourceCostUtilization = async (request) => {
  const getActualCostInfo = await getDetailedLevelCostUtilizationForProject(request);
  if (getActualCostInfo.length === 0 || getActualCostInfo === undefined) {
    throw new Error('No ResourceAllocation', { cause: 'No Resource allocated for requested group || project' });
  }

  const getActualCost = getActualCostInfo.projectDetailedLevel;
  const totalOutput = [];
  const noCostPlan = [];
  const getDatesInfo = getDatesFilter(request, getActualCost);
  getDatesInfo.request.start_date = getActualCostInfo.resourceFromDateAndToDate.start_date;
  getDatesInfo.request.end_date = getActualCostInfo.resourceFromDateAndToDate.end_date;
  const getResourceCostInfo = await projectRepo.getResourceandCostUtilization(
    getDatesInfo.request,
    getDatesInfo.requestedMonths,
  );
  getResourceCostInfo.forEach((resourceInfo) => {
    const projWiseResourceCostObj = {
      projectCode: resourceInfo.project_code,
      projectName: resourceInfo.project_name,
      projectBUName: resourceInfo.project_bu_name,
    };
    const getMonthlyPlannedResourceData = getMonthlyPlannedResource(
      getDatesInfo.requestedMonths,
      resourceInfo.promAvinProjectResourceAndCostPlan,
      resourceInfo.promAvinResourceAllocation,
      getActualCostInfo.allProjectDetailedLevel,
      resourceInfo.project_code,
    );
    projWiseResourceCostObj.monthWiseData = getMonthlyPlannedResourceData;
    projWiseResourceCostObj.monthWiseData = getMonthlyPlannedResourceData;
    totalOutput.push(projWiseResourceCostObj);
  });
  return { totalOutput, noCostPlan };
};

const getProjWiseTotalRevenue = (totalRevenue) => {
  return Array.from(
    totalRevenue.reduce(
      (m, { project_code, revenue }) => m.set(project_code, (m.get(project_code) || 0) + Number(revenue)),
      new Map(),
    ),
    ([project_code, revenue]) => ({ project_code, revenue }),
  );
};
const getMonthlyTotalRevenue = (project_code, getProjWiseTotalRevenueData) => {
  const getTotalRevenue = getProjWiseTotalRevenueData.find((el) => el.project_code === project_code) || 0;
  return getTotalRevenue.revenue;
};

const getDetailedLevelCostUtilizationForContribution = async (costUtilizationRequest) => {
  const resourceFromDateAndToDate = await getDatesFilterFromProjectData(costUtilizationRequest);
  resourceFromDateAndToDate.start_date = resourceFromDateAndToDate.request.start_date;
  resourceFromDateAndToDate.end_date = resourceFromDateAndToDate.request.end_date;
  // create a filter for project_code, project name and project_bu_name to fetch from project_details Table
  const projectFilterCondition = createFilterConditionForProjectSelection(costUtilizationRequest);

  // fetch raw data for processing from database
  const getAllProjectCostUtilizationData = await promReportsRepository.getResourceAllocationForCostUtilization(
    resourceFromDateAndToDate,
    projectFilterCondition,
  );

  // if no database from database then return empty array
  if (
    getAllProjectCostUtilizationData.length === 0 ||
    !getAllProjectCostUtilizationData.some((eachProject) => eachProject.promAvinResourceAllocation.length > 0) ||
    getAllProjectCostUtilizationData == null
  ) {
    return [];
  }

  // if user didn't specify start_date and end_date then consider the earliest start_end and latest end_date
  // from all the project and use to show the result in frontEnd. else use user's start_date and end_date
  const requiredStartAndEndDateForUser = computeStartAndEndDateForUser(
    costUtilizationRequest,
    getAllProjectCostUtilizationData,
  );

  // all Expenses Name will be used in All project expense details calculation.so fetch it before processing any details
  // and pass it to individual project calculation.
  const allExpensesName = await claimsRepository.fetchAllExpenseTypeData();

  const allProjectDetailedLevel = await Promise.all(
    getAllProjectCostUtilizationData.map(
      async ({
        project_code: projectCode,
        project_name: projectName,
        project_bu_name: projectBUName,
        project_start_date,
        po_ro_sow_value,
        promAvinResourceAllocation,
      }) => {
        /**
         * main cost utilization logic performed when @fires @function calculatedDetailLevelCostUtilizationData()
         * {@link calculatedDetailLevelCostUtilizationData} takes independent project data, performs cost utilization
         * logic on the particular project and returns necessary data
         */
        const { detailedLevelData, totalActualCost, totalPlannedCost, noCostPlanInDatabaseForTheMonth } =
          await calculatedDetailLevelCostUtilizationData(
            promAvinResourceAllocation,
            requiredStartAndEndDateForUser,
            projectCode,
            allExpensesName,
            resourceFromDateAndToDate
          );

        return {
          projectCode,
          projectName,
          projectBUName,
          totalPlannedCost,
          totalActualCost,
          detailedLevelData,
          project_start_date,
          po_ro_sow_value,
          noCostPlanInDatabaseForTheMonth,
        };
      },
    ),
  );
  const [noCostPlanProjectNames, noCostPlanProjectDetails] = allProjectDetailedLevel.reduce(
    ([noCostProjectName, noCostPlanProjectDetail], { noCostPlanInDatabaseForTheMonth, projectCode, projectName }) => {
      if (noCostPlanInDatabaseForTheMonth.length > 0) {
        noCostProjectName.push(projectName);
        noCostPlanProjectDetail.push({ projectCode, projectName, noCostPlanInDatabaseForTheMonth });
      }
      return [noCostProjectName, noCostPlanProjectDetail];
    },
    [[], []],
  );

  const removedNoCostDataFromOutput = allProjectDetailedLevel.map(
    ({ noCostPlanInDatabaseForTheMonth, ...restOfData }) => restOfData,
  );

  return {
    projectDetailedLevel: removedNoCostDataFromOutput,
    noCostPlanProjectDetails,
    noCostPlanProjectNames,
    allProjectDetailedLevel,
    resourceFromDateAndToDate,
  };
};

// get project wise contribution reports
const getProjContribution = async (request) => {
  const contributionArr = [];
  const getActualCostInfo = await getDetailedLevelCostUtilizationForContribution(request);
  if (getActualCostInfo.length === 0 || getActualCostInfo === undefined) {
    throw new Error('No ResourceAllocation', { cause: 'No Resource allocated for requested group || project' });
  }
  const getActualCost = getActualCostInfo.projectDetailedLevel;

  const getDatesInfo = getDatesFilter(request, getActualCost);
  getDatesInfo.request.start_date = getActualCostInfo.resourceFromDateAndToDate.start_date;
  getDatesInfo.request.end_date = getActualCostInfo.resourceFromDateAndToDate.end_date;

  getDatesInfo.request.project_code = getActualCost.map((ele) => ele.projectCode);
  const totalRevenue = await promReportsRepository.getTotalRevenueByProj(getDatesInfo);
  const getProjWiseTotalRevenueData = getProjWiseTotalRevenue(totalRevenue);
  const contributionObj = {
    datesObj: {
      start_date: getDatesInfo.request.start_date,
      end_date: getDatesInfo.request.end_date,
    },
  };
  await Promise.all(
    getActualCost.map(async (projData) => {
      const totalRevenueData = getMonthlyTotalRevenue(projData.projectCode, getProjWiseTotalRevenueData);
      const revenueSum = totalRevenueData === undefined ? 0 : totalRevenueData;
      // need to check whether it is total planned cost and total actual cost or only planned and actual cost
      if (!Array.isArray(request.project_bu_name)) {
        contributionArr.push({
          project_code: projData.projectCode,
          project_name: projData.projectName,
          project_bu_name: projData.projectBUName,
          po_ro_sow_value: projData.po_ro_sow_value,
          totalRevenue: parseFloat(revenueSum).toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            style: 'currency',
            currency: 'INR',
          }),
          totalPlannedCost: parseFloat(projData.totalPlannedCost).toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            style: 'currency',
            currency: 'INR',
          }),
          totalActualCost: parseFloat(projData.totalActualCost).toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            style: 'currency',
            currency: 'INR',
          }),
          contributionInvaluebasedonRevenue: (
            parseFloat(projData.totalActualCost) - parseFloat(revenueSum)
          ).toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            style: 'currency',
            currency: 'INR',
          }),
          contributionInpercentbasedonRevenue: isNaN(
            (parseFloat(revenueSum) / (parseFloat(projData.totalActualCost) - parseFloat(revenueSum))) * 100,
          )
            ? 0
            : (
              (parseFloat(revenueSum) / (parseFloat(projData.totalActualCost) - parseFloat(revenueSum))) *
              100
            ).toFixed(2),
          contributionInvaluebasedonplannedcost: (
            parseFloat(projData.totalPlannedCost) - parseFloat(projData.totalActualCost)
          )
            .toFixed(2)
            .toLocaleString('en-IN', {
              maximumFractionDigits: 2,
              style: 'currency',
              currency: 'INR',
            }),
          contributionInpercentbasedonplannedcost: isNaN(
            (projData.totalPlannedCost / (projData.totalPlannedCost - projData.totalActualCost)) * 100,
          )
            ? 0
            : ((projData.totalPlannedCost / (projData.totalPlannedCost - projData.totalActualCost)) * 100).toFixed(2),

          contributionInvaluebasedonPOorSOW: (projData.po_ro_sow_value - projData.totalActualCost).toFixed(2),

          contributionInPercentbasedonPOorSOW: isNaN(
            (projData.po_ro_sow_value / (projData.po_ro_sow_value - projData.totalActualCost)) * 100,
          )
            ? 0
            : ((projData.po_ro_sow_value / (projData.po_ro_sow_value - projData.totalActualCost)) * 100).toFixed(2),
        });
      } else {
        contributionArr.push({
          project_name: projData.projectName,
          project_code: projData.projectCode,
          project_bu_name: projData.projectBUName,
          totalRevenue: revenueSum,
          totalPlannedCost: projData.totalPlannedCost,
          totalActualCost: projData.totalActualCost,
          contributionInvaluebasedonRevenue: projData.totalActualCost - revenueSum,
          contributionInpercentbasedonRevenue: isNaN((revenueSum / (projData.totalActualCost - revenueSum)) * 100)
            ? 0
            : (
              (parseFloat(revenueSum) / (parseFloat(projData.totalActualCost) - parseFloat(revenueSum))) *
              100
            ).toFixed(2),
          contributionInvaluebasedonplannedcost: (projData.totalPlannedCost - projData.totalActualCost).toFixed(2),
          contributionInpercentbasedonplannedcost: isNaN(
            (projData.totalPlannedCost / (projData.totalPlannedCost - projData.totalActualCost)) * 100,
          )
            ? 0
            : ((projData.totalPlannedCost / (projData.totalPlannedCost - projData.totalActualCost)) * 100).toFixed(2),

        });
      }
    }),
  );

  // group contibution reports data
  if (Array.isArray(request.project_bu_name)) {
    const summationOfContributionValue = (arrayOfData) => {
      const groupNameMap = new Map(
        arrayOfData.map(({ project_bu_name, totalRevenue }) => [
          project_bu_name,
          {
            totalRevenue: 0,
            totalPlannedCost: 0,
            totalActualCost: 0,
            contributionInvaluebasedonRevenue: 0,
            contributionInpercentbasedonRevenue: 0,
            contributionInvaluebasedonplannedcost: 0,
            contributionInpercentbasedonplannedcost: 0,
          },
        ]),
      );

      for (const { project_bu_name: key, ...value } of arrayOfData) {
        const getMapKeyData = groupNameMap.get(key);

        getMapKeyData.contributionInpercentbasedonRevenue =
          parseFloat(getMapKeyData.contributionInpercentbasedonRevenue) +
          parseFloat(value.contributionInpercentbasedonRevenue);
        getMapKeyData.contributionInpercentbasedonplannedcost =
          parseFloat(getMapKeyData.contributionInpercentbasedonplannedcost) +
          parseFloat(value.contributionInpercentbasedonplannedcost);
        getMapKeyData.contributionInvaluebasedonRevenue =
          parseFloat(getMapKeyData.contributionInvaluebasedonRevenue) +
          parseFloat(value.contributionInvaluebasedonRevenue);

        getMapKeyData.contributionInvaluebasedonplannedcost =
          parseFloat(getMapKeyData.contributionInvaluebasedonplannedcost) +
          parseFloat(value.contributionInvaluebasedonplannedcost);
        getMapKeyData.totalActualCost = parseFloat(getMapKeyData.totalActualCost) + parseFloat(value.totalActualCost);
        getMapKeyData.totalPlannedCost =
          parseFloat(getMapKeyData.totalPlannedCost) + parseFloat(value.totalPlannedCost);
        getMapKeyData.totalRevenue = parseFloat(
          parseFloat(getMapKeyData.totalRevenue) + parseFloat(value.totalRevenue),
        );
        groupNameMap.set(key, getMapKeyData);
      }

      return [...groupNameMap].map((ele) => {
        return {
          project_bu_name: ele[0],
          totalRevenue: ele[1].totalRevenue.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            style: 'currency',
            currency: 'INR',
          }),
          totalPlannedCost: ele[1].totalPlannedCost.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            style: 'currency',
            currency: 'INR',
          }),
          totalActualCost: ele[1].totalActualCost.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            style: 'currency',
            currency: 'INR',
          }),
          contributionInvaluebasedonRevenue: ele[1].contributionInvaluebasedonRevenue.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            style: 'currency',
            currency: 'INR',
          }),
          contributionInpercentbasedonRevenue: isNaN(
            (ele[1].totalRevenue / (ele[1].totalActualCost - ele[1].totalRevenue)) * 100,
          )
            ? 0
            : ((ele[1].totalRevenue / (ele[1].totalActualCost - ele[1].totalRevenue)) * 100).toFixed(2),

          contributionInvaluebasedonplannedcost: ele[1].contributionInvaluebasedonplannedcost.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            style: 'currency',
            currency: 'INR',
          }),
          contributionInpercentbasedonplannedcost: isNaN(
            (ele[1].totalPlannedCost / (ele[1].totalPlannedCost - ele[1].totalActualCost)) * 100,
          )
            ? 0
            : ((ele[1].totalPlannedCost / (ele[1].totalPlannedCost - ele[1].totalActualCost)) * 100).toFixed(2),
        };
      });
    };

    const result = summationOfContributionValue(contributionArr);

    contributionObj.contributionArr = result;

    return contributionObj;
  }
  contributionObj.contributionArr = contributionArr;

  return contributionObj;
};

const getClaimsByStatus = async (request) => {
  if (request.date !== '') {
    const getFullDates = getFullDate(request.date, request.date);
    request.startMonth = getFullDates.newStartDate;
    request.endMonth = getFullDates.newEndDate;
  } else {
    const getMaxStartDate = await FetchMaxProjectStartDateForGeneric(request);
    request.startMonth = formatToLocalTime(getMaxStartDate.project_start_date);
    request.endMonth = getPreviousMonthDatesFromCurrentDate();
  }
  const getClaimsData = await promReportsRepository.getClaimsFilters(request);
  const claimArr = [];
  getClaimsData.map((item) => {
    claimArr.push({
      project_code: item.project_code,
      resource_emp_id: item.resource_emp_id,
      resource_name: item['promAvinEmployeeDetails.resource_name'],
      expense_type: item.expense_type,
      date: item.date,
      amount: item.amount,
      approver: item.approver,
      approved_date: item.approved_date,
      claim_status: item.claim_status,
      remarks: item.remarks,
    });
  });
  let claimsObj = {};

  if (claimArr.length > 0) {
    claimsObj.datesObj = {
      start_date: request.startMonth,
      end_date: request.endMonth,
    };
  } else claimsObj.datesObj = {};

  claimsObj.claimArr = claimArr;
  return claimsObj;
};

const getAllGenericReports = async (request) => {
  const genericFilters = await getDatesFilterForGenericData(request);
  const genericData = await promReportsRepository.getGenericData(genericFilters);

  const getActualCostInfo = await getDetailedLevelCostUtilizationForProjectForGeneric(request);
  // const getActualCostInfo = await getDetailedLevelCostUtilizationForProject(request);
  // need to check
  // if (getActualCostInfo.length === 0 || getActualCostInfo === undefined) {
  //   throw new Error('No ResourceAllocation', { cause: 'No Resource allocated for requested group || project' });
  // }
 

  const getActualCost = getActualCostInfo.projectDetailedLevel;
  const getEmployeeData = await promAvinEmployeeDetailsRepo.fetchAllResources();
  const projectArr = [];
  const resourceAllocationArr = [];
  const resourceArr = [];
  const resourceAndCostUtilizationArr = [];
  genericData.map((projectData) => {
    if (projectData.promAvinResourceAllocation.length > 0) {
      projectArr.push({
        project_code: projectData.project_code,
        project_name: projectData.project_name,
        project_bu_name: projectData.project_bu_name,
        project_bu_head: projectData.project_bu_head,
        project_type: projectData.project_type,
        project_start_date: projectData.project_start_date,
        project_end_date: projectData.project_end_date,
        po_ro_sow_number: projectData.po_ro_sow_number,
        po_ro_sow_value: projectData.po_ro_sow_value,
        project_status: projectData.project_status,
      });

      projectData.promAvinResourceAllocation.map((allocationData) => {
        const managerName = getEmployeeData.find(
          (el) => el.resource_emp_id === allocationData.promAvinEmployeeDetails.manager_id,
        );
        if (resourceArr.length > 0) {
          const found = resourceArr.some(
            (el) => el.resource_emp_id === allocationData.promAvinEmployeeDetails.resource_emp,
          );
          if (!found) {
            resourceArr.push({
              project_code: allocationData.project_code,
              resource_emp_id: allocationData.promAvinEmployeeDetails.resource_emp,
              resource_name: allocationData.promAvinEmployeeDetails.resource_nam,
              manager_id: allocationData.promAvinEmployeeDetails.manager_id,
              manager_name: managerName.resource_name,
            });
          }
        } else {
          resourceArr.push({
            project_code: allocationData.project_code,
            resource_emp_id: allocationData.promAvinEmployeeDetails.resource_emp,
            resource_name: allocationData.promAvinEmployeeDetails.resource_nam,
            manager_id: allocationData.promAvinEmployeeDetails.manager_id,
            manager_name: managerName.resource_name,
          });
        }
        resourceAllocationArr.push({
          project_code: allocationData.project_code,
          resource_emp_id: allocationData.resource_emp_id,
          supervisor: managerName.resource_name,
          start_date: allocationData.start_date,
          end_date: allocationData.end_date,
          allocation: allocationData.allocation,
          resource_status_in_project: allocationData.resource_status_in_project,
        });
      });
      // const totalActualAllocation = projectData.promAvinResourceAllocation.reduce(
      //   (totalAllocation, obj) => Number(obj.allocation) + Number(totalAllocation),
      //   0,
      // );
      // const plannedTotalCost = projectData.promAvinProjectResourceAndCostPlan.reduce(
      //   (totalPlannedCost, obj) => Number(obj.planned_cost) + Number(totalPlannedCost),
      //   0,
      // );
      // const plannedTotalResource = projectData.promAvinProjectResourceAndCostPlan.reduce(
      //   (totalPlannedResource, obj) => Number(obj.planned_resource) + Number(totalPlannedResource),
      //   0,
      // );
      // let totalActualCost =
      //   getActualCost === undefined ? 0 : getActualCost.find((el) => el.projectCode === projectData.project_code) || 0;
      // totalActualCost = totalActualCost === 0 ? 0 : totalActualCost.totalActualCost;
      // resourceAndCostUtilizationArr.push({
      //   project_code: projectData.project_code,
      //   total_planned_resources: plannedTotalResource === 0 ? 0 : plannedTotalResource.toFixed(2),
      //   total_actual_resources: totalActualAllocation.toFixed(2),
      //   total_planned_cost: plannedTotalCost === 0 ? 0 : plannedTotalCost.toFixed(2),
      //   // total_planned_cost: parseFloat(plannedTotalCost).toLocaleString('en-IN', {
      //   //   maximumFractionDigits: 2,
      //   //   style: 'currency',
      //   //   currency: 'INR',
      //   // }),
      //   total_actual_cost: totalActualCost === 0 ? 0 : totalActualCost.toFixed(2),
      // });
    }
  });
  const totalArr = [];

  const genericObj = {};
  genericObj.datesObj = {
    start_date: genericFilters.request.start_date,
    end_date: genericFilters.request.end_date,
  };
  // pushing project,resource,allocation and cost resource utilization data in individual arrays
  totalArr.push(projectArr, resourceArr, resourceAllocationArr);
  genericObj.totalArr = totalArr;
  return genericObj;
};

const getGroupAOPInfo = async (getDatesInfo) => {
  const getGroupData = [];
  const startYear = getOnlyYearFromFullDate(getDatesInfo.request.start_date);
  const endYear = getOnlyYearFromFullDate(getDatesInfo.request.end_date);
  const groupTotalData = await promReportsRepository.getResourceUtilizationByGroup(getDatesInfo, startYear, endYear);

  let aopCountSum = 0;
  let allocationSum = 0;
  let billableAllocationSum = 0;
  let plannedResourceSum = 0;
  groupTotalData.forEach((groupData) => {
    aopCountSum += groupData.projectGroupAndOrgGroupNames.reduce(
      (total, obj) => Number(obj.aop_resource) + Number(total),
      0,
    );
    groupData.projectGroupFk.forEach((allocationData) => {
      allocationSum += allocationData.promAvinResourceAllocation.reduce(
        (total, obj) => Number(obj.allocation) + Number(total),
        0,
      );
      billableAllocationSum += allocationData.promAvinResourceAllocation.reduce(
        (total, obj) => Number(obj.billable_resource) + Number(total),
        0,
      );
      plannedResourceSum += allocationData.promAvinProjectResourceAndCostPlan.reduce(
        (total, obj) => Number(obj.planned_resou) + Number(total),
        0,
      );
    });
  });

  getGroupData.push({
    AOPApproved: aopCountSum,
    plannedResourceLoading: plannedResourceSum,
    actualResourceLoading: allocationSum.toFixed(2),
    actualResourceLoading_billable: billableAllocationSum.toFixed(2),
    revenueLeakage: billableAllocationSum - plannedResourceSum,
    'Variance w.r.t AOP': (allocationSum - aopCountSum).toFixed(2),

    utilization: isNaN((billableAllocationSum / allocationSum) * 100)
      ? 0
      : ((billableAllocationSum / allocationSum) * 100).toFixed(2),
  });
  return getGroupData;
};

const addPlannedResourceData = (arrayOfArray) => {
  const combinedArray = arrayOfArray.flatMap((ele) => {
    const innerCostPlanData = ele.promAvinProjectResourceAndCostPlan;
    return innerCostPlanData.flatMap((ele) => ele);
  });

  const finalCostPlanSummation = combinedArray.reduce(
    (summationArray, currentElement) => {
      const indexOfData = summationArray.findIndex((ele) => ele.month_year === currentElement.month_year);

      if (indexOfData === -1) {
        summationArray.push({
          ...currentElement,

          planned_resou: parseFloat(currentElement.planned_resou).toFixed(2),
        });

        return summationArray;
      }

      summationArray[indexOfData] = {
        month_year: currentElement.month_year,

        planned_resou: parseFloat(
          parseFloat(summationArray[indexOfData].planned_resou) + parseFloat(currentElement.planned_resou),
        ).toFixed(2),
      };

      return summationArray;
    },

    [],
  );
  return finalCostPlanSummation;
};

const fetchExistedNonExistedMonthlyResource = (
  groupWiseResourceCostData,
  requestedMonths,
  groupName,
  aopResourceGraphData,
  projectGroupAndOrgGroupNames,
  groupWiseResourceAllocationData,
) => {
  const monthWiseData = [];
  requestedMonths.map((getformat) => {
    const getPlannedResource = groupWiseResourceCostData.find((el) => el.month_year === getformat) || 0;
    const getAOPResource = projectGroupAndOrgGroupNames.find((el) => el.aop_month === getformat) || 0;
    const groupWiseResourceAllocation = filterMonthOverlappingAllocation(getformat, groupWiseResourceAllocationData);
    const plannedResource = getPlannedResource === 0 ? 0 : getPlannedResource.planned_resou;
    const aopResource = getAOPResource === 0 ? 0 : getAOPResource.aop_resource;
    let utilizationData = (
      (groupWiseResourceAllocation.billable_resource / groupWiseResourceAllocation.allocation) *
      100
    ).toFixed(2);

    utilizationData = utilizationData === null || isNaN(utilizationData) ? 0 : utilizationData;
    monthWiseData.push({
      [getformat]: {
        plannedResourceLoading: plannedResource,
        actualResourceLoading: groupWiseResourceAllocation.allocation,
        actualResourceLoading_billable: groupWiseResourceAllocation.billable_resource,
        // revenueLeakage: groupWiseResourceAllocation.allocation - plannedResource,
        revenueLeakage: groupWiseResourceAllocation.billable_resource - plannedResource,
        utilization: utilizationData,
      },
    });
    aopResourceGraphData.push({
      month: getformat,
      'AOP Approved': aopResource,
      [`${groupName} Business Leader Planned`]: plannedResource,
      'Actual Billable Deployed': groupWiseResourceAllocation.billable_resource,
      'Overall Resource Deployed': groupWiseResourceAllocation.allocation,
    });
  });
  return { monthWiseData, aopResourceGraphData };
};

const getResourceUtilizationAOP = async (request) => {
  const getDatesInfo = await getDatesFilterFromProjectData(request);
  const totalOutput = [];
  const graphArr = [];
  const getGRPAOPData = await projectRepo.getGRPAOPInfo(request, getDatesInfo.requestedMonths);
  getGRPAOPData.forEach((grpData) => {
    const RevenueGraphData = [];
    const groupWiseResourceCostData = addPlannedResourceData(grpData.projectGroupFk);
    const existedNonExistedMonthlyResource = fetchExistedNonExistedMonthlyResource(
      groupWiseResourceCostData,
      getDatesInfo.requestedMonths,
      grpData.bu_name,
      RevenueGraphData,
      grpData.projectGroupAndOrgGroupNames,
      grpData.projectGroupFk,
    );
    totalOutput.push({
      projectBUName: grpData.bu_name,
      monthWiseData: existedNonExistedMonthlyResource.monthWiseData,
    });
    graphArr.push(existedNonExistedMonthlyResource.aopResourceGraphData);
  });

  const noCostPlan = [];
  const totalAOP = await getGroupAOPInfo(getDatesInfo);
  return { totalOutput, noCostPlan, totalAOP, graphArr };
};

const addRevenueWithRevenueData = (arrayOfArray) => {
  const combinedArray = arrayOfArray.flatMap((ele) => {
    const innerRevenueData = ele.promAvinProjectOperationData;

    return innerRevenueData.flatMap((ele) => ele);
  });

  const finalRevenueSummation = combinedArray.reduce(
    (summationArray, currentElement) => {
      const indexOfData = summationArray.findIndex((ele) => ele.revenue_date === currentElement.revenue_date);

      if (indexOfData === -1) {
        summationArray.push({
          ...currentElement,

          revenue: parseFloat(currentElement.revenue).toFixed(2),
        });

        return summationArray;
      }
      summationArray[indexOfData] = {
        revenue_date: currentElement.revenue_date,

        revenue: parseFloat(
          parseFloat(summationArray[indexOfData].revenue) + parseFloat(currentElement.revenue),
        ).toFixed(2),
      };

      return summationArray;
    },

    [],
  );
  return finalRevenueSummation;
};

const addProjectData = (arrayOfArray) => {
  const combinedArray = arrayOfArray.flatMap((ele) => {
    const innerRevenueData = ele.promAvinProjectResourceAndCostPlan;

    return innerRevenueData.flatMap((ele) => ele);
  });

  const finalRevenueSummation = combinedArray.reduce(
    (summationArray, currentElement) => {
      const indexOfData = summationArray.findIndex((ele) => ele.month_year === getformat);

      if (indexOfData === -1) {
        summationArray.push({
          ...currentElement,

          revenue: parseFloat(currentElement.revenue).toFixed(2),
        });

        return summationArray;
      }
      summationArray[indexOfData] = {
        revenue_date: currentElement.revenue_date,

        revenue: parseFloat(
          parseFloat(summationArray[indexOfData].revenue) + parseFloat(currentElement.revenue),
        ).toFixed(2),
      };

      return summationArray;
    },

    [],
  );
  return finalRevenueSummation;
};

const fetchExistedNonExistedMonthlyRevenue = (
  groupWiseData,
  requestedMonths,
  projWiseRevenueObj,
  groupName,
  RevenueGraphData,
  projectGroupFk,
  request,
) => {
  const monthWiseTableData = [];
  let totalPlannedRevenueData = 0;
  let sumOfPlannedRevenue = 0;
  requestedMonths.map((getformat) => {
    const getActualRevenue = groupWiseData.find((el) => el.revenue_date === getformat) || 0;
    // const getPlannedRevenue = projectGroupAndOrgGroupNames.find((el) => el.aop_month === getformat) || 0;
    // const getPlannedRevenue =
    //   projectGroupFk.filter(
    //     (el) => dayjs(el.project_start_date) >= dayjs(getformat) && dayjs(el.project_end_date) <= dayjs(getformat),
    //   ) || 0;
    const getPlannedRevenue =
      projectGroupFk.filter((el) =>
        dayjs(getformat).isBetween(el.project_start_date, el.project_end_date, null, '[]'),
      ) || 0;
    const totalPlannedRevenue = getPlannedRevenue.reduce(
      (total, obj) => parseFloat(obj.po_ro_sow_value) + parseFloat(total),
      0,
    );
    const actualRevenue = getActualRevenue === 0 ? 0 : getActualRevenue.revenue;
    const plannedRevenue = totalPlannedRevenue === 0 ? 0 : parseFloat(totalPlannedRevenue).toFixed(2);

    monthWiseTableData.push({
      [getformat]: { actualRevenue, plannedRevenue },
    });
    RevenueGraphData.push({
      month: getShortMonthYearAbbreviation(getformat),
      [`${groupName} Revenue Planned`]: parseFloat(plannedRevenue).toFixed(2),
      [`${groupName} Revenue Actual`]: parseFloat(actualRevenue).toFixed(2),
    });
  });
  const totalPlannedRevenue = monthWiseTableData.reduce(
    (total, entry) => total + parseFloat(entry[Object.keys(entry)[0]].plannedRevenue),
    0
  );
  projWiseRevenueObj.totalPlannedRevenue = totalPlannedRevenue.toFixed(2);
  projWiseRevenueObj.totalPlannedRevenue = totalPlannedRevenue === 0 ? 0 : parseFloat(totalPlannedRevenue).toFixed(2);;


  projWiseRevenueObj.monthWiseTableData = monthWiseTableData;

  return { projWiseRevenueObj, RevenueGraphData };
};

// get project revenue reports for selection of all projects,start date and end date
const getGRPWiseRevenue = async (request) => {
  const getDatesInfo = await getDatesFilterFromProjectData(request);
  const totalArr = [];
  const graphArr = [];
  const getGRPRevenueByProjectData = await projectRepo.getGRPRevenueByProject(
    request,
    getDatesInfo,
    getDatesInfo.requestedMonths,
  );

  getGRPRevenueByProjectData.forEach((grpData) => {
    const projWiseRevenueObj = {
      projectBUName: grpData.bu_name,
    };
    // const getPlannedRevenue =
    // getGRPRevenueByProjectData.filter((el) =>
    //     dayjs(grpData).isBetween(el.project_start_date, el.project_end_date, null, '[]'),
    //   ) || 0;
    // const totalPlannedRevenue = getPlannedRevenue.reduce(
    //   (total, obj) => parseFloat(obj.po_ro_sow_value) + parseFloat(total),
    //   0,
    // );
    const RevenueGraphData = [];
    const groupWiseData = addRevenueWithRevenueData(grpData.projectGroupFk);
    if (groupWiseData.length > 0) {
      const totalActualRevenue = groupWiseData.reduce((total, obj) => parseFloat(obj.revenue) + parseFloat(total), 0);
      projWiseRevenueObj.totalActualRevenue = totalActualRevenue.toFixed(2);
      const existedNonExistedMonthlyRevenue = fetchExistedNonExistedMonthlyRevenue(
        groupWiseData,
        getDatesInfo.requestedMonths,
        projWiseRevenueObj,
        grpData.bu_name,
        RevenueGraphData,
        grpData.projectGroupFk,
        // grpData.projectGroupAndOrgGroupNames,
        request,
      );
      totalArr.push(existedNonExistedMonthlyRevenue.projWiseRevenueObj);
      graphArr.push(existedNonExistedMonthlyRevenue.RevenueGraphData);
    }
  });
  const allGroupsGraph = [];
  request.bu_name = 'All';
  const allGroupsRevenueData = await projectRepo.getGRPRevenueByProject(
    request,
    getDatesInfo,
    getDatesInfo.requestedMonths,
  );
  getDatesInfo.requestedMonths.map((getformat) => {
    const RevenuePlannedActualAllGroupsGraphData = {};
    RevenuePlannedActualAllGroupsGraphData.month = getShortMonthYearAbbreviation(getformat);
    allGroupsRevenueData.flatMap((grpData) => {
      const groupWiseData = addRevenueWithRevenueData(grpData.projectGroupFk);
      const getActualRevenue = groupWiseData.find((el) => el.revenue_date === getformat) || 0;
      const getPlannedRevenue =
        grpData.projectGroupFk.filter((el) =>
          dayjs(getformat).isBetween(el.project_start_date, el.project_end_date, null, '[]'),
        ) || 0;
      const totalPlannedRevenue = getPlannedRevenue.reduce(
        (total, obj) => parseFloat(obj.po_ro_sow_value) + parseFloat(total),
        0,
      );
      // const getPlannedRevenue =
      //   grpData.projectGroupFk.find(
      //     (el) =>
      //       convertToNumericMonthYear(el.project_start_date) >= getformat &&
      //       convertToNumericMonthYear(el.project_end_date) <= getformat,
      //   ) || 0;
      // const getPlannedRevenue = grpData.projectGroupAndOrgGroupNames.find((el) => el.aop_month === getformat) || 0;

      const actualRevenue = getActualRevenue === 0 ? 0 : getActualRevenue.revenue;
      const plannedRevenue = totalPlannedRevenue === 0 ? 0 : totalPlannedRevenue;
      RevenuePlannedActualAllGroupsGraphData[`${grpData.bu_name} Revenue Planned`] =
        parseFloat(plannedRevenue).toFixed(2);
      RevenuePlannedActualAllGroupsGraphData[`${grpData.bu_name} Revenue Actual`] =
        parseFloat(actualRevenue).toFixed(2);
    });

    allGroupsGraph.push(RevenuePlannedActualAllGroupsGraphData);
  });
  return { totalArr, graphArr, allGroupsGraph };
};

const plannedAndActualRevenue = (projectGroupFk, getformat) => {
  const getPlannedRevenue =
    projectGroupFk.filter((el) => dayjs(getformat).isBetween(el.project_start_date, el.project_end_date, null, '[]')) ||
    0;
  const totalPlannedRevenue = getPlannedRevenue.reduce(
    (total, obj) => parseFloat(obj.po_ro_sow_value) + parseFloat(total),
    0,
  );
  const combinedArray = projectGroupFk.flatMap((ele) => {
    const innerRevenueData = ele.promAvinProjectResourceAndCostPlan;
    return innerRevenueData.flatMap((ele) => ele);
  });
  const getPlannedCost = combinedArray.filter((el) => el.month_year === getformat) || 0;
  const aopRevenue = totalPlannedRevenue === 0 ? 0 : totalPlannedRevenue;
  const totalPlannedCost = getPlannedCost.reduce((total, obj) => parseFloat(obj.planned_cost) + parseFloat(total), 0);
  const aopCost = totalPlannedCost === 0 ? 0 : totalPlannedCost;

  return {
    aopRevenue,
    aopCost,
  };
};

const getActualRevenue = (actualRevenue, getformat) => {
  const getMonthActualRevenue = actualRevenue.find((el) => el.revenue_date === getformat) || 0;
  return getMonthActualRevenue === 0 ? 0 : getMonthActualRevenue.revenue;
};

const summationOfAllTotalMonthInArray = (costSortedInMonthAndExpense) => {
  const monthsWithTotalMap = new Map();
  Object.entries(costSortedInMonthAndExpense).forEach((eachMonth) => {
    const [monthName, { Total: totalAllocationForMonth }] = eachMonth;
    const formatMonthName = getNumericYearMonthFromStringDate(monthName);
    if (!monthsWithTotalMap.has(formatMonthName)) {
      monthsWithTotalMap.set(formatMonthName, 0);
    }
    monthsWithTotalMap.set(formatMonthName, monthsWithTotalMap.get(formatMonthName) + totalAllocationForMonth);
  });
  return Object.fromEntries(monthsWithTotalMap);
};

const getCostAndRevenueContribution = async (request) => {
  const requestBody = request;
  const getActualCostInfo = await getDetailedLevelCostUtilizationForProject(requestBody);
  if (getActualCostInfo.length === 0 || getActualCostInfo === undefined) {
    throw new Error('No ResourceAllocation', { cause: 'No Resource allocated for requested group || project' });
  }
  const totalOutput = [];
  const noCostPlan = [];

  // const getDatesInfo = await getDatesFilterFromProjectData(request);

  const revenueAndCostInfo = await promReportsRepository.getRevenueAndCostData(
    getActualCostInfo.resourceFromDateAndToDate,
  );
  revenueAndCostInfo.map((groupInfo) => {
    const projWiseResourceCostObj = {
      projectBUName: groupInfo.bu_name,
    };
    const actualCost = getActualCostInfo.projectDetailedLevel.filter(
      (obj) => obj.projectBUName === groupInfo.bu_name,
    );

    let sumOfAllMonths = [];
    // const getActualCost = actualCost.projectDetailedLevel;
    if (actualCost !== undefined) {
      // const getActualCost = actualCost.projectDetailedLevel;
      actualCost.map((obj) => {
        sumOfAllMonths = summationOfAllTotalMonthInArray(obj.detailedLevelData.costSortedInMonthAndExpense);
      })

    }

    const monthWiseData = [];
    const actualRevenue = addRevenueWithRevenueData(groupInfo.projectGroupFk);
    getActualCostInfo.resourceFromDateAndToDate.requestedMonths.map((getformat) => {
      const monthlyObj = {};
      // const plannedAOPData = plannedAndActualRevenue(groupInfo.projectGroupAndOrgGroupNames, getformat);
      const plannedAOPData = plannedAndActualRevenue(groupInfo.projectGroupFk, getformat);
      const getMonthActualRevenueData = getActualRevenue(actualRevenue, getformat);
      const monthWiseResourceCostObj = {
        actualCost: sumOfAllMonths[getformat],
        PlannedRevenueAOP: plannedAOPData.aopRevenue,
        ActualRevenue: getMonthActualRevenueData,
        RevenueVariance: getMonthActualRevenueData - plannedAOPData.aopRevenue,
        PlannedCostAOP: plannedAOPData.aopCost,
        CostVariance: sumOfAllMonths[getformat] - plannedAOPData.aopCost,
        ContributionValue:
          getMonthActualRevenueData - sumOfAllMonths[getformat] === 0
            ? 0
            : (getMonthActualRevenueData - sumOfAllMonths[getformat]).toFixed(2),
        'Contribution%':
          isNaN((getMonthActualRevenueData - sumOfAllMonths[getformat]) / getMonthActualRevenueData) ||
            (getMonthActualRevenueData - sumOfAllMonths[getformat]) / getMonthActualRevenueData === -Infinity
            ? 0
            : (((getMonthActualRevenueData - sumOfAllMonths[getformat]) / getMonthActualRevenueData) * 100).toFixed(2),
      };
      monthlyObj[getformat] = monthWiseResourceCostObj;
      monthWiseData.push(monthlyObj);
    });
    projWiseResourceCostObj.monthWiseData = monthWiseData;
    totalOutput.push(projWiseResourceCostObj);
  });
  return { totalOutput, noCostPlan };
};

const calculateResourceCountByProjectGroup = (allMonthData, projectGroupAndItsProjects) => {
  /**
   * @summary even if some employee are allocated to multiple projects which are under same group for same month
   * he will be considered as 1 count for the month.
   * @var allMonthData is months data required by user
   */

  projectGroupAndItsProjects.projectGroupFk.forEach((projects) => {
    // for each project in group.
    const resourceAllocationForTheProjects = projects.promAvinResourceAllocation;

    // for each row in resource allocation
    resourceAllocationForTheProjects.forEach(({ resourceEmpId, startDate, endDate }) => {
      // array of months which user is allocated
      const employeeAllocatedMonthsArray = allMonthsInMonthYearFormatForFilters(startDate, endDate);

      /**
       * if employee has been allocated to monthYear required by frontend/user. then consider employee has 1 count
       * i.e add employee to monthYear SET. @example  Map(12) {'2022-02' => Set(0) {"0001","0002","0003"}}
       */
      employeeAllocatedMonthsArray.forEach((eachMonthYear) => {
        if (allMonthData.has(eachMonthYear)) {
          // checking whether employee is allocated to month
          // if employee allocated to month required by user.then add to set
          allMonthData.get(eachMonthYear).add(resourceEmpId);
        }
      });
    });
  });

  // return projectBUName along with month wise resource allocation count
  return { projectBUName: projectGroupAndItsProjects.bu_name, allMonthData };
};

const calculateGroupWiseResourceCount = (resourceAllocationDataPerGroup, allMonthsFromFilter) => {
  /**
   * @var allMonthData is the Map containing unique monthYear key,which is used to save the
   * employee id in set(at last used for count) for the whole group.
   * @example Map(12) {
                    '2022-01' => Set(0) {}, // Set is used to store unique employee id.
                                 and at last will be used to get number of employee allocated.
                    '2022-02' => Set(0) {},
                    '2022-03' => Set(0) {},
                    '2022-04' => Set(0) {},
}
   */
  const projectGroupTotalAllocatedData = resourceAllocationDataPerGroup.map((projectGroupAndItsProjects) => {
    const allMonthData = new Map(allMonthsFromFilter.map((ele) => [ele, new Set()])); // all month initialized with SET

    /**
     * @function calculateResourceCountByProjectGroup performs resource Utilization count for selected months data
     */
    const countByGroupWiseData = calculateResourceCountByProjectGroup(allMonthData, projectGroupAndItsProjects);
    return countByGroupWiseData;
  });

  // return groups month wise count details with projectGroupName
  return projectGroupTotalAllocatedData;
};

const calculateTotalMonthCountFromAllProjectsUnderGroup = (projectGroupMonthWiseData) => {
  /**
  
     * @summary the map will get the resource allocated to the particular month by calculating the size of SET
  
     * i.e size of SET is the number of employee allocated to the month for the particular project_group/bu_name
  
     */

  const projectGroupCountData = projectGroupMonthWiseData.map((ele) => {
    const monthWiseCount = [...ele.allMonthData.entries()].reduce(
      // monthYear is key in MAP and noOfEmployeeAllocated is the SET datatype (which has employee id,which then used to
      // calculate resource count for the month

      (allMonthYearData, [monthYear, noOfEmployeeAllocated]) => {
        allMonthYearData[monthYear] = noOfEmployeeAllocated.size; // get size from SET for the month
        return allMonthYearData;
      },

      {},
    );

    return { projectBUName: ele.projectBUName, ...monthWiseCount };
  });

  return projectGroupCountData;
};
const calculateResourceCountForAllProjectGroup = (resourceAllocationDataPerGroup, filters, plannedResource) => {
  // get all months between(inclusive) the start date and end date in YYYY-MM format
  const allMonthsFromFilter = allMonthsInMonthYearFormatForFilters(filters.start_date, filters.end_date);

  const projectGroupMonthWiseData = calculateGroupWiseResourceCount(
    resourceAllocationDataPerGroup,
    allMonthsFromFilter,
  );

  const projectGroupMonthWiseCountData = calculateTotalMonthCountFromAllProjectsUnderGroup(
    projectGroupMonthWiseData,
    plannedResource,
  );
  return [...projectGroupMonthWiseCountData];

  // return [...projectGroupMonthWiseCountData, totalResourceCountFromAllGroup];
};

const transformAPIResultForChartData = (apiResponse, plannedResource) => {
  // get all month(which is selected from user)
  // output:[ '2022-01', '2022-02','2022-03', '2022-04']
  const allMonthChartData = Object.keys(apiResponse[0]).filter((ele) => ele !== 'projectBUName');

  // creating Map for each row of month for easy operation.
  const allMonthChartDataMap = new Map(allMonthChartData.map((monthName) => [monthName, { month: monthName }]));

  // loop over each row and of project month Details(from api response) and add each month data into the MAP with
  // project name as key and count as value
  apiResponse.forEach(({ projectBUName, ...selectedMonthDataForProject }) => {
    // example output for selectMonthDataForProject : {'2022-01': 0, '2022-02': 0,'2022-03': 0}
    Object.keys(selectedMonthDataForProject).forEach((singleMonthCountForProject) => {
      const monthDetails = allMonthChartDataMap.get(singleMonthCountForProject);
      monthDetails[projectBUName] = selectedMonthDataForProject[singleMonthCountForProject];
    });
  });
  return [...allMonthChartDataMap].map(([, monthValue]) => monthValue);
};

const transformAPIResultForChartDataold = (apiResponse, plannedResource) => {
  // get all month(which is selected from user)
  // output:[ '2022-01', '2022-02','2022-03', '2022-04']
  const allMonthChartData = Object.keys(apiResponse[0]).filter((ele) => ele !== 'projectBUName');
  // creating Map for each row of month for easy operation.
  const allMonthChartDataMap = new Map(allMonthChartData.map((monthName) => [monthName, { month: monthName }]));
  // loop over each row and of project month Details(from api response) and add each month data into the MAP with
  // project name as key and count as value
  apiResponse.forEach(({ projectBUName, ...selectedMonthDataForProject }) => {
    // example output for selectMonthDataForProject : {'2022-01': 0, '2022-02': 0,'2022-03': 0}
    Object.keys(selectedMonthDataForProject).forEach((singleMonthCountForProject) => {
      const monthDetails = allMonthChartDataMap.get(singleMonthCountForProject);
      let grpPlannedResource = plannedResource.find(
        (ele) => ele.project_bu_name === projectBUName && ele.month_year === monthDetails.month,
      );
      grpPlannedResource = grpPlannedResource === undefined ? 0 : grpPlannedResource.planned_resource;
      monthDetails[`${projectBUName}_actual`] = selectedMonthDataForProject[singleMonthCountForProject];
      monthDetails[`${projectBUName}_planned`] = grpPlannedResource;
    });
  });

  return [...allMonthChartDataMap].map(([, monthValue]) => monthValue);
};

const getResourceUtilizationCountForAllProject = async (requestedFilterInfo, requestBody) => {
  /**
   * @summary fetch all Resource_allocation table (by projectGroup(i.e bu_name) wise) from each project
   * from database.
   * bu_name =>(has some project)=> projects =>(has employee allocated to it through project_code)
   */
  const resourceUtilizationCountData = await promReportsRepository.getResourceUtilizationByProjectGroup(
    requestedFilterInfo,
  );
  if (!resourceUtilizationCountData.some((projectData) => projectData.projectGroupFk.length > 0)) {
    return { projectGroupMonthWiseDataWithTotal: [], projectGroupMonthWiseChartData: [] };
  }
  const allRequestedMonths = dateRange(requestedFilterInfo.start_date, requestedFilterInfo.end_date);
  const requestedMonths = allRequestedMonths.map((monthNum) => monthNum.slice(0, -3));
  const plannedResource = await promReportsRepository.getPlannedResourceTotal(requestBody, requestedMonths);
  /**
   * calculate Resource utilization count(i.e how many resources are allocated
   * for each month for that project Group/bu_name)
   */
  // const projectGroupMonthWiseDataWithTotal = calculateResourceCountForAllProjectGroup(
  //   resourceUtilizationCountData,
  //   requestedFilterInfo,
  //   plannedResource,
  // );
  const totalData = calculateResourceCountForAllProjectGroup(
    resourceUtilizationCountData,
    requestedFilterInfo,
    plannedResource,
  );

  const projectGroupMonthWiseDataWithTotal = [];

  totalData.map((actualData) => {
    const monthWisePlannedData = [];
    let actualCount = 0;
    let plannedCount = 0;

    requestedMonths.map((monthYear) => {
      let plannedData = plannedResource.find(
        (ele1) => ele1.project_bu_name === actualData.projectBUName && ele1.month_year === monthYear,
      );
      plannedData = plannedData === undefined ? 0 : plannedData.planned_resource;
      monthWisePlannedData.push({
        [monthYear]: {
          actualResourceCount: actualData[monthYear] === 0 ? 0 : parseFloat(actualData[monthYear]).toFixed(2),
          plannedResourceCount: plannedData,
        },
      });
      actualCount = parseFloat(actualCount) + parseFloat(actualData[monthYear]);
      plannedCount = parseFloat(plannedCount) + parseFloat(plannedData);
    });
    projectGroupMonthWiseDataWithTotal.push({
      projectBUName: actualData.projectBUName,
      totalPlannedResource: plannedCount,
      totalActualResource: actualCount,
      monthWisePlannedData,
    });
  });
  const projectGroupMonthWiseChartData = [];
  requestedMonths.map((getformat) => {
    const ResourcePlannedActualAllGroupsGraphData = {};
    ResourcePlannedActualAllGroupsGraphData.month = getShortMonthYearAbbreviation(getformat);

    totalData.map((grpData) => {
      const getActualCount =
        totalData.find((el) => el.projectBUName === grpData.projectBUName && Object.keys(el).includes(getformat)) || 0;
      const getPlannedCount =
        plannedResource.find(
          (el) => el.project_bu_name === grpData.projectBUName && el.month_year === getformat,
        ) || 0;
      const actualCount = getActualCount === 0 ? 0 : getActualCount[getformat];
      const plannedRevenue = getPlannedCount === 0 ? 0 : getPlannedCount.planned_resource;
      ResourcePlannedActualAllGroupsGraphData[`${grpData.projectBUName} Planned`] = parseFloat(plannedRevenue);
      ResourcePlannedActualAllGroupsGraphData[`${grpData.projectBUName} Actual`] = parseFloat(actualCount);
    });

    projectGroupMonthWiseChartData.push(ResourcePlannedActualAllGroupsGraphData);
  });
  return {
    projectGroupMonthWiseDataWithTotal,
    projectGroupMonthWiseChartData,
    // projectGroupMonthWiseChartData: transformAPIResultForChartData(
    //   projectGroupMonthWiseDataWithTotal.slice(0, -1),
    //   plannedResource,
    // ),
  };
};

const getResourceUtilizationCountForMultipleGroup = async (requestedFilterInfo, requestBody) => {
  const resourceUtilizationCountForMultiGroup = await promReportsRepository.getResourceUtilizationByProjectGroup(
    requestedFilterInfo,
    requestedFilterInfo.projectGroup,
  );

  if (!resourceUtilizationCountForMultiGroup.some((projectData) => projectData.projectGroupFk.length > 0)) {
    return { projectGroupMonthWiseDataWithTotal: [], projectGroupMonthWiseChartData: [] };
  }

  const totalData = calculateResourceCountForAllProjectGroup(
    resourceUtilizationCountForMultiGroup,
    requestedFilterInfo,
  );
  // const allRequestedMonths = dateRange(requestBody.startDate, requestBody.endDate);
  const allRequestedMonths = dateRange(requestedFilterInfo.start_date, requestedFilterInfo.end_date);
  const requestedMonths = allRequestedMonths.map((monthNum) => monthNum.slice(0, -3));
  const plannedResource = await promReportsRepository.getPlannedResourceTotal(requestBody, requestedMonths);
  const projectGroupMonthWiseDataWithTotal = [];
  totalData.map((actualData) => {
    const monthWisePlannedData = [];
    let actualCount = 0;
    let plannedCount = 0;
    requestedMonths.map((monthYear) => {
      let plannedData = plannedResource.find(
        (ele1) => ele1.project_bu_name === actualData.projectBUName && ele1.month_year === monthYear,
      );
      plannedData = plannedData === undefined ? 0 : plannedData.planned_resource;
      monthWisePlannedData.push({
        [monthYear]: {
          actualResourceCount: actualData[monthYear] === 0 ? 0 : parseFloat(actualData[monthYear]).toFixed(2),
          plannedResourceCount: plannedData,
        },
      });
      actualCount = parseFloat(actualCount) + parseFloat(actualData[monthYear]);
      plannedCount = parseFloat(plannedCount) + parseFloat(plannedData);
    });
    projectGroupMonthWiseDataWithTotal.push({
      projectBUName: actualData.projectBUName,
      totalPlannedResource: plannedCount,
      totalActualResource: actualCount,
      monthWisePlannedData,
    });
  });
  const projectGroupMonthWiseChartData = [];
  requestedMonths.map((getformat) => {
    const ResourcePlannedActualAllGroupsGraphData = {};
    ResourcePlannedActualAllGroupsGraphData.month = getShortMonthYearAbbreviation(getformat);
    totalData.map((grpData) => {
      const getActualCount =
        totalData.find((el) => el.projectBUName === grpData.projectBUName && Object.keys(el).includes(getformat)) || 0;
      const getPlannedCount =
        plannedResource.find(
          (el) => el.project_bu_name === grpData.projectBUName && el.month_year === getformat,
        ) || 0;
      const actualCount = getActualCount === 0 ? 0 : getActualCount[getformat];
      const plannedRevenue = getPlannedCount === 0 ? 0 : getPlannedCount.planned_resource;
      ResourcePlannedActualAllGroupsGraphData[`${grpData.projectBUName} Planned`] = parseFloat(plannedRevenue);
      ResourcePlannedActualAllGroupsGraphData[`${grpData.projectBUName} Actual`] = parseFloat(actualCount);
    });

    projectGroupMonthWiseChartData.push(ResourcePlannedActualAllGroupsGraphData);
  });
  return {
    projectGroupMonthWiseDataWithTotal,
    projectGroupMonthWiseChartData,
    // projectGroupMonthWiseChartData: transformAPIResultForChartData(
    //   projectGroupMonthWiseDataWithTotal.slice(0, -1),
    //   plannedResource,
    // ),
  };
};

const getResourceUtilizationCountForSingleGroup = async (requestedFilterInfo, requestBody) => {
  const resourceUtilizationCountForSingleGroup = await promReportsRepository.getResourceUtilizationByProjectGroup(
    requestedFilterInfo,
    requestedFilterInfo.projectGroup,
  );

  if (!resourceUtilizationCountForSingleGroup.some((projectData) => projectData.projectGroupFk.length > 0)) {
    return { projectGroupMonthWiseDataWithTotal: [], projectGroupMonthWiseChartData: [] };
  }

  const allMonthsFromFilter = allMonthsInMonthYearFormatForFilters(
    requestedFilterInfo.start_date,
    requestedFilterInfo.end_date,
  );

  const projectGroupMonthWiseData = calculateGroupWiseResourceCount(
    resourceUtilizationCountForSingleGroup,
    allMonthsFromFilter,
  );

  const totalData = calculateTotalMonthCountFromAllProjectsUnderGroup(projectGroupMonthWiseData);
  // const allRequestedMonths = dateRange(requestBody.startDate, requestBody.endDate);
  const allRequestedMonths = dateRange(requestedFilterInfo.start_date, requestedFilterInfo.end_date);

  const requestedMonths = allRequestedMonths.map((monthNum) => monthNum.slice(0, -3));
  const plannedResource = await promReportsRepository.getPlannedResourceTotal(requestBody, requestedMonths);
  const projectGroupMonthWiseDataWithTotal = [];
  totalData.map((actualData) => {
    const monthWisePlannedData = [];
    let actualCount = 0;
    let plannedCount = 0;

    requestedMonths.map((monthYear) => {
      let plannedData = plannedResource.find(
        (ele1) => ele1.project_bu_name === actualData.projectBUName && ele1.month_year === monthYear,
      );
      plannedData = plannedData === undefined ? 0 : plannedData.planned_resource;
      monthWisePlannedData.push({
        [monthYear]: {
          actualResourceCount: actualData[monthYear] === 0 ? 0 : parseFloat(actualData[monthYear]).toFixed(2),
          plannedResourceCount: plannedData,
        },
      });
      actualCount = parseFloat(actualCount) + parseFloat(actualData[monthYear]);
      plannedCount = parseFloat(plannedCount) + parseFloat(plannedData);
    });
    projectGroupMonthWiseDataWithTotal.push({
      projectBUName: actualData.projectBUName,
      totalPlannedResource: plannedCount,
      totalActualResource: actualCount,
      monthWisePlannedData,
    });
  });
  const projectGroupMonthWiseChartData = [];
  requestedMonths.map((getformat) => {
    const ResourcePlannedActualAllGroupsGraphData = {};
    ResourcePlannedActualAllGroupsGraphData.month = getShortMonthYearAbbreviation(getformat);
    totalData.map((grpData) => {
      const getActualCount =
        totalData.find((el) => el.projectBUName === grpData.projectBUName && Object.keys(el).includes(getformat)) || 0;
      const getPlannedCount =
        plannedResource.find(
          (el) => el.project_bu_name === grpData.projectBUName && el.month_year === getformat,
        ) || 0;
      const actualCount = getActualCount === 0 ? 0 : getActualCount[getformat];
      const plannedRevenue = getPlannedCount === 0 ? 0 : getPlannedCount.planned_resource;
      ResourcePlannedActualAllGroupsGraphData[`${grpData.projectBUName} Planned`] = parseFloat(plannedRevenue);
      ResourcePlannedActualAllGroupsGraphData[`${grpData.projectBUName} Actual`] = parseFloat(actualCount);
    });

    projectGroupMonthWiseChartData.push(ResourcePlannedActualAllGroupsGraphData);
  });
  return {
    projectGroupMonthWiseDataWithTotal,
    projectGroupMonthWiseChartData,
    // projectGroupMonthWiseChartData: transformAPIResultForChartData(projectGroupMonthWiseDataWithTotal, plannedResource),
  };
};

// get avg engg cost reports based selected dates
const getAvgEnggCostReports = async (request) => {
  let startDate = request.start_date;
  let endDate = request.end_date;
  const addStartDate = '-01';
  startDate = startDate.concat(addStartDate);
  endDate = endDate.concat(addStartDate); // get all requested months range in array
  const allRequestedMonths = dateRange(startDate, endDate);
  const requestedMonths = allRequestedMonths.map((monthNum) => monthNum.slice(0, -3));
  const getData = await avgEnggRepo.getEnggCostDataByMonth(request);
  const avgFinalArr = [];

  if (getData.length > 0) {
    const getTotal = await avgEnggRepo.getTotalAvgEnggCost(request);
    requestedMonths.forEach((monthArr) => {
      const filtered = getData.filter((dataArr) => dataArr.average_engg_date === monthArr);
      const dateFormat = getShortMonthAbbreviation(monthArr);
      if (filtered.length > 0) {
        avgFinalArr.push({
          month: dateFormat,
          'avg-cost': filtered[0].average_engg_cost.toFixed(2),
        });
      } else {
        avgFinalArr.push({
          month: dateFormat,
          'avg-cost': 0,
        });
      }
    });
    avgFinalArr.push({
      month: 'Total',
      'avg-cost': getTotal.totalAvgEnggCost === null ? 0 : getTotal.totalAvgEnggCost.toFixed(2),
    });
  }

  return avgFinalArr;
};

module.exports = {
  getResourceUtilizationCountForSingleGroup,
  getResourceUtilizationCountForMultipleGroup,
  getResourceUtilizationCountForAllProject,
  getReportsData,
  getHighLevelCostUtilizationForProject,
  getDetailedLevelCostUtilizationForProject,
  getProjRevenue,
  getProjContribution,
  getResourceCostUtilization,
  getClaimsByStatus,
  getAllGenericReports,
  fetchAndPerformStartAndEndDateCalculationForGroupByCount,
  groupByEmployeeId,
  getResourceUtilizationAOP,
  getGRPWiseRevenue,
  getCostAndRevenueContribution,
  getAvgEnggCostReports,
  createWeeksForTheMonthWithZeroAllocation,
  calculatedDetailLevelCostUtilizationData,
  allocateCostForEachEmployee,
  divideSalaryRevisionAndAllocateCTCAcrossMonthsForAllEmployee,
  getSalaryRevisionDetailsForEmployeeForProjectCode,
  calculateTotalSalaryPerMonthAllocation,
  calculateExpensesForTheMonth,
  initialRemainingExpenseToZeroCost,
  addRemainingMonthsAsZeroCostDetailedLevel,
  calculateTheSumOfTheExpensesOfTheMonth,
  sortInMonthYearOrder,
  sortExpenseInOrder,
  filterOutUnnecessaryMonthDetails,
  calculateGrandTotalOfAllMonthActualCostDetailedLevel,
  calculateGrandTotalOfPlannedCostOfAllMonths,
  getResourceUtilizationDataForProject,
};
