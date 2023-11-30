/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
/* eslint-disable arrow-body-style */
const {
  dayjs,
  convertToNumericMonthYear,
  overLapBetweenDate,
  divideMonthsFromStartAndDate,
  getAllMonthsFromArrayOfDates,
} = require('../../utils/date');

const groupArrayOfDetailsByEmployeeIdMap = (details) => {
  const groupByEmployeeMap = new Map();
  details.forEach((element) => {
    const resourceEmployeeId = element.resource_emp_id;
    if (!groupByEmployeeMap.has(resourceEmployeeId)) {
      groupByEmployeeMap.set(resourceEmployeeId, []);
    }
    groupByEmployeeMap.set(resourceEmployeeId, [...groupByEmployeeMap.get(resourceEmployeeId), element]);
  });
  return groupByEmployeeMap;
};

const allocateBetweenStartAndEndDate = (startDate, endDate, employeeAllocation, employeeAllocationMap) => {
  /**
   * As start_date and end_date will be in same month, getting year-month data from the
   * start_date(can consider end_date as well).year-month data will be present in Map before hand.
   */
  const monthYearForEmp = convertToNumericMonthYear(startDate);
  // parseInt(startDate.split('-')[2], 10) ==> gives the date as integer from full date
  for (let date = parseInt(startDate.split('-')[2], 10); date <= parseInt(endDate.split('-')[2], 10); date += 1) {
    const previousAllocation = employeeAllocationMap?.get(monthYearForEmp)?.get(date);
    employeeAllocationMap
      .get(monthYearForEmp)
      .set(date, parseFloat(((previousAllocation ?? 0) + parseFloat(employeeAllocation)).toFixed(2)));
  }
};

const formDateWiseAllocationForEmployee = (employeeAllocationDetailsArray) => {
  const allAllocatedMonth = getAllMonthsFromArrayOfDates(employeeAllocationDetailsArray);

  /** @var employeeMonthWiseAllocation will be used to contain employee's all Month allocation in Map data structure */
  const employeeMonthWiseAllocation = new Map(allAllocatedMonth.map((ele) => [ele, new Map()]));

  employeeAllocationDetailsArray.forEach((ele) => {
    const startDate = ele.start_date;
    const endDate = ele.end_date;
    const employeeAllocationValue = ele.allocation;

    /**
     * if start_date and end_date are in same month, add allocation from element to the employee month in Map
     * Input: {startDate: 2022-10-02, endDate:2022-10-06 } ;
     * Output: Map {'2022-10' => Map(12) { 2 => 1,3 => 1,4 => 1, 5 => 1,6 => 1 }} ; 1 is sample allocation here
     */
    if (convertToNumericMonthYear(startDate) === convertToNumericMonthYear(endDate)) {
      allocateBetweenStartAndEndDate(startDate, endDate, employeeAllocationValue, employeeMonthWiseAllocation);
    } else {
      /** this condition implies start_date and end_date are in different month.so allocate based on several month
       * {@link multiMonthAllocation} to employee month in Map {@link employeeMonthWiseAllocation}
       */
      const multiMonthAllocation = divideMonthsFromStartAndDate(startDate, endDate);

      multiMonthAllocation.forEach(({ start_date: multiElementStartDate, end_date: multiELementEndDate }) => {
        allocateBetweenStartAndEndDate(
          multiElementStartDate,
          multiELementEndDate,
          employeeAllocationValue,
          employeeMonthWiseAllocation,
        );
      });
    }
  });
  return employeeMonthWiseAllocation;
};

/**
 * @function resourceDateWiseAllocationFunction will calculate each resource allocation, month wise in Map.
 * Input : input must be allocation details[Array] Grouped By resource_emp_id in Map Data structure.
 * @example for Input : Map(1) {
 *'0482' => [ {start_date: '2022-11-01', end_date: '2022-11-07'} , {start_date: '2022-11-01',end_date: '2022-11-14'} ]
 * }
 * Output: contains date wise allocation grouped by month and further grouped by resource_emp_id
 * @example for output : Map(1) { '0482' => Map(1) { 2022-11' => Map(14) { 1 => 0.35, 2 => 0.35, ........ } } }
 */
const resourceDateWiseAllocationFunction = (allResourceAllocationInfo) => {
  // resource allocated for all dates within mentioned months and grouped By resource_emp_id
  const allResourceAllocationMap = new Map();

  [...allResourceAllocationInfo].forEach(([resourceEmployeeId, resourceData]) => {
    // for each employee form allocation(month-year wise -> date wise) using their allocation data.
    const resourceAllocatedAcrossMonths = formDateWiseAllocationForEmployee(resourceData);
    // Map the allocation of resource Using resourceEmployeeId as key and allocation Map as value.
    allResourceAllocationMap.set(resourceEmployeeId, resourceAllocatedAcrossMonths);
  });

  return allResourceAllocationMap;
};

