/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
/* eslint-disable arrow-body-style */
const dayjs = require('dayjs');
const isoWeek = require('dayjs/plugin/isoWeek');
const { getWeek, parseISO, startOfMonth } = require('date-fns');
const localeData = require('dayjs/plugin/localeData');
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter');
const updateLocale = require('dayjs/plugin/updateLocale');
const utc = require('dayjs/plugin/utc');
const isBetween = require('dayjs/plugin/isBetween');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
const minMax = require('dayjs/plugin/minMax');

dayjs.extend(isSameOrBefore);
dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(localeData);
dayjs.extend(updateLocale);
dayjs.extend(isoWeek);
dayjs.extend(isSameOrAfter);
dayjs.extend(minMax);

// specify dayjs to use monday as start of week
dayjs.updateLocale('en', {
  weekStart: 1,
});

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD');
const todayDate = () => dayjs().format('YYYY-MM-DD');
const differenceInDays = (expiryDate) => dayjs(formatDate(expiryDate)).diff(todayDate(), 'days');
const differenceInMonths = (expiryDate) => dayjs(todayDate()).diff(formatDate(expiryDate), 'months');
const differenceInYears = (expiryDate) => dayjs(todayDate()).diff(formatDate(expiryDate), 'years');

const mailFormatDate = (date) => dayjs(date).format('DD-MMMM-YYYY');
const expiryDate = () => dayjs().add(90, 'day').format();

const todayDateInLocalTimeZone = () => dayjs().format();
const getCurrentMonthEndDate = () => dayjs().endOf('month').format('YYYY-MM-DD');

const convertUTCtoLocalTime = (date) => dayjs.utc(date.substring(0, 23));

// used custom method, instead of Built-in(dayjs().toArray()) Due to invalid Array format
const dateToArray = (date) => {
  return dayjs(date)
    .format('YYYY-M-D-H-m')
    .split('-')
    .map((ele) => parseInt(ele, 10));
};

// "Apr-21" ===> "Apr-2021" ==> "2021-04-01"
const convertMonthToDate = (str) => {
  return dayjs(str.replace(str.split('-')[1], (20 + str.split('-')[1]).toString())).format('YYYY-MM-DD');
};

const convertDatabaseDateToFrontEndDate = (str) => {
  return dayjs(str).utc(str).format('YYYY-MM');
};

// 2021-12-31T18:30:00.000Z(from database)  => 2021-12-31
const convertUTCDateToLocalDate = (date) => dayjs(date).utc(true).format('YYYY-MM-DD');

const convertFullIntegerDateToYearMonthString = (date) => {
  return dayjs(date).local().format('YYYY-MM');
};

const convertISOtimeToLocalTimezoneAndFormat = (ISOdate) => {
  // input: 2021-12-31T18:30:00.000Z ==> 2022-01-01 ==> output: 2022-01(format to YEAR-MONTH)
  // this is from database for (2022-01-01), it has time zone difference so it wil show 2021-12-31T18:30:00.000Z
  // so we can to convert to local timezone using below function
  return dayjs(ISOdate).utc(ISOdate).format('YYYY-MM');
};

// 2022-04 => 2022-04-01
const convertYearMonthToDate = (str) => {
  return dayjs(`${str.split('-')[0]}-${str.split('-')[1]}`).format('YYYY-MM-DD');
};

// 2022-04 => Apr-22
const convertYearMonthToStringDate = (str) => {
  return dayjs(`${str.split('-')[0]}-${str.split('-')[1]}`).format('MMM-YY');
};

// 2022-04 => 2022-04-31
const getMonthEndDateFromDate = (date) => dayjs(convertYearMonthToDate(date)).endOf('month').format('YYYY-MM-DD');

// "Apr-22"  => 2022-04-31
const getMonthEndFromDate = (date) => dayjs(convertMonthToDate(date)).endOf('month').format('YYYY-MM-DD');

// "Apr-22" => 2022-04-03(considering 3rd of Month) to avoid timezone difference
const convertMonthYearStringToYearMonthInteger = (date) => dayjs(convertMonthToDate(date)).date(3).format('YYYY-MM-DD');

// "2022-10-24" => "2022-10-31"
const getMonthEndDateFromNormalDate = (date) => dayjs(date).endOf('month').format('YYYY-MM-DD');

