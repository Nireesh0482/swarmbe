/* eslint-disable arrow-body-style */
/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
const { Op } = require('sequelize');
const auditReportsRepo = require('../../repositories/auditTool/auditReportsRepository');
const { dateRange, formatYmd, removeCommon, convertIntegerYearMonthToDate, dayjs } = require('../../utils/date');

const filterBasedOn = (request) => {
  const result = {};
  // if (request?.project_id) {
  //   result.project_id = request.project_id;
  // }
  if (request?.start_date) {
    const startDate = request.start_date;
    const auditStart = {
      [Op.gte]: startDate,
    };
    result.audit_start_date = auditStart;
  }
  if (request?.end_date) {
    const endDate = request.end_date;
    const auditEnd = {
      [Op.lte]: endDate,
    };
    result.audit_end_date = auditEnd;
  }
  if (request?.status) {
    result.status = request.status;
  }
  const costCenterCode = {
    [Op.eq]: null,
  };
  result.cost_center_code = costCenterCode;

  return result;
};

const filterBasedOnCostCenter = (request) => {
  const result = {};
  if (request?.start_date) {
    const startDate = request.start_date;
    const auditStart = {
      [Op.gte]: startDate,
    };
    result.audit_start_date = auditStart;
  }
  if (request?.end_date) {
    const endDate = request.end_date;
    const auditEnd = {
      [Op.lte]: endDate,
    };
    result.audit_end_date = auditEnd;
  }
  if (request?.status) {
    result.status = request.status;
  }
  const projectId = {
    [Op.eq]: null,
  };
  result.project_id = projectId;

  return result;
};

const filterBasedOnAllCostCenterSingleAudit = (request) => {
  const result = {};
  if (request?.audit_id) {
    result.audit_id = request.audit_id;
  }
  if (request?.start_date) {
    const startDate = request.start_date;
    const auditStart = {
      [Op.gte]: startDate,
    };
    result.audit_start_date = auditStart;
  }
  if (request?.end_date) {
    const endDate = request.end_date;
    const auditEnd = {
      [Op.lte]: endDate,
    };
    result.audit_end_date = auditEnd;
  }
  if (request?.status) {
    result.status = request.status;
  }
  const projectId = {
    [Op.eq]: null,
  };
  result.project_id = projectId;

  return result;
};
const filterBasedOnAllAuditSingleCostCenter = (request) => {
  const result = {};
  if (request?.cost_center_code) {
    result.cost_center_code = request.cost_center_code;
  }
  if (request?.start_date) {
    const startDate = request.start_date;
    const auditStart = {
      [Op.gte]: startDate,
    };
    result.audit_start_date = auditStart;
  }
  if (request?.end_date) {
    const endDate = request.end_date;
    const auditEnd = {
      [Op.lte]: endDate,
    };
    result.audit_end_date = auditEnd;
  }
  if (request?.status) {
    result.status = request.status;
  }
  // const projectId = {
  //   [Op.eq]: null,
  // };
  // result.project_id = projectId;

  return result;
};

const allFiltersBasedCostCenter = (request) => {
  const result = {};
  if (request?.cost_center_code) {
    result.cost_center_code = request.cost_center_code;
  }
  if (request?.audit_id) {
    result.audit_id = request.audit_id;
  }
  if (request?.start_date) {
    const startDate = request.start_date;
    const auditStart = {
      [Op.gte]: startDate,
    };
    result.audit_start_date = auditStart;
  }
  if (request?.end_date) {
    const endDate = request.end_date;
    const auditEnd = {
      [Op.lte]: endDate,
    };
    result.audit_end_date = auditEnd;
  }
  if (request?.status) {
    result.status = request.status;
  }
  return result;
};