const verifyAllocationThreshold = (frontEndAllocation, databaseAllocation, incomingFrontEndDetails) => {
  // this Set is used to save the frontEnd row index where allocation crossed
  // threshold of more than 1 when combined with database allocation for the same date for the same employee.
  const frontEndOverlyAllocatedRow = new Set();

  // this Set is used to save the frontEnd row index where allocation from user(frontEnd) in itself crossed 1.
  // [excluding database allocation for the user for the date].
  // This acts like self validation from within the rows in frontend
  const excessivelyAllocatedFromUserExcludingDatabase = new Set();

  /**
   * if employee allocation(frontEnd allocation + database allocation || frontendAllocation) is more than 1,
   * then it @fires function {@link findRowWhichAreOverLoaded}
   */
  const findRowWhichAreOverLoaded = (
    resourceEmployeeId,
    allocationOverloadedDate,
    { correspondingDatabaseAllocation, allocationFromFrontEnd }, // for future use case if necessary
  ) => {
    const NumberOfElementOverloadedInFrontEnd = incomingFrontEndDetails
      .map(({ resource_emp_id: resourceEmpIdFromFE, start_date, end_date }, index) => {
        // find whether the date is present between start_date & end_date &(same employee Id) of each
        // elements in the main Array if element found then save the index of the element else return null.

        return dayjs(allocationOverloadedDate).isBetween(start_date, end_date, null, '[]') &&
          resourceEmpIdFromFE === resourceEmployeeId
          ? index
          : null;
      }) // filter out the null from the array as it is unnecessary
      .filter((ele) => ele !== null);

    // if overloaded inclusively from frontEnd itself then save the row to Set.
    if (allocationFromFrontEnd > 1) {
      NumberOfElementOverloadedInFrontEnd.forEach((ele) => {
        excessivelyAllocatedFromUserExcludingDatabase.add(ele);
      });
    }

    // if overloaded by adding both frontend allocation(i.e user) + database allocation(i.e already/previous allocated)
    // then add the row index to the Set and return this value to Frontend to show the Error.
    NumberOfElementOverloadedInFrontEnd.forEach((ele) => {
      frontEndOverlyAllocatedRow.add(ele);
    });
  };

  // Main Process starts Here
  // @summary [Loop 1] step 1: for each Employee in Map
  [...frontEndAllocation].forEach(([resourceEmployeeId, allocationYearMonthWise]) => {
    // @summary [Loop 2] step 2: for each month(month-year Map) for the employee Map
    for (const [yearMonth, allAllocatedDatesInTheMonth] of allocationYearMonthWise) {
      // @summary [Loop 3] step 3: for each date (@alias dates Map) in the month Map of the Employee Map
      [...allAllocatedDatesInTheMonth].forEach(([date, allocationFromFrontEnd]) => {
        // get allocation for employee for the particular date from database data(already fetched and Mapped in memory)
        const correspondingDatabaseAllocation = databaseAllocation?.get(resourceEmployeeId)?.get(yearMonth)?.get(date);

        // if allocation for corresponding date is not found in db then use frontend allocation else add both frontend
        //  allocation and database allocation for that particular date and that particular employee
        const frontEndPlusDatabaseAllocation = !correspondingDatabaseAllocation
          ? allocationFromFrontEnd
          : correspondingDatabaseAllocation + allocationFromFrontEnd;

        if (frontEndPlusDatabaseAllocation > 1) {
          findRowWhichAreOverLoaded(
            resourceEmployeeId,
            // for {1,2...9} add zero in front of it.
            `${yearMonth}-${date.toString().length === 1 ? `0${date}` : date}`,
            { correspondingDatabaseAllocation, allocationFromFrontEnd },
          );
        }
      });
    }
  });

  return {
    frontEndPlusDatabaseExceedingAllocation: frontEndOverlyAllocatedRow,
    onlyFrontEndExceedingAllocation: excessivelyAllocatedFromUserExcludingDatabase,
  };
};

