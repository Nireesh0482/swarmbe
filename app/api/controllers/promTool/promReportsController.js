const logger = require('../../utils/logger');
const appResponse = require('../../utils/AppResponse');
const constants = require('../../utils/constants');
const promReportsService = require('../../services/promTool/promReportsService');

const getResourceUtilizationHighLevelProject = async (req, res) => {
  try {
    const resourceRequest = req.body;
    // for single/multi/All project under the group
    const resourceUtilizationRecord = await promReportsService.getResourceUtilizationDataForProject(resourceRequest);

    // if data is empty from Database then no data is present Regarding that Project
    if (resourceUtilizationRecord.length === 0) {
      return appResponse.notContentForThisRequest(res, constants.NO_RECORD_FOUND);
    }
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, resourceUtilizationRecord);
  } catch (err) {
    logger.error(err);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const costUtilizationProjectHighLevel = async (req, res) => {
  try {
    const resourceRequest = req.body;
    const costUtilizationRecord = await promReportsService.getHighLevelCostUtilizationForProject(resourceRequest);
    if (costUtilizationRecord.length === 0) {
      return appResponse.notContentForThisRequest(res, constants.NO_RECORD_FOUND);
    }
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, costUtilizationRecord);
  } catch (err) {
    if (err.message === 'No ctc') {
      return appResponse.expectationFailed(res, err.cause);
    }
    logger.error(err);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const costUtilizationProjectDetailedLevel = async (req, res) => {
  try {
    const costRequestData = req.body;

    const costUtilizationDetailedRecord = await promReportsService.getDetailedLevelCostUtilizationForProject(
      costRequestData,
    );
    if (costUtilizationDetailedRecord.length === 0) {
      return appResponse.notContentForThisRequest(res, constants.NO_RECORD_FOUND);
    }
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, costUtilizationDetailedRecord);
  } catch (error) {
    // if (error.message === 'No ctc') {
    //   return appResponse.expectationFailed(res, error.cause);
    // }
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// reports- resourceAllocation, here we will show the result based on selected filters.
// resource allocation high level and detailed level for single employee, multiple employees or all employees
// get employee allocation in projects  for every week based on selected start month and end month
const getHighLevelProjByResource = async (req, res) => {
  try {
    const resourceRequest = req.body;
    const reportsInfo = await promReportsService.getReportsData(resourceRequest);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, reportsInfo);
  } catch (err) {
    if (err.type === TypeError) {
      return appResponse.notFound(res, constants.CANNOT_FETCH);
    }
    logger.error(err);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// get project revenue reports based on selected start month and end month
const getProjectRevenue = async (req, res) => {
  try {
    const request = req.body;
    const revenueInfo = await promReportsService.getProjRevenue(request);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, revenueInfo);
  } catch (err) {
    logger.error(err);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// get resource and cost utilization based on project and selected start month and end month
const getResourceCostUtilization = async (req, res) => {
  try {
    const request = req.body;
    const resourceCostInfo = await promReportsService.getResourceCostUtilization(request);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, resourceCostInfo);
  } catch (error) {
    // if (error.message === 'No ctc') {
    //   return appResponse.expectationFailed(res, error.cause);
    // }
    if (error.message === 'No ResourceAllocation') {
      return appResponse.notContentForThisRequest(res, constants.NO_RECORD_FOUND);
    }
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// get project contribution based on project or for all projects
const getProjectContribution = async (req, res) => {
  try {
    const request = req.body;
    const revenueInfo = await promReportsService.getProjContribution(request);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, revenueInfo);
  } catch (error) {
    // if (error.message === 'No ctc') {
    //   return appResponse.expectationFailed(res, error.cause);
    // }
    if (error.message === 'No ResourceAllocation') {
      return appResponse.notContentForThisRequest(res, constants.NO_RECORD_FOUND);
    }
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// get Claims Reports
const getClaimsByStatus = async (req, res) => {
  try {
    const request = req.body;
    const claimsInfo = await promReportsService.getClaimsByStatus(request);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, claimsInfo);
  } catch (err) {
    logger.error(err);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// get generic reports
const genericReports = async (req, res) => {
  try {
    const request = req.body;
    const claimsInfo = await promReportsService.getAllGenericReports(request);
    if (claimsInfo) {
      return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, claimsInfo);
    }
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  } catch (error) {
    // if (error.message === 'No ctc') {
    //   return appResponse.expectationFailed(res, error.cause);
    // }
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// get resource and costUtilization based on project and selected start month and end month
const getGroupResourceAOPReports = async (req, res) => {
  try {
    const request = req.body;
    const resourceCostInfo = await promReportsService.getResourceUtilizationAOP(request);
    console.log('resourceCostInfo', resourceCostInfo);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, resourceCostInfo);
  } catch (err) {
    logger.error(err);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// get project revenue reports based on selected start month and end month
const getGRPRevenue = async (req, res) => {
  try {
    const request = req.body;
    const revenueInfo = await promReportsService.getGRPWiseRevenue(request);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, revenueInfo);
  } catch (err) {
    logger.error(err);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const getCostAndRevenueContributionReports = async (req, res) => {
  try {
    const request = req.body;
    const revenueInfo = await promReportsService.getCostAndRevenueContribution(request);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, revenueInfo);
  } catch (error) {
    // if (error.message === 'No ctc') {
    //   return appResponse.expectationFailed(res, error.cause);
    // }
    if (error.message === 'No ResourceAllocation') {
      return appResponse.notContentForThisRequest(res, constants.NO_RECORD_FOUND);
    }
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const getResourceUtilizationCountByProjectGroup = async (req, res) => {
  try {
    const requestBody = req.body;
    const startAndEndForAllocationFilter =
      await promReportsService.fetchAndPerformStartAndEndDateCalculationForGroupByCount(requestBody);

    // if project start & end date return empty record, in UI it will shown as empty records
    if (startAndEndForAllocationFilter.start_date == null || startAndEndForAllocationFilter.end_date == null) {
      // as start_date and end_date are null which indicates no project present in database which means no records
      const emptyResponse = {
        projectGroupMonthWiseDataWithTotal: [],
        projectGroupMonthWiseChartData: [],
      };
      return appResponse.success(res, constants.NO_RECORD_FOUND, emptyResponse);
    }
    // -------------------------------- calculate process start here -----------------------------

    if (requestBody.projectGroup[0] === 'All') {
      const allResourceUtilizationCount = await promReportsService.getResourceUtilizationCountForAllProject(
        startAndEndForAllocationFilter,
        requestBody,
      );
      return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, allResourceUtilizationCount);
    }

    if (requestBody.projectGroup.length > 1) {
      const allResourceUtilizationCount = await promReportsService.getResourceUtilizationCountForMultipleGroup(
        startAndEndForAllocationFilter,
        requestBody,
      );

      return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, allResourceUtilizationCount);
    }

    if (requestBody.projectGroup.length === 1) {
      const allResourceUtilizationCount = await promReportsService.getResourceUtilizationCountForSingleGroup(
        startAndEndForAllocationFilter,
        requestBody,
      );
      return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, allResourceUtilizationCount);
    }

    return appResponse.conflict(res, constants.SUCCESSFULLY_FETCHED);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const getAvgEnggCostReports = async (req, res) => {
  try {
    const request = req.body;
    const avgEnggInfo = await promReportsService.getAvgEnggCostReports(request);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, avgEnggInfo);
  } catch (err) {
    logger.error(err);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

module.exports = {
  getResourceUtilizationHighLevelProject,
  getHighLevelProjByResource,
  costUtilizationProjectHighLevel,
  costUtilizationProjectDetailedLevel,
  getProjectRevenue,
  getProjectContribution,
  getResourceCostUtilization,
  getClaimsByStatus,
  genericReports,
  getGroupResourceAOPReports,
  getGRPRevenue,
  getCostAndRevenueContributionReports,
  getResourceUtilizationCountByProjectGroup,
  getAvgEnggCostReports,
};