const filterBasedOnProject = (request) => {
  const result = {};
  if (request?.start_date) {
    const startDate = request.start_date;
    const auditStart = {
      [Op.gte]: startDate,
    };
    result.audit_start_date = auditStart;
  }
  if (request?.end_date) {
    const endDate = request.end_date;
    const auditEnd = {
      [Op.lte]: endDate,
    };
    result.audit_end_date = auditEnd;
  }
  if (request?.status) {
    result.status = request.status;
  }
  const costCenterCode = {
    [Op.eq]: null,
  };
  result.cost_center_code = costCenterCode;

  return result;
};
const filterBasedOnAllProjectSingleAudit = (request) => {
  const result = {};
  if (request?.audit_id) {
    result.audit_id = request.audit_id;
  }
  if (request?.start_date) {
    const startDate = request.start_date;
    const auditStart = {
      [Op.gte]: startDate,
    };
    result.audit_start_date = auditStart;
  }
  if (request?.end_date) {
    const endDate = request.end_date;
    const auditEnd = {
      [Op.lte]: endDate,
    };
    result.audit_end_date = auditEnd;
  }
  if (request?.status) {
    result.status = request.status;
  }
  const costCenterCode = {
    [Op.eq]: null,
  };
  result.cost_center_code = costCenterCode;

  return result;
};
const filterBasedOnAllAuditSingleProject = (request) => {
  const result = {};
  if (request?.project_id) {
    result.project_id = request.project_id;
  }
  if (request?.start_date) {
    const startDate = request.start_date;
    const auditStart = {
      [Op.gte]: startDate,
    };
    result.audit_start_date = auditStart;
  }
  if (request?.end_date) {
    const endDate = request.end_date;
    const auditEnd = {
      [Op.lte]: endDate,
    };
    result.audit_end_date = auditEnd;
  }
  if (request?.status) {
    result.status = request.status;
  }

  return result;
};

const allFilters = (request) => {
  const result = {};
  if (request?.project_id) {
    result.project_id = request.project_id;
  }
  if (request?.audit_id) {
    result.audit_id = request.audit_id;
  }
  if (request?.start_date) {
    const startDate = request.start_date;
    const auditStart = {
      [Op.gte]: startDate,
    };
    result.audit_start_date = auditStart;
  }
  if (request?.end_date) {
    const endDate = request.end_date;
    const auditEnd = {
      [Op.lte]: endDate,
    };
    result.audit_end_date = auditEnd;
  }
  if (request?.status) {
    result.status = request.status;
  }
  return result;
};

const getAllProjectReportsData = async (request) => {
  // filter and send Only parameter required for Querying in Database,Ex:
  // Where :{
  //  audit_start_date : 2021-12-22
  // }
  let queryResult;
  if (request.project_id === 'All') {
    delete request.project_id;
    queryResult = filterBasedOn(request);
  } else {
    queryResult = filterBasedOnCostCenter(request);
  }
  let complianceAttributeCount;
  // get all Audits Based on Parameter
  const totalAudit = await auditReportsRepo.getAllAudits(queryResult);
  if (totalAudit.auditIdCount > 0) {
    // get Compliance(Yes or No)Count Data from Each Audit Report
    const getComplianceCount = await auditReportsRepo.getComplianceData(totalAudit.AllData);
    // get highest NC count and type
    const majorNCValue = getComplianceCount.finalNCCount;
    const majorNCcontributionObj = majorNCValue.reduce((max, obj) => (max.count > obj.count ? max : obj));

    // const majorNCValue = finalNCTypeCount[0];

    // const majorNCcontributionObj = majorNCValue.reduce((max, obj) => (max.count > obj.count ? max : obj)); // need to return types if two or more counts are max
    const NCListArr = [];
    majorNCValue.forEach((nclist) => {
      const ncCount = parseInt(nclist.count, 10);
      if (ncCount !== 0) {
        const typeCountValue = `${nclist.type}(${ncCount})`;
        NCListArr.push(typeCountValue);
      }
    });
    complianceAttributeCount = {
      totalAuditCount: totalAudit.auditIdCount,
      NonCompliance: getComplianceCount.totalNonComplianceCount,
      zeroNonCompliance: getComplianceCount.totalComplianceCount,
      majorNCcontribution: majorNCcontributionObj.type,
      // NonComplianceList: getComplianceCount.finalNCCount,
      NonComplianceList: NCListArr,

    };

    return complianceAttributeCount;
  }
};