// 2022-04-05 => 2022-04
const convertToNumericMonthYear = (date) => dayjs(date).format('YYYY-MM');

// 2022-04-02 => Apr-22
const getShortMonthAbbreviation = (date) => dayjs(date).format('MMM-YY');

const dateAGreaterThanDateB = (dateA, dateB) => dayjs(dateA).isAfter(dateB);

const dateAGreaterThanOrEqualToDateB = (dateA, dateB) => dayjs(dateA).isSameOrAfter(dateB);

const convertDateToIntegerArray = (date) => {
  return date
    .toString()
    .split('-')
    .map((ele) => parseInt(ele, 10));
};

const formatToLocalTime = (date) => dayjs.utc(date).local().format('YYYY-MM-DD');

const formatToLocalTimeWithZone = (date) => dayjs.utc(date).local().format();

const currentYearFirstDay = () => dayjs().startOf('year').format('YYYY-MM-DD');

const currentYearEndDay = () => dayjs().endOf('year').format('YYYY-MM-DD');

const isDateBSameOrBeforeDateA = (dateA, dateB) => {
  return dayjs(dateB).isSameOrBefore(dateA);
};
const isDateBSameOrAfterDateA = (dateA, dateB) => {
  return dayjs(dateB).isSameOrAfter(dateA);
};

const isDateBetweenWithCustomParameter = (date, startDate, endDate, granularity, precision) => {
  return dayjs(date).isBetween(startDate, endDate, granularity, precision);
};

const dateWithUTC = (date) => dayjs.utc(date).local();

const endOfTheWeekDate = (date) => {
  // isoWeek consider monday as the Start of week.
  return dayjs(date).endOf('isoWeek').format('YYYY-MM-DD');
};

const addOneDay = (date) => dayjs(dateWithUTC(date)).add(1, 'day').format();

const addOneDayAndFormat = (date) => dayjs(dateWithUTC(date)).add(1, 'day').format('YYYY-MM-DD');

// 2022-05-07 => 7
const getOnlyDateFromFullDate = (date) => dayjs(date).get('date');
const getOnlyYearFromFullDate = (date) => dayjs(date).get('year');

const monthOfDate = (date) => dayjs(dateWithUTC(date)).format('MM');

const getMonthYearFormat = (date) => dayjs(convertMonthToDate(date)).endOf('month').format('YYYY-MM');
const formatToYearMonth = (date) => dayjs.utc(date).local().format('YYYY-MM'); // 2022-04
const getNumericYearMonthFromStringDate = (date) => dayjs(convertMonthToDate(date)).format('YYYY-MM');
const formatYmd = (date) => date.toISOString().slice(0, 7);
const convertISO = (date) => date.toISOString().slice(0, 10);
const formatEndYmd = (date) => date.toISOString().slice(0, 7);
const convertTZtoLocal = (date) => date.toLocaleDateString('en-CA');

const convertIntegerYearMonthToDate = (str) => {
  return dayjs(str).utc(true).local();
};

const getPreviousDateFromDate = (date) => dayjs(date).subtract(1, 'day').format('YYYY-MM-DD');

const add30DaysToDate = (date) => dayjs(date).add(30, 'day').format('YYYY-MM-DD');

// return previous month end
const getPreviousMonthEndDate = () => dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

const getWeekOfDate = (date) => {
  const parsedDateToLocalTime = parseISO(dayjs(date).add(5.6, 'h').format());
  return getWeek(parsedDateToLocalTime, {
    weekStartsOn: 1,
    firstWeekContainsDate: 1,
  });
};
const checkWeekSharedBetweenTwoDifferentYear = (date) => {
  const dateFormatted = dateWithUTC(date);
  const weekStartDateWithYear = dateFormatted;
  const weekEndDateWithYear = endOfTheWeekDate(dateFormatted);
  if (dayjs(weekStartDateWithYear).get('year') === dayjs(weekEndDateWithYear).get('year')) {
    return getWeekOfDate(date);
  }
  return dayjs(date).isoWeek() + 1;
};

const DateFomMonthYear = (date) => {
  const [monthInString, yearInNumber] = date.split('-');
  const months = dayjs.monthsShort();
  const monthInNumber =
    months.findIndex((monthNum) => {
      return monthNum === monthInString;
    }) + 1;
  // used 03(Ex:2022-04-03) for date to avoid some time zone difference if it occurs
  const dateInString = `20${yearInNumber}-${monthInNumber}-03`;
  return dateInString; // Example output: 2022-04-03
};