const extractOnlyEmployeeAllocationDetails = (allResourceDetails, incomingDetails) => {
  /**
   * @var selectedEmployeesDbAllocationData contains extracted resource allocation details from database
   * fetched(allResourceDetails) which required for comparing next newly allocating details
   */

  /**
   * @var arrayElementToConsider save index of array of element(of allocation) to Set and use it to check
   * whether already element is saved to {@link onlyNecessaryDataForComputation} array inside reduce.
   */
  const arrayElementToConsider = new Set();
  const employeeWithOverlapDateInDatabase = incomingDetails.reduce(
    (onlyNecessaryDataForComputation, currentElementInIteration) => {
      allResourceDetails.forEach((ele, index) => {
        const isDateOverLapping = overLapBetweenDate(
          currentElementInIteration.start_date,
          currentElementInIteration.end_date,
          ele.start_date,
          ele.end_date,
        );

        // checking whether date are overlapping and employee id is same(i.e same employee date is overlapping)
        const isEmpIdSameAndDateOverlapping =
          isDateOverLapping && ele.resource_emp_id === currentElementInIteration.resource_emp_id;

        // if date is overlapping & employee is same && element is not saved in onlyNecessaryDataForComputation array
        // then true else false
        if (isEmpIdSameAndDateOverlapping && !arrayElementToConsider.has(index)) {
          arrayElementToConsider.add(index);
          onlyNecessaryDataForComputation.push(ele);
        }
      });
      return onlyNecessaryDataForComputation;
    },
    [],
  );

  return { selectedEmployeesDbAllocationData: employeeWithOverlapDateInDatabase };
};

/**
 *
 * @param {Set<Number>} indexOfRowsWhereThresholdExceed Set contains the index of overloaded
 * @param {Array<Object>} incomingFrontEndDetails
 * @param {Boolean} onlyFrontExceeded check whether its 1) frontEnd(only) threshold exceeding value [it wil be true]
 *  or 2) sum of (frontEnd + database) threshold exceeding value. [it will be false]
 */
const frontEndJoiLikeValidationGenerator = (
  indexOfRowsWhereThresholdExceed,
  incomingFrontEndDetails, // for future use case if necessary
  onlyFrontExceeded,
) => {
  return [...indexOfRowsWhereThresholdExceed].map((index) => {
    return {
      index,
      field: 'allocation',
      errorMessage: onlyFrontExceeded
        ? 'employee allocation exceeded 1 in the input itself, please check previous Allocation for Employee'
        : `employee allocation exceeded 1 under this Start Date and End Date, please check previous Allocation
         for Employee`,
    };
  });
};

/**
 * @summary check whether each employee allocation for new incoming months are not being overloaded(i.e more than 1).
 * @param {Array<Object>} allResourceDetails all resource allocation details from database
 * @param {Array<Object>} incomingDetails new resource allocation details from frontend.
 */
const verifyResourceAllocationThreshold = (allResourceDetails, incomingDetails) => {
  const { selectedEmployeesDbAllocationData } = extractOnlyEmployeeAllocationDetails(
    allResourceDetails,
    incomingDetails,
  );

  const frontEndGroupByEmployeeId = groupArrayOfDetailsByEmployeeIdMap(incomingDetails);
  const databaseAllocationGroupByEmpId = groupArrayOfDetailsByEmployeeIdMap(selectedEmployeesDbAllocationData);

  const frontEndResourceDateWiseAllocation = resourceDateWiseAllocationFunction(frontEndGroupByEmployeeId);
  const databaseResourceDateWiseAllocation = resourceDateWiseAllocationFunction(databaseAllocationGroupByEmpId);

  const { frontEndPlusDatabaseExceedingAllocation, onlyFrontEndExceedingAllocation } = verifyAllocationThreshold(
    frontEndResourceDateWiseAllocation,
    databaseResourceDateWiseAllocation,
    incomingDetails,
  );

  // create a Joi like array of Error, so it will useful to highlight rows in frontEnd for Both case
  // case 1: frontEnd allocation itself exceeding 1
  const onlyFrontEndExceedingRowError =
    onlyFrontEndExceedingAllocation.size > 0
      ? frontEndJoiLikeValidationGenerator(onlyFrontEndExceedingAllocation, incomingDetails, true)
      : [];

  // case 2: frontEnd allocation + backend(previously) allocation exceeding 1
  const frontEndPlusDatabaseExceedingError =
    frontEndPlusDatabaseExceedingAllocation.size > 0
      ? frontEndJoiLikeValidationGenerator(frontEndPlusDatabaseExceedingAllocation, incomingDetails, false)
      : [];

  return {
    exceededAllocationIndexArray: [
      ...new Set([...onlyFrontEndExceedingAllocation, ...frontEndPlusDatabaseExceedingAllocation]),
    ],
    frontEndPlusBackendExceedingAllocation: frontEndPlusDatabaseExceedingError,
    onlyFrontEndExceedingAllocation: onlyFrontEndExceedingRowError,
  };
};

module.exports = {
  verifyResourceAllocationThreshold,
};