// filters(status,start date and end date)
const getAuditsByProject = async (request) => {
  let queryResult;
  if (request.cost_center_code !== '') {
    if (request.audit_id[0] === 'All' && request.cost_center_code === 'All') {
      queryResult = filterBasedOnCostCenter(request);
    } else if (request.audit_id[0] === 'All' && request.cost_center_code !== '') {
      queryResult = filterBasedOnAllAuditSingleCostCenter(request);
    } else if (request.audit_id[0] !== '' && request.cost_center_code === 'All') {
      queryResult = filterBasedOnAllCostCenterSingleAudit(request);
    } else {
      queryResult = allFiltersBasedCostCenter(request);
    }
  } else {
    if (request.audit_id[0] === 'All' && request.project_id === 'All') {
      queryResult = filterBasedOnProject(request);
    } else if (request.audit_id[0] === 'All' && request.project_id !== '') {
      queryResult = filterBasedOnAllAuditSingleProject(request);
    } else if (request.audit_id[0] !== '' && request.project_id === 'All') {
      queryResult = filterBasedOnAllProjectSingleAudit(request);
    } else {
      queryResult = allFilters(request);
    }
  }

  const data = await auditReportsRepo.getAuditsByProject(queryResult);
  return data;
};

const getAuditReportByProject = async (result) => {
  let data;
  let query;
  let query1;
  let count = 0;
  let count3 = 0;
  let data1;
  let query2;
  let data2;
  const finalNCTypeCount = [];
  for (const report of result) {
    const complianceAttribute = report.compliance_attribute;
    const auditReportID = report.audit_report_name;
    // getting zeroNonCompliance count
    query = `select  COUNT(${complianceAttribute}) from ${auditReportID} where ${complianceAttribute}[1]='yes' OR ${complianceAttribute}[1]='YES' OR ${complianceAttribute}[1]='Yes'`;
    // query = `select  type,COUNT(${complianceAttribute}) filter (where ${complianceAttribute}[1]='yes'
    // OR ${complianceAttribute}[1]='YES' OR ${complianceAttribute}[1]='Yes') from ${auditReportID} GROUP BY type`;

    data = await auditReportsRepo.getAuditReportByProject(query);
    const count1 = data[0].count;
    count = parseInt(count, 10) + parseInt(count1, 10);
    // getting NonCompliance count
    query1 = `select  COUNT(${complianceAttribute}) from ${auditReportID} where ${complianceAttribute}[1]='no' OR ${complianceAttribute}[1]='NO' OR ${complianceAttribute}[1]='No'`;
    // for getting noncompliance list
    query2 = `select  type,COUNT(${complianceAttribute}) filter (where ${complianceAttribute}[1]='no' OR ${complianceAttribute}[1]='NO' OR ${complianceAttribute}[1]='No') from ${auditReportID} GROUP BY type`;
    // query1 = `select COUNT(${complianceAttribute}) from ${auditReportID} where ${complianceAttribute}[1]='no'
    // OR ${complianceAttribute}='NO' OR ${complianceAttribute}='No'`;

    data1 = await auditReportsRepo.getAuditReportByProject(query1);


    data2 = await auditReportsRepo.getAuditReport(query2);

    // for pareto table and chart data for no. NC's
    if (finalNCTypeCount.length === 0) {
      finalNCTypeCount.push(data2);
    } else {
      for (const total of data2) {
        const processArea = total.type;
        const processAreaNCCount = total.count;
        let checkDuplicate;
        const finalNCCount = finalNCTypeCount[0];
        for (const finalData of finalNCCount) {
          if (finalData.type === processArea) {
            finalData.count = parseInt(finalData.count, 10) + parseInt(processAreaNCCount, 10);
          } else {
            checkDuplicate = finalNCCount.some((item) => item.type === processArea);
          }
        }
        if (checkDuplicate === false) {
          if (processAreaNCCount !== '0') {
            finalNCCount.push({ type: processArea, count: processAreaNCCount });
          }
        }
      }
    }
    const count2 = data1[0].count;
    count3 = parseInt(count3, 10) + parseInt(count2, 10);
  }


  const majorNCValue = finalNCTypeCount[0];


  let majorNCcontributionObj = majorNCValue.reduce((max, obj) => (max.count > obj.count ? max : obj)); // need to return types if two or more counts are max

  if (majorNCcontributionObj.count === '0' || majorNCcontributionObj.count === 0) {
    majorNCcontributionObj.type = 'NA'
  }


  const NCListArr = [];
  majorNCValue.forEach((nclist) => {
    const ncCount = parseInt(nclist.count, 10);
    if (ncCount !== 0) {
      const typeCountValue = `${nclist.type}(${ncCount})`;
      NCListArr.push(typeCountValue);
    }
  });
  const complianceAttributeCount = {
    totalAuditCount: result.length,
    NonCompliance: count3,
    zeroNonCompliance: count,
    majorNCcontribution: majorNCcontributionObj.type,
    NonComplianceList: NCListArr,
  };
  return complianceAttributeCount;
};