const eachMonthYearInAndBetweenDates = (start_date, end_date) => {
  let startDate = formatToLocalTimeWithZone(start_date);
  const endDate = formatToLocalTimeWithZone(end_date);
  const allMonthsInFilters = [];
  while (dayjs(startDate).isSameOrBefore(endDate)) {
    allMonthsInFilters.push(dayjs(startDate).format('MMM-YY'));
    startDate = dayjs.utc(startDate).add(1, 'months').local().format();
  }
  return allMonthsInFilters;
};

const getTotalWeeks = (date) => {
  const [year, month] = convertDateToIntegerArray(date);
  const firstOfMonth = new Date(year, month - 1, 1);
  let day = firstOfMonth.getDay() || 6;
  day = day === 1 ? 0 : day;
  if (day) day -= 1;
  let diff = 7 - day;
  const lastOfMonth = new Date(year, month, 0);
  const lastDate = lastOfMonth.getDate();
  if (lastOfMonth.getDay() === 1) diff -= 1;
  const result = Math.ceil((lastDate - diff) / 7);
  return result + 1;
};

// input (startDate:2022-05-28, endDate:2022-10-24)
const allMonthsInMonthYearFormatForFilters = (start_date, end_date) => {
  let startDate = formatToLocalTimeWithZone(start_date);
  const endDate = formatToLocalTimeWithZone(getMonthEndDateFromNormalDate(end_date)); // end of month date from date
  const allMonthsInFilters = new Set();
  while (dayjs(startDate).isSameOrBefore(endDate, 'month')) {
    allMonthsInFilters.add(dayjs(startDate).format('YYYY-MM'));
    startDate = dayjs.utc(startDate).add(1, 'months').local().format();
  }
  return [...allMonthsInFilters];
};

const getFullDate = (startDate, endDate) => {
  const addstartDate = '-01';
  const newStartDate = startDate.concat(addstartDate);
  let parsedEndDate = endDate;
  parsedEndDate = parsedEndDate.replace(/^"|"$/g, '');
  const splitedData = parsedEndDate.split('-');
  const lastday = function (y, m) {
    return new Date(y, m, 0).getDate();
  };
  const newEndDate1 = lastday(splitedData[0], splitedData[1]);
  const newEndDate2 = '-' + `${newEndDate1}`;
  const newEndDate = endDate.concat(newEndDate2);
  return { newStartDate, newEndDate };
};

const dateRange = (startDate, endDate) => {
  const start = startDate.split('-');
  const end = endDate.split('-');
  const startYear = parseInt(start[0], 10);
  const endYear = parseInt(end[0], 10);
  const dates = [];
  for (let i = startYear; i <= endYear; i += 1) {
    const endMonth = i !== endYear ? 11 : parseInt(end[1], 10) - 1;
    const startMon = i === startYear ? parseInt(start[1], 10) - 1 : 0;
    for (let j = startMon; j <= endMonth; j = j > 12 ? j % 12 || 11 : j + 1) {
      const month = j + 1;
      // const displayMonth = month < 10 ? '0' + month : month;
      const displayMonth = month < 10 ? `0${month}` : month;
      dates.push([i, displayMonth, '01'].join('-'));
    }
  }
  return dates;
};

const removeCommon = (requestedMonths, totalMonths) => {
  const spreaded = [...requestedMonths, ...totalMonths];
  return spreaded.filter((el) => {
    return !(requestedMonths.includes(el) && totalMonths.includes(el));
  });
};

const weeksCountEveryMonth = (startYear, startMonth) => {
  const firstOfMonth = new Date(startYear, startMonth - 1, 1);
  let day = firstOfMonth.getDay() || 6;
  day = day === 1 ? 0 : day;
  if (day) {
    day -= 1;
  }
  let diff = 7 - day;
  const lastOfMonth = new Date(startYear, startMonth, 0);
  const lastDate = lastOfMonth.getDate();
  if (lastOfMonth.getDay() === 1) {
    diff -= 1;
  }
  const monthlyWeekCount = Math.ceil((lastDate - diff) / 7);
  return monthlyWeekCount + 1;
};

