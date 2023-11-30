const constants = require('../../utils/constants');
const appResponse = require('../../utils/AppResponse');
const logger = require('../../utils/logger');
const auditReportsService = require('../../services/auditTool/auditReportsService');
const projectService = require('../../services/auditTool/projectService');
const costCenterService = require('../../services/auditTool/costCenterService');
const { formatToYearMonth, getCurrentMonthEndDate } = require('../../utils/date');

const getAllProjectReports = async (req, res) => {
  try {
    const request = req.query;
    const allprojSummary = await auditReportsService.getAllProjectReportsData(request);
    // monthwise NC,cummulative data
    const monthlyNCData = await auditReportsService.getmonthwiseNCData(request);
    const monthlyNCCount = await auditReportsService.monthWiseNCCount(monthlyNCData);
    if (!allprojSummary.dataPresent) {
      return appResponse.notFound(res, constants.NO_RECORD_FOUND, allprojSummary);
    }
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, allprojSummary);
  } catch (error) {
    logger.error(error);
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  }
};

const getAuditReportByProject = async (req, res) => {
  const request = req.query;
  try {
    if (request.start_date === '' && request.end_date === '') {
      request.start_date = new Date();
      request.end_date = new Date();
      request.start_date = formatToYearMonth(request.start_date);
      request.end_date = formatToYearMonth(request.end_date);
    }
    if (request.start_date && request.end_date) {
      const addstartDate = '-01';
      request.start_date = request.start_date.concat(addstartDate);
      let parsedEndDate = request.end_date;
      parsedEndDate = parsedEndDate.replace(/^"|"$/g, '');
      const splitedData = parsedEndDate.split('-');
      const lastday = function (y, m) {
        return new Date(y, m, 0).getDate();
      };
      const newEndDate1 = lastday(splitedData[0], splitedData[1]);
      const newEndDate2 = '-' + `${newEndDate1}`;
      request.end_date = request.end_date.concat(newEndDate2);
    }
    if (request.start_date !== '' && request.end_date === '') {
      const addstartDate = '-01';
      request.start_date = request.start_date.concat(addstartDate);
      request.end_date = new Date();
      request.end_date = getCurrentMonthEndDate(request.end_date);
    }
    // process compliance index
    let processComplianceIndex;
    if (request.project_id !== '') {
      const projectAuditData = await projectService.getAllProjects();
      processComplianceIndex = await auditReportsService.getAllProjAudits(projectAuditData);
    } else {
      const costCenterAuditData = await costCenterService.getAllCostCenters();
      processComplianceIndex = await auditReportsService.getAllProjAudits(costCenterAuditData);
    }
    let monthlyNCCount;
    if (request.project_id === 'All') {
      // monthwise NC,cummulative data
      if (request.start_date && request.end_date) {
        const monthlyNCData = await auditReportsService.getAuditsByProject(request);

        // const monthlyNCData = await auditReportsService.getmonthwiseNCData(request);
        monthlyNCCount = await auditReportsService.monthWiseNCCount(monthlyNCData, request);
      }
      const auditSummary = await auditReportsService.getAllProjectReportsData(request);
      if (auditSummary) {
        return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, {
          auditSummary,
          processComplianceIndex,
          monthlyNCCount,
        });
      }
      return appResponse.notFound(res, constants.NO_RECORD_FOUND, auditSummary);
    }
    // else {
    const result = await auditReportsService.getAuditsByProject(request);
    if (result.length > 0) {

      const auditSummary = await auditReportsService.getAuditReportByProject(result);
      // month wise NC,cumulative data
      if (request.start_date && request.end_date) {
        const monthlyNCData = await auditReportsService.getAuditsByProject(request);

        // const monthlyNCData = await auditReportsService.getmonthwiseNCData(request);

        monthlyNCCount = await auditReportsService.monthWiseNCCount(monthlyNCData, request);
      }
      if (auditSummary) {
        return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, {
          auditSummary,
          processComplianceIndex,
          monthlyNCCount,
        });
      }
    }

    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  } catch (error) {
    logger.error(error);
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  }
};

module.exports = {
  getAllProjectReports,
  getAuditReportByProject,
};