// const getAuditReportByProject = async (result) => {
//   let data;
//   let query;
//   let query1;
//   let count = 0;
//   let count3 = 0;
//   let data1;

//   for (const report of result) {
//     const complianceAttribute = report.compliance_attribute;
//     const auditReportID = report.audit_report_name;
//     // getting zeroNonCompliance count
//     query = `select  COUNT(${complianceAttribute}) from ${auditReportID} where ${complianceAttribute}='yes' OR ${complianceAttribute}='YES' OR ${complianceAttribute}='Yes'`;
//     data = await auditReportsRepo.getAuditReportByProject(query);
//     const count1 = data[0].count;
//     count = parseInt(count, 10) + parseInt(count1, 10);
//     // getting NonCompliance count
//     query1 = `select  COUNT(${complianceAttribute}) from ${auditReportID} where ${complianceAttribute}='no' OR ${complianceAttribute}='NO' OR ${complianceAttribute}='No'`;
//     data1 = await auditReportsRepo.getAuditReportByProject(query1);
//     const count2 = data1[0].count;
//     count3 = parseInt(count3, 10) + parseInt(count2, 10);
//   }

//   const complianceAttributeCount = {
//     totalAuditCount: result.length,
//     NonCompliance: count3,
//     zeroNonCompliance: count,
//   };
//   return complianceAttributeCount;
// };

const getAllProjAudits = async (projectData) => {
  const finalData = [];
  let query1;
  let query2;
  let count3 = 0;
  let data1;
  let data2;
  let applicabilityCount = 0;
  let processComplianceIndex = 0;
  for (const proj of projectData) {
    const queryParams = {};
    if (proj.project_id) {
      queryParams.project_id = proj.project_id;
    } else {
      queryParams.cost_center_code = proj.cost_center_code;
    }
    const auditData = await auditReportsRepo.getAllAudits(queryParams);
    const projAuditData = auditData.AllData;
    if (auditData.AllData.length > 0) {
      for (const projAudit of projAuditData) {
        const complianceAttribute = projAudit.compliance_attribute;
        const auditReportID = projAudit.audit_report_name;
        query1 = `select COUNT(${complianceAttribute}) from ${auditReportID} where ${complianceAttribute}[1]='no' OR ${complianceAttribute}[1]='NO' OR ${complianceAttribute}[1]='No'`;
        data1 = await auditReportsRepo.getAuditReportByProject(query1);
        const count2 = data1[0].count;
        count3 = parseInt(count3, 10) + parseInt(count2, 10);
        query2 = `select COUNT(applicability) from ${auditReportID} where applicability[1]='Applicable' OR applicability[1]='Applicability'`;
        data2 = await auditReportsRepo.getApplicability(query2);
        const count4 = data2[0].count;
        applicabilityCount = parseInt(applicabilityCount, 10) + parseInt(count4, 10);
      }
      processComplianceIndex = [(applicabilityCount - count3) / applicabilityCount] * 100;
    } else {
      processComplianceIndex = 0;
    }
    let projORCostCenterName;
    if (proj.project_name) {
      projORCostCenterName = proj.project_name;
    } else {
      projORCostCenterName = proj.cost_center_name;
    }
    finalData.push({
      projectName: projORCostCenterName,
      'PCI in %': processComplianceIndex,
    });
  }
  return finalData;
};