const getTodayAndNextMonthStartAndEndDates = () => {
  const todayDates = todayDateInLocalTimeZone();
  const nextMonthDate = dayjs().add(1, 'month');
  const nextMonthStartDate = dayjs(nextMonthDate).startOf('month').add(1, 'hour').format();
  const nextMonthEndDate = dayjs(nextMonthDate).endOf('month').subtract(1, 'hour').format();
  const currentMonthDate = dayjs().add(0, 'month');
  const currentMonthStartDate = dayjs(currentMonthDate).startOf('month').format('YYYY-MM-DD');
  const currentMonthEndDate = dayjs(currentMonthDate).endOf('month').format('YYYY-MM-DD');

  return { todayDates, nextMonthStartDate, nextMonthEndDate, currentMonthStartDate, currentMonthEndDate };
  // return { todayDates, nextMonthStartDate, nextMonthEndDate };
};

const getTodayAndNextMonthTwentyForthDates = () => {
  const todayLocalDate = dayjs().local().format('YYYY-MM-DD');
  const nextMonthTwentyForth = dayjs().add(1, 'month').date(24).format('YYYY-MM-DD');
  return { todayLocalDate, nextMonthTwentyForth };
};

const getWeeksInMonth = (dataExistedYear, dataExistedMonth) => {
  // function getWeeksInMonth(dataExistedYear, dataExistedMonth) {
  let year = dataExistedYear;
  let month = dataExistedMonth;
  const weeks = [];
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  let dayOfWeek = firstDay.getDay();
  let start;
  let oldstart;
  let end;

  for (let i = 1; i < daysInMonth + 1; i++) {
    // console.log('x.toString().length==', x.toString().length);

    if (dayOfWeek === 1 || i === 1) {
      const x = i;
      let startStrJoined;
      if (x.toString().length === 1) {
        startStrJoined = `${year}-${month}-0${i}`;
      } else startStrJoined = `${year}-${month}-${i}`;
      start = startStrJoined;
    }

    if (dayOfWeek === 0 || i === daysInMonth) {
      const x = i;
      let endStrJoined;
      if (x.toString().length === 1) {
        endStrJoined = `${year}-${month}-0${i}`;
      } else endStrJoined = `${year}-${month}-${i}`;
      end = endStrJoined;

      if (start) {
        weeks.push({
          start: start,
          end: end,
        });
        start = null;
      }
    }

    dayOfWeek = new Date(year, month - 1, i + 1).getDay();
  }

  return weeks;
};

