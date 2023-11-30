/* eslint-disable max-len */
const logger = require('../../utils/logger');
const appResponse = require('../../utils/AppResponse');
const constants = require('../../utils/constants');
const promResourceAllocationService = require('../../services/promTool/promResourceAllocationService');
const {
  validateDuplicateDataForTwoFields,
  validateDuplicateDataForFourFields,
  compareNewAndExistingDatabaseDataForTwoFields,
} = require('../../helpers/helperFunctions');
const promResourceAllocationRepository = require('../../repositories/promTool/promResourceAllocationRepository');

// get allocation Details such as [0.1,0.2,0.25]
const getAllocationDetails = async (req, res) => {
  try {
    const allocationDetails = await promResourceAllocationService.fetchAllocationDetails();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, allocationDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  }
};

// get allocation details for particular project and their employee and employee's manager Details
const getAllocationDetailsByProjectID = async (req, res) => {
  try {
    const projectCodeId = req.body.project_code;
    const projectAllocationDetails = await promResourceAllocationService.getAllocationDetailsByProject(projectCodeId);
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, projectAllocationDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const deleteResourceAllocationDetails = async (req, res) => {
  try {
    const requestBody = req.body;
    const deletedDetails = await promResourceAllocationService.deleteResourceAllocationDetailsService(requestBody);
    if (deletedDetails === 0 || deletedDetails === null) {
      return appResponse.conflict(res, constants.UPDATE_FAIL);
    }
    return appResponse.success(res, constants.DATA_UPDATED);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// add new allocation resource to database,if already exist for project,then update it.
const updatedAllocationResourceDetails = async (req, res) => {
  try {
    const resourceAllocationDetails = req.body;

    // -----------------validate Duplicate Fields from frontend-----------
    const validateDuplicateElements = validateDuplicateDataForFourFields(
      resourceAllocationDetails,
      'project_code',
      'resource_emp_id',
      'start_date',
      'end_date',
    );

    if (validateDuplicateElements.length > 0) {
      return appResponse.duplicateElementFound(res, constants.DUPLICATE_ENTRIES, validateDuplicateElements);
    }

    // -------------- verify Employee Supervisor combination --------------
    const verifyEmployeeAndSupervisorCombination =
      await promResourceAllocationService.verifyEmployeeAndSupervisorCombination(resourceAllocationDetails);

    if (verifyEmployeeAndSupervisorCombination.length > 0) {
      return appResponse.methodNotAllowed(res, constants.EMPLOYEE_DETAILS_DOES_NOT_MATCH, {
        employeeSupervisorDuplicateData: verifyEmployeeAndSupervisorCombination,
      });
    }

    // -------------------- validated and save to database--------------
    // validate existing records updating and new records for threshold(allocation more than 1)
    // and if success add allocation details to database
    const projectAllocationDetails = await promResourceAllocationService.updateAllocationResourceService(
      resourceAllocationDetails,
    );

    // check whether duplicate data present when compared with database details
    if (projectAllocationDetails.duplicateResourcePresent) {
      return appResponse.methodNotAllowed(res, constants.DUPLICATE_ENTRIES, {
        duplicateDatabaseData: projectAllocationDetails.dataInfo.duplicateResourceIndexValue,
      });
    }

    if (projectAllocationDetails.thresholdCrossForUpdatingExistingData) {
      return appResponse.expectationFailed(res, constants.ALLOCATION_CROSSED, {
        onlyForExistingUpdate: true,
        indexDetails: projectAllocationDetails.duplicateResourceIndexValue,
      });
    }

    // if allocation of employee is crossing more than 1
    if (projectAllocationDetails.thresholdExceeded) {
      return appResponse.expectationFailed(res, constants.ALLOCATION_CROSSED, {
        onlyForExistingUpdate: false,
        indexDetails: projectAllocationDetails.allocationDetails,
      });
    }
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, projectAllocationDetails);
  } catch (err) {
    logger.error(err);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// add project plan details[project_code,month_year,planned_resource,planned_cost] to database
const addProjectResourcePlanDetails = async (req, res) => {
  try {
    const projectDetails = req.body;
    const validateDuplicateResourcePlanFromFrontEnd = validateDuplicateDataForTwoFields(
      projectDetails,
      'project_code',
      'month_year',
    );
    if (validateDuplicateResourcePlanFromFrontEnd.length > 0) {
      return appResponse.methodNotAllowed(res, constants.DUPLICATE_ENTRIES, validateDuplicateResourcePlanFromFrontEnd);
    }

    const allProjectResourcePlanDetails = await promResourceAllocationRepository.getAllProjectResourcePlan();

    const validateResourceDuplicateDataWithDatabase = compareNewAndExistingDatabaseDataForTwoFields(
      projectDetails,
      allProjectResourcePlanDetails,
      'project_code',
      'month_year',
    );

    if (validateResourceDuplicateDataWithDatabase.length > 0) {
      return appResponse.duplicateElementFound(
        res,
        constants.DUPLICATE_ENTRIES,
        validateResourceDuplicateDataWithDatabase,
      );
    }
    if (
      validateDuplicateResourcePlanFromFrontEnd.length === 0 &&
      validateResourceDuplicateDataWithDatabase.length === 0
    ) {
      // add project plan details to database=> project_code, month_year, planned_resource, planned_cost
      // planned_cost will be calculated in promResourceAllocationServices before adding to Database.
      const addProjectResourcePlanToDb = await promResourceAllocationService.addProjectResourcePlanAndCostToDatabase(
        projectDetails,
      );
      if (addProjectResourcePlanToDb) {
        return appResponse.created(res, constants.INSERTED_SUCCESSFULLY, addProjectResourcePlanToDb);
      }
    }
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      if (error.errors[0].message === 'id must be unique') {
        const errorValue = error.errors[0].value.split('_');
        return appResponse.conflict(
          res,
          { message: constants.DUPLICATE_ENTRIES },
          { fullDetail: error.errors[0].value, monthYear: errorValue.slice(-1)[0] },
        );
      }
      return appResponse.conflict(res, constants.DUPLICATE_RECORD, error.parent.message);
    }
    // // average cost for the months needs to be added to database before calculating planned_cost
    // if (error.message.split('_')[0] === 'NoAverageCost') {
    //   return appResponse.expectationFailed(res, constants.NO_AVERAGE_COST, error.message.split('_')[1]);
    // }
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// add project plan details[project_code,month_year,planned_resource,planned_cost] to database
const updateProjectResourcePlanDetails = async (req, res) => {
  try {
    const projectDetails = req.body;
    // add project plan details to database => project_code, month_year, planned_resource, planned_cost
    // planned_cost will be calculated in promResourceAllocationServices before adding to Database.
    const addProjectResourcePlanToDb = await promResourceAllocationService.updateProjectResourcePlanAndCostToDatabase(
      projectDetails,
    );
    if (addProjectResourcePlanToDb) {
      return appResponse.success(res, constants.INSERTED_SUCCESSFULLY, addProjectResourcePlanToDb);
    }
    return appResponse.conflict(res, constants.NOT_INSERTED);
  } catch (error) {
    // average cost for the months needs to be added to database before calculating planned_cost
    if (error.message.split('_')[0] === 'NoAverageCost') {
      return appResponse.expectationFailed(res, constants.NO_AVERAGE_COST, error.message.split('_')[1]);
    }
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// get api for fetching all resource plan details(including planned_cost and planned_resource) for all projects
const getAllProjectResourcePlanDetails = async (req, res) => {
  try {
    const filter = req.body;
    const allProjectResourcePlanData = await promResourceAllocationService.getAllProjectResourcePlanAndCostFromDb(
      filter,
    );
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, allProjectResourcePlanData);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

module.exports = {
  deleteResourceAllocationDetails,
  getAllocationDetails,
  addProjectResourcePlanDetails,
  getAllocationDetailsByProjectID,
  updatedAllocationResourceDetails,
  getAllProjectResourcePlanDetails,
  updateProjectResourcePlanDetails,
};