const getmonthwiseNCData = async (request) => {
  let monthWiseData;
  if (request.project_id === 'All') {
    monthWiseData = await auditReportsRepo.getmonthwiseNCDataAllProjects(request);
  } else if (request.project_id !== '') {
    monthWiseData = await auditReportsRepo.getmonthwiseNCData(request);
  } else {
    monthWiseData = await auditReportsRepo.getmonthwiseCostCenterNCData(request);
  }
  return monthWiseData;
};

const sortYearMonthForParetoChart = (monthWiseData) => {
  const onlyYearMonthKeys = Object.keys(monthWiseData).filter((ele) => {
    return ele !== 'type' && ele !== 'count';
  }); // get only year-month(unsorted) keys as array of elements

  const sortedYearAndMonth = onlyYearMonthKeys
    .sort((a, b) => {
      const date1 = convertIntegerYearMonthToDate(a);
      const date2 = convertIntegerYearMonthToDate(b);
      if (dayjs(date2) > dayjs(date1)) return -1;
      if (!(dayjs(date2) > dayjs(date1))) return 1;
      return 0;
    }) // sort year month in order
    .reduce((yearMonthKeyValue, monthAsKey) => {
      yearMonthKeyValue[monthAsKey] = monthWiseData[monthAsKey];
      return yearMonthKeyValue;
    }, {}); // create object of year-month with its value

  return {
    // return original data with sorted monthYear data
    type: monthWiseData.type,
    count: monthWiseData.count,
    ...sortedYearAndMonth,
  };
};