const sortInMonthYearOrderForIntegerDate = (resourceData) => {
  const monthAsKeys = Object.keys(resourceData);
  const sortedMonths = monthAsKeys.sort((a, b) => {
    const date1 = convertIntegerYearMonthToDate(a);
    const date2 = convertIntegerYearMonthToDate(b);
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

const overLapBetweenDate = (startDateA, endDateA, startDateB, endDateB) => {
  /**
   * @example date A : { start_date_A: '2022-05-07', end_date_A: '2022-06-30' },
   * @example date B : { start_date_B: '2022-05-11', end_date_B: '2023-06-15' }
   * @summary above example can be used to test the overlap of dates as dateAOverlapWithDateB
   *  will give false and dateBOverlapWithDateA with give true.
   */

  // 2022-05-07 is between (2022-05-11 , 2022-06-15)
  // 2022-06-30 is between (2022-05-11 , 2022-06-15)
  const dateAOverlapWithDateB =
    dayjs(startDateA).isBetween(startDateB, endDateB, null, '[]') ||
    dayjs(endDateA).isBetween(startDateB, endDateB, null, '[]');

  // 2022-05-11 is between (2022-05-07 , 2022-06-15)
  // 2022-06-15 is between (2022-05-07 , 2022-06-15)
  const dateBOverlapWithDateA =
    dayjs(startDateB).isBetween(startDateA, endDateA, null, '[]') ||
    dayjs(endDateB).isBetween(startDateA, endDateA, null, '[]');

  // at least one condition should be true out of 4 condition
  return dateBOverlapWithDateA || dateAOverlapWithDateB; // return Boolean
};

/**
 *
 * @param {String} start_date
 * @param {String} end_date
 * @example Input : start_date :2022-11-17 , end_date: 2023-02-28
 * Output: [
  { start_date: '2022-11-17', end_date: '2022-11-30' },
  { start_date: '2022-12-01', end_date: '2022-12-31' },
  { start_date: '2023-01-01', end_date: '2023-01-31' },
  { start_date: '2023-02-01', end_date: '2023-02-28' }
]
 * @returns array of element of (start_date and end_date) which is month wise and in between
 * the main start_date and end_Date
 */
const divideMonthsFromStartAndDate = (start_date, end_date) => {
  const dividedMonthsArray = [];
  let currentMonthStartDate = start_date;
  let currentMonthEndDate = getMonthEndDateFromNormalDate(currentMonthStartDate);
  const finalEndDate = end_date;

  // checks whether dynamically created end_date of each month is before the final end_date(parameter end_date)
  while (dayjs(currentMonthEndDate).isBefore(finalEndDate)) {
    dividedMonthsArray.push({ start_date: currentMonthStartDate, end_date: currentMonthEndDate });

    // by adding one day currentMonthEndDate , we will get next month 1st date
    const nextMonthStartDate = addOneDayAndFormat(currentMonthEndDate);
    // assign the above month start date
    currentMonthStartDate = nextMonthStartDate;
    // from start date calculate month end date
    currentMonthEndDate = getMonthEndDateFromNormalDate(nextMonthStartDate);
  }

  // as final condition will fail, push the last month start date and end_date(end_date of parameter)
  dividedMonthsArray.push({ start_date: currentMonthStartDate, end_date: finalEndDate });

  return dividedMonthsArray;
};

/**
 *
 * @param {Array<Object>} arrayOfDatePairs which contains multiple start_date and end_date in each element of array.
 * @example input :[
 * { start_date: '2022-06-02', end_date: '2022-06-13',},
 * { start_date: '2022-06-16', end_date: '2022-08-24',};
 * ]
 * output: [ '2022-06', '2022-07', '2022-08' ]
 * @returns {Array<String>} contains all unique year-month in a array considering all start_date and end_date.
 */
const getAllMonthsFromArrayOfDates = (arrayOfDatePairs) => {
  const allMonthsInFilters = new Set();
  arrayOfDatePairs.forEach(({ start_date, end_date }) => {
    let startDate = formatToLocalTimeWithZone(start_date);
    const endDate = formatToLocalTimeWithZone(getMonthEndDateFromNormalDate(end_date)); // end of month date from date

    while (dayjs(startDate).isSameOrBefore(endDate, 'month')) {
      allMonthsInFilters.add(dayjs(startDate).format('YYYY-MM'));
      startDate = dayjs.utc(startDate).add(1, 'months').local().format();
    }
  });
  return [...allMonthsInFilters];
};

const getEarliestStartAndPreviousMonthAsEndDate = (arrayOfStartDates) => {
  const startDateKey = Object.keys(arrayOfStartDates[0]).find(
    (key) => key === 'start_date' || key.includes('start_date'),
  );
  const earlyStartDate = arrayOfStartDates.reduce((earliestStartDate, currentElementInIteration) => {
    if (earliestStartDate === '') {
      earliestStartDate = currentElementInIteration[startDateKey];
      return earliestStartDate;
    }
    if (dayjs(currentElementInIteration[startDateKey]).isBefore(earliestStartDate)) {
      earliestStartDate = currentElementInIteration[startDateKey];
    }
    return earliestStartDate;
  }, '');

  // return the earliest start_date and end_date as previous month last date
  return {
    start_date: earlyStartDate,
    end_date: getPreviousMonthEndDate(),
    startDateYearMonth: dayjs(earlyStartDate).format('YYYY-MM'), // for Year-Month format
    endDateYearMonth: dayjs(getPreviousMonthEndDate()).format('YYYY-MM'),
  };
};

const getMaximumStartAndEndDateFromArrayOfData = (arrayOfStartAndEndDates) => {
  // check whether key inside object contains start_date.if yes return start_date else
  // search for start_date inside string(Ex: project_start_date), then use project_start_date
  // (or any other key which contains start_date) as Key for comparison.[same for end_date]
  const startDateKey = Object.keys(arrayOfStartAndEndDates[0]).find(
    (key) => key === 'start_date' || key.includes('start_date'),
  );
  const endDateKey = Object.keys(arrayOfStartAndEndDates[0]).find(
    (key) => key === 'end_date' || key.includes('end_date'),
  );

  const earlyStartAndLatestEnd = arrayOfStartAndEndDates.reduce((finalStartAndEndDate, currentElementInIteration) => {
    if (!finalStartAndEndDate.start_date && !finalStartAndEndDate.end_date) {
      finalStartAndEndDate.start_date = currentElementInIteration[startDateKey];
      finalStartAndEndDate.end_date = currentElementInIteration[endDateKey];
      return finalStartAndEndDate;
    }
    if (dayjs(currentElementInIteration[startDateKey]).isBefore(finalStartAndEndDate.start_date)) {
      finalStartAndEndDate.start_date = currentElementInIteration[startDateKey];
    }
    if (dayjs(currentElementInIteration[endDateKey]).isAfter(finalStartAndEndDate.end_date)) {
      finalStartAndEndDate.end_date = currentElementInIteration[endDateKey];
    }
    return finalStartAndEndDate;
  }, {});
  const { start_date, end_date } = earlyStartAndLatestEnd;
  // return the earliest start_date and latest end_date from array of Objects

  return {
    start_date,
    end_date,
    startDateYearMonth: dayjs(start_date).format('YYYY-MM'), // for Year-Month format
    endDateYearMonth: dayjs(end_date).format('YYYY-MM'),
  };
};

const isDateAYearMonthGreaterThanDateBYearMonth = (dateA, dateB) => {
  // input dateA:Dec-22 , date: May-23
  return dayjs(convertMonthYearStringToYearMonthInteger(dateA)).isAfter(
    convertMonthYearStringToYearMonthInteger(dateB),
    'month',
  );
};

const latestYearMonthFromArray = (arrayOfYearMonth) => {
  // [Jan-22 Feb-22 Mar-22 Apr-22 May-22 Jun-22 Jul-22 Aug-22 Sep-22 Oct-22 Nov-22]

  const allYearMonthFormattedInDaysObject = [...arrayOfYearMonth].map((ele) => {
    return dayjs(convertMonthYearStringToYearMonthInteger(ele));
  });
  // returns Nov-22 as it is the latest Month_year in array
  return dayjs.max(allYearMonthFormattedInDaysObject).format('MMM-YY');
};

const getPreviousMonthDatesFromCurrentDate = () => {
  const date = new Date();
  // const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth(), 0);
  // const firstDayFormat = formatToLocalTime(firstDay);
  const lastdayFormat = formatToLocalTime(lastDay);
  return lastdayFormat;
};

const checkMonthOverLapBetweenDate = (startDateA, endDateA, startDateB, endDateB) => {
  /**
   * @example date A : { start_date_A: '2022-05', end_date_A: '2022-07' },
   * @example date B : { start_date_B: '2022-05', end_date_B: '2023-06' }
   */
  const dateAOverlapWithDateB =
    dayjs(startDateA).isBetween(startDateB, endDateB, 'month', '[]') ||
    dayjs(endDateA).isBetween(startDateB, endDateB, 'month', '[]');

  const dateBOverlapWithDateA =
    dayjs(startDateB).isBetween(startDateA, endDateA, 'month', '[]') ||
    dayjs(endDateB).isBetween(startDateA, endDateA, 'month', '[]');

  // at least one condition should be true out of 4 condition
  return dateBOverlapWithDateA || dateAOverlapWithDateB; // return Boolean
};

const isDateAYearMonthGreaterThanDateBYearMonthOfProject = (dateA, dateB, dateC) => {
  // input dateA:Dec-22 , date: May-23
  const data1 = dayjs(convertMonthYearStringToYearMonthInteger(dateA)).isAfter(
    convertMonthYearStringToYearMonthInteger(dateB),
    'month',
  );
  const data2 = dayjs(convertMonthYearStringToYearMonthInteger(dateA)).isBefore(
    convertMonthYearStringToYearMonthInteger(dateC),
    'month',
  );
  return { data1, data2 };
};

const getShortMonthYearAbbreviation = (date) => dayjs(date).format('YYYY-MMM');

const currentDate = dayjs().date();

// const areDatesEqual = (date1, date2) => {
//   let date = date1.length === 10 ? date1 : new Date(date1).toISOString()
//   const formattedDate1 = date.length === 10 ? new Date(new Date(date).setDate(new Date(date).getDate())) : new Date(date.split('T')[0])
//   // const formattedDate1 = new Date(date1);
//   const formattedDate2 = date2.length === 10 ? new Date(new Date(date2).setDate(new Date(date2).getDate())) : new Date(date2.split('T')[0])
//   // const formattedDate2 = new Date(date2);
//   // const modifiedDate1 = new Date(formattedDate1.setDate(formattedDate1.getDate() )).toISOString().split('T')[0];
//   // const modifiedDate2 = new Date(formattedDate2.setDate(formattedDate2.getDate() - 1)).toISOString().split('T')[0];
//   const modifiedDate1 = new Date(formattedDate1.setDate(formattedDate1.getDate())).toISOString().split('T')[0]
//   const modifiedDate2 = new Date(formattedDate2.setDate(formattedDate2.getDate())).toISOString().split('T')[0]
//   return modifiedDate1 === modifiedDate2;
// };

const areDatesEqual = (dbDate, uiDate) => {
  let dbStringDate = new Date(dbDate).toISOString();
  const formattedDate1 = new Date(dbStringDate.split('T')[0]);
  const formattedDate2 = uiDate.length === 10 ? new Date(new Date(new Date(uiDate).setDate(new Date(uiDate).getDate() - 1)).toISOString().split('T')[0]) : new Date(uiDate.split('T')[0]);
  const modifiedDate1 = new Date(formattedDate1).toISOString();
  const modifiedDate2 = new Date(formattedDate2).toISOString();
  return modifiedDate1.split('T')[0] === modifiedDate2.split('T')[0];
};

module.exports = {
  latestYearMonthFromArray,
  getMaximumStartAndEndDateFromArrayOfData,
  getAllMonthsFromArrayOfDates,
  divideMonthsFromStartAndDate,
  overLapBetweenDate,
  addOneDayAndFormat,
  getMonthEndDateFromNormalDate,
  allMonthsInMonthYearFormatForFilters,
  differenceInDays,
  dateToArray,
  mailFormatDate,
  expiryDate,
  formatDate,
  convertMonthToDate,
  getMonthEndFromDate,
  getShortMonthAbbreviation,
  convertDateToIntegerArray,
  formatToLocalTime,
  getTotalWeeks,
  getWeekOfDate,
  dayjs,
  endOfTheWeekDate,
  addOneDay,
  monthOfDate,
  startOfMonth,
  dateWithUTC,
  checkWeekSharedBetweenTwoDifferentYear,
  DateFomMonthYear,
  formatToLocalTimeWithZone,
  eachMonthYearInAndBetweenDates,
  getMonthEndDateFromDate,
  convertYearMonthToDate,
  convertYearMonthToStringDate,
  getFullDate,
  dateRange,
  removeCommon,
  weeksCountEveryMonth,
  convertDatabaseDateToFrontEndDate,
  convertISOtimeToLocalTimezoneAndFormat,
  todayDateInLocalTimeZone,
  convertUTCtoLocalTime,
  getTodayAndNextMonthStartAndEndDates,
  formatYmd,
  convertISO,
  getTodayAndNextMonthTwentyForthDates,
  formatEndYmd,
  convertTZtoLocal,
  getWeeksInMonth,
  convertIntegerYearMonthToDate,
  sortInMonthYearOrderForIntegerDate,
  convertFullIntegerDateToYearMonthString,
  getMonthYearFormat,
  convertUTCDateToLocalDate,
  formatToYearMonth,
  isDateBSameOrBeforeDateA,
  isDateBSameOrAfterDateA,
  todayDate,
  getNumericYearMonthFromStringDate,
  convertToNumericMonthYear,
  getPreviousDateFromDate,
  getOnlyDateFromFullDate,
  getCurrentMonthEndDate,
  currentYearFirstDay,
  currentYearEndDay,
  isDateBetweenWithCustomParameter,
  getPreviousMonthEndDate,
  getEarliestStartAndPreviousMonthAsEndDate,
  add30DaysToDate,
  getPreviousMonthDatesFromCurrentDate,
  checkMonthOverLapBetweenDate,
  dateAGreaterThanDateB,
  isDateAYearMonthGreaterThanDateBYearMonth,
  dateAGreaterThanOrEqualToDateB,
  isDateAYearMonthGreaterThanDateBYearMonthOfProject,
  getShortMonthYearAbbreviation,
  currentDate,
  differenceInMonths,
  differenceInYears,
  getOnlyYearFromFullDate,
  areDatesEqual,
};