const monthWiseNCCount = async (monthlyNCData, request) => {
  let query2;
  let data2;
  let totalNCsOfthatmonth = 0;
  const monthWiseClosedNCCount = [];
  const startDate = request.start_date.slice(0, -3);
  const endDate = request.end_date.slice(0, -3);
  const allRequestedMonths = dateRange(startDate, endDate);

  const requestedMonths = [];
  for (const monthNum of allRequestedMonths) {
    const month_year = monthNum.slice(0, -3);
    requestedMonths.push(month_year);
  }
  let totalTableArr = [];
  const auditDataMonthArr = [];
  for (const report of monthlyNCData) {
    const complianceAttribute = report.compliance_attribute;
    const auditReportID = report.audit_report_name;
    let auditStartMonth = report.audit_start_date;
    auditStartMonth = auditStartMonth.toISOString().slice(0, 7);
    let auditEndMonth = report.audit_end_date;
    auditEndMonth = auditEndMonth.toISOString().slice(0, 7);
    const allDataExistedMonths = dateRange(auditStartMonth, auditEndMonth);

    const dataExistedMonths = [];
    for (const monthNum of allDataExistedMonths) {
      const month_year = monthNum.slice(0, -3);
      dataExistedMonths.push(month_year);
    }
    auditDataMonthArr.push(auditEndMonth);
    // for getting noncompliance list
    query2 = `select  type,COUNT(${complianceAttribute}) filter (where ${complianceAttribute}[1]='no' OR ${complianceAttribute}[1]='NO' OR ${complianceAttribute}[1]='No') from ${auditReportID} GROUP BY type`;

    data2 = await auditReportsRepo.getAuditReport(query2);

    // for pareto table and chart data for no. NC's
    if (totalTableArr.length === 0) {
      totalTableArr = data2;
    } else {
      let checkDuplicate;
      for (const total of data2) {
        const processArea = total.type;
        const processAreaNCCount = total.count;
        for (const finalData of totalTableArr) {
          if (finalData.type === processArea) {
            finalData.count = parseInt(finalData.count, 10) + parseInt(processAreaNCCount, 10);
          } else {
            checkDuplicate = totalTableArr.some((item) => item.type === processArea);
          }
        }

        if (checkDuplicate === false) {
          totalTableArr.push({ type: processArea, count: processAreaNCCount });
        }
      }
    }
    if (totalTableArr.length > 0) {
      totalTableArr.forEach((element) => {
        dataExistedMonths.forEach((AuditEle) => {
          element[AuditEle] = parseInt(element.count, 10);
        });
      });
    }
    const removeCommonMonths = removeCommon(requestedMonths, dataExistedMonths);
    if (removeCommonMonths.length > 0) {
      removeCommonMonths.forEach((element) => {
        totalTableArr.forEach((AuditEle) => {
          AuditEle[element] = 0;
        });
      });
    }

    for (const auditCount of data2) {
      const type1 = auditCount.type;
      const NCCount1 = auditCount.count;
      totalNCsOfthatmonth = parseInt(NCCount1, 10) + parseInt(totalNCsOfthatmonth, 10);
    }
    const obj = {
      monthwiseCount: data2,
      auditMonth: auditEndMonth,
      totalNCsOfthatmonth,
    };
  }
  const removeCommonList = removeCommon(requestedMonths, auditDataMonthArr);
  if (monthWiseClosedNCCount.length > 0 && removeCommonList.length > 0) {
    const monthWiseClosedNCCountObj = monthWiseClosedNCCount[0].monthwiseCount;
    const monthwiseCount = [];
    for (const typeCount of monthWiseClosedNCCountObj) {
      const type1 = typeCount.type;
      monthwiseCount.push({ type: type1, count: 0 });
    }

    for (const NotExistedMonthZeroData of removeCommonList) {
      monthWiseClosedNCCount.push({
        monthwiseCount,
        auditMonth: NotExistedMonthZeroData,
        totalNCsOfthatmonth: 0,
      });
    }
  }

  monthWiseClosedNCCount.push(totalTableArr);
  const monthWiseClosedNCCountArr = monthWiseClosedNCCount[0];
  const formattedmonthsParetochartData = [];
  let formattedMonthsData;
  monthWiseClosedNCCountArr.forEach((v) => {
    formattedMonthsData = sortYearMonthForParetoChart(v);
    delete formattedMonthsData.count;
    const lastKey = Object.keys(formattedMonthsData).pop();
    formattedmonthsParetochartData.push(formattedMonthsData);
  });
  let lastKeyFormat;
  if (formattedmonthsParetochartData[0] !== null || formattedmonthsParetochartData[0] !== undefined) {
    lastKeyFormat = Object.keys(formattedmonthsParetochartData[0]).pop();
  }

  const sumOfLastMonth = formattedmonthsParetochartData.reduce((total, obj) => obj[lastKeyFormat] + total, 0);
  let cumulativeCountSum = 0;
  formattedmonthsParetochartData.forEach((cumulativeNCData) => {
    let cumulativePercentage = 0;

    cumulativeCountSum = parseInt(cumulativeNCData[lastKeyFormat], 10) + parseInt(cumulativeCountSum, 10);
    formattedMonthsData.cumulativeCountSum = cumulativeCountSum;

    cumulativePercentage = (cumulativeCountSum / sumOfLastMonth) * 100;
    if (Number.isNaN(cumulativePercentage)) {
      cumulativePercentage = 0;
    } else {
      cumulativePercentage = cumulativePercentage.toFixed(2);
    }
    cumulativeNCData.cumulativeCount = cumulativeCountSum;
    cumulativeNCData.cumulativePercentage = cumulativePercentage;
  });
  let monthlyNCSum = {
    type: 'Total',
  };

  requestedMonths.forEach((monthlyNCTotal) => {
    const totalNCSOfMonth = formattedmonthsParetochartData.reduce(
      (total, obj) => obj[monthlyNCTotal] + parseInt(total, 10),
      0,
    );
    monthlyNCSum[monthlyNCTotal] = totalNCSOfMonth;
  });
  formattedmonthsParetochartData.push(monthlyNCSum);
  return formattedmonthsParetochartData;
};

module.exports = {
  getAllProjectReportsData,
  getAuditsByProject,
  getAuditReportByProject,
  getAllProjAudits,
  getmonthwiseNCData,
  monthWiseNCCount,
};
