const {
  promToolSaveMaternitySchemaFunction,
  signUpSchema,
  loginSchema,
  auditToolSaveEmployeeSaveFunction,
  auditToolProjectSaveFunction,
  promToolSaveGroupDetailsSchemaFunction,
  resetPassword,
  roleSchema,
  deleteRoleSchema,
  promToolSaveRevenueDataSchema,
  promToolSaveManagementSchemaFunction,
  promToolResourcePlanningSchemaFunction,
  promToolUpdateResourcePlanningSchema,
  promToolAverageEngineeringCostSchema,
  promToolSaveClaimSchema,
  auditToolCostCenterSaveSchema,
  promToolUploadClaimSchemaFunction,
  promToolSaveSalaryRevisionSchemaFunction,
  promResourceAllocationSchemaFunction,
  promToolSaveProjectDataSchemaFunction,
  promToolSaveAOPSchemaFunction,
  auditToolNonClosedAuditCustomMailSchema,
  promToolUpdateGroupDetailsSchemaFunction,
  promToolSaveClaimsSchemaFunction,
  promToolRevenueSchemaFunction,
  promToolUploadPreviousExpSchemaFunction,
  promToolUploadResourceSkillDataSchemaFunction
} = require('../utils/validationSchema');
const constants = require('../utils/constants');
const appResponse = require('../utils/AppResponse');
const logger = require('../utils/logger');

const {
  fetchAllocationDetails,
  getEmployeeProjectCodes,
} = require('../services/promTool/promResourceAllocationService');
const {
  getAllPromToolEmployeeIdsInArray,
  getLatestSalaryOfEmployee,
  getAllPromToolEmpIdsAndTheirDOJ,
} = require('../services/promTool/resourceManagementService');
const {
  getAllPromGroupNameInArray,
  getAllPromGroupCodesInArray,
} = require('../services/promTool/organizationGroupMgmtService');
const { fetchAllPromProjectCodeInArray } = require('../services/promTool/projectDataService');
const { fetchAllExpenseTypeData } = require('../services/promTool/claimsService');
const { fetchAllEnggCostValue } = require('../services/promTool/averageEnggCostService');
const {
  fetchAllProjectStartAndEndDateUsingProjectCode,
  fetchAllProjectTypesInArray,
  fetchAllProjectStatusInArray,
  getAllPromProjectDetailsInArray,
  fetchAllProjectNamesInArray,
  fetchAllProjectCodesInArray,
} = require('../repositories/promTool/projectDataRepository');
const {
  fetchAllSkillDataInArray,
  fetchAllResourceStatusInArray,
  fetchAllStreamDataInArray,
  fetchAllJoinedAsDataInArray,
  fetchAllDesignationDataInArray,
  fetchAllLocationDataInArray,
  fetchAllResourceEmailIdsinArray,
} = require('../repositories/promTool/resourceManagementRepository');
const {
  getEmployeeRolesListService,
  getEmployeeDesignationListService,
} = require('../services/auditTool/employeeService');
const { fetchAllActiveResourceDataInArray } = require('../repositories/promTool/resourceManagementRepository');

// create Joi Error for Row Highlighting in frontEnd
const createJoiErrorDetailsForHighlighting = (errorResult, log = false, replaceBracketsInMessages = false) => {
  const { error } = errorResult;
  const valid = error == null; // return true or false

  if (!valid) {
    if (log) logger.error(error); // if we want log the error

    const errorDetails = error.details.map(({ message, path }) => ({
      indexValue: path[0],
      field: path[1],
      // \[[^\]]\]{1} => regex pattern to match only one occurrence/first of [all data within brackets included]
      errorMessage: replaceBracketsInMessages
        ? message.replace(/\[[^\]]\]{1}/gi, '').replace(/([.]{1})/gi, '') // return message by removing brackets
        : message, // return joi built in message as it is.};
    }));

    return { valid, errorDetails };
  }
  // if no error, then send valid condition(which will be true)
  return { valid, errorDetails: [] };
};

// audit tool and prom tool
const signUpValidation = (req, res, next) => {
  // validate the req.body to pass certain criteria.
  const result = signUpSchema.validate(req.body);
  const { error } = result; // check whether error exist from validation
  const valid = error == null;
  if (!valid) {
    logger.info(error);
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, error.message);
  }
  next();
};

// audit tool and prom tool
const loginValidation = (req, res, next) => {
  const result = loginSchema.validate(req.body);
  const { error } = result;
  const valid = error == null;
  if (!valid) {
    logger.info(error);
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, error.message);
  }
  next();
};

// audit tool and prom tool
const passwordValidation = (req, res, next) => {
  const result = resetPassword.validate(req.body);
  const { error } = result;
  const valid = error == null;
  if (!valid) {
    logger.info(error);
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, error.message);
  }
  next();
};

// only audit tool
const auditToolSaveEmployeeDataValidation = async (req, res, next) => {
  const allDesignationDataFromDb = await getEmployeeDesignationListService();
  const result = auditToolSaveEmployeeSaveFunction(req.body, { allDesignationDataFromDb });
  const { valid, errorDetails } = createJoiErrorDetailsForHighlighting(result);

  if (!valid) {
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, { errorDetails });
  }
  next();
};

const auditToolSaveProjectDataValidation = async (req, res, next) => {
  const auditToolRolesList = await getEmployeeRolesListService();
  const result = auditToolProjectSaveFunction(req.body, { auditToolRolesList });
  const { valid, errorDetails } = createJoiErrorDetailsForHighlighting(result);

  if (!valid) {
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, { errorDetails });
  }
  next();
};

// audit tool and Prom tool
const roleValidation = (req, res, next) => {
  const result = roleSchema.validate(req.body);
  const { error } = result;
  const valid = error == null;
  if (!valid) {
    logger.info(error);
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, error.message);
  }
  next();
};

// both audit tool and prom Tool
const deleteRoleValidation = (req, res, next) => {
  const result = deleteRoleSchema.validate(req.body);
  const { error } = result;
  const valid = error == null;
  if (!valid) {
    logger.info(error);
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, error.message);
  }
  next();
};

// prom Tool-> saveRevenueData api pre-validation
const promToolSaveRevenueDataValidation = async (req, res, next) => {
  // const result = promToolSaveRevenueDataSchema.validate(req.body, { abortEarly: false });
  const projectCodesArray = await fetchAllPromProjectCodeInArray();
  const projectDataArray = await getAllPromProjectDetailsInArray();
  const result = promToolRevenueSchemaFunction(req.body, { projectCodesArray, projectDataArray, abortEarly: false });
  const { valid, errorDetails } = createJoiErrorDetailsForHighlighting(result);
  if (!valid) {
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, { errorDetails });
  }
  next();
};

// prom Tool -> saveResourceData api pre-validation
const promToolSaveResourceDataValidation = async (req, res, next) => {
  // const [allPromEmployeeIds, allSkillData, allStreamDetails, allResourceStatus, allJoinedAsDetails, allGroupNames] =
  const [
    // allSkillData,
    allStreamDetails,
    allResourceStatus,
    allJoinedAsDetails,
    allGroupNames,
    allLocations,
    allDesignations,
    promToolEmployeeDateOfJoining,
    //promToolEmployeeDateOfJoining,
    //allresorceEmailIds,
  ] = await Promise.all([
    // await getAllPromToolEmployeeIdsInArray(),
    // await fetchAllSkillDataInArray(),
    await fetchAllStreamDataInArray(),
    await fetchAllResourceStatusInArray(),
    await fetchAllJoinedAsDataInArray(),
    await getAllPromGroupNameInArray(),
    await fetchAllLocationDataInArray(),
    await fetchAllDesignationDataInArray(),
    await getAllPromToolEmpIdsAndTheirDOJ(),

  ]);

  const result = promToolSaveManagementSchemaFunction(req.body, {
    // allPromEmployeeIds,
    // allSkillData,
    allResourceStatus,
    allStreamDetails,
    allJoinedAsDetails,
    allGroupNames,
    allLocations,
    allDesignations,
    promToolEmployeeDateOfJoining,
    //promToolEmployeeDateOfJoining,
    //allresorceEmailIds,
  });
  const { valid, errorDetails } = createJoiErrorDetailsForHighlighting(result, true);

  if (!valid) {
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, { errorDetails });
  }
  next();
};

const promToolSaveClaimsSchemaValidation = async (req, res, next) => {
  // const [allPromEmployeeIds, allSkillData, allStreamDetails, allResourceStatus, allJoinedAsDetails, allGroupNames] =
  const [onlyActiveResourceData] = await Promise.all([await fetchAllActiveResourceDataInArray()]);
  const result = promToolSaveClaimsSchemaFunction(req.body, {
    onlyActiveResourceData,
  });
  const { valid, errorDetails } = createJoiErrorDetailsForHighlighting(result, true);

  if (!valid) {
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, { errorDetails });
  }
  next();
};

const promToolSaveProjectDataValidation = async (req, res, next) => {
  const groupNameFromDatabase = (await getAllPromGroupNameInArray()) ?? [];
  if (groupNameFromDatabase.length === 0) {
    return appResponse.notContentForThisRequest(res, constants.NO_RECORD_FOUND);
  }

  const [allProjectTypes, allProjectStatus, promToolEmployeeIds] = await Promise.all([
    //await fetchAllProjectNamesInArray(),
    //await fetchAllProjectCodesInArray(),
    await fetchAllProjectTypesInArray(),
    await fetchAllProjectStatusInArray(),
    await getAllPromToolEmployeeIdsInArray(),
  ]);
  const result = promToolSaveProjectDataSchemaFunction(req.body, {
    //allprojectNames,
    //allprojectcodes,
    groupNameFromDatabase,
    promToolEmployeeIds,
    allProjectStatus,
    allProjectTypes,
  });

  const { valid, errorDetails } = createJoiErrorDetailsForHighlighting(result);

  if (!valid) {
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, { errorDetails });
  }
  next();
};

const promToolSaveResourcePlanningValidation = async (req, res, next) => {
  const allEngineeringCostFromDb = await fetchAllEnggCostValue(req);
  const projectCodesArray = await fetchAllPromProjectCodeInArray();
  const projectDataArray = await getAllPromProjectDetailsInArray();
  const result = promToolResourcePlanningSchemaFunction(req.body, {
    allEngineeringCostFromDb,
    projectCodesArray,
    projectDataArray,
  });
  const { valid, errorDetails } = createJoiErrorDetailsForHighlighting(result);

  if (!valid) {
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, { errorDetails });
  }
  next();
};

const promToolUpdateResourcePlanningValidation = (req, res, next) => {
  const result = promToolUpdateResourcePlanningSchema.validate(req.body, { abortEarly: false });
  const { valid, errorDetails } = createJoiErrorDetailsForHighlighting(result);

  if (!valid) {
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, { errorDetails });
  }
  next();
};

const promToolAverageEngineeringCostValidation = async (req, res, next) => {
  const allGroupNames = await getAllPromGroupNameInArray();

  const result = promToolAverageEngineeringCostSchema(req.body, { allGroupNames });
  const { valid, errorDetails } = createJoiErrorDetailsForHighlighting(result);

  if (!valid) {
    // if joi found error then send 422
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, { errorDetails });
  }
  next();
};

const promToolResourceAllocationValidation = async (req, res, next) => {
  const [promToolEmployeeIdsAndDateOfJoining, allocationFromDb, getAllProjectStartEndDateInfo] = await Promise.all([
    await getAllPromToolEmpIdsAndTheirDOJ(),
    await fetchAllocationDetails(),
    await fetchAllProjectStartAndEndDateUsingProjectCode(),
  ]);

  // store all employee id in Array(this is used to check existence of employee id in database)
  const onlyPromEmployeeIdsInArray = promToolEmployeeIdsAndDateOfJoining.map((ele) => ele.resource_emp_id);

  const empIdAndTheirDOJ = new Map(
    promToolEmployeeIdsAndDateOfJoining.map((ele) => [ele.resource_emp_id, ele.resource_doj]),
  );

  const employeeAndTheirProjectCode = await getEmployeeProjectCodes([
    ...new Set(
      req.body
        .filter((ele) => onlyPromEmployeeIdsInArray.includes(ele.resource_emp_id))
        .map((ele) => ele.resource_emp_id),
    ),
  ]);

  const employeeAndProjectDetails = {
    onlyPromEmployeeIdsInArray,
    empIdAndTheirDOJ,
    getAllProjectStartEndDateInfo,
    allocationFromDb,
    employeeAndTheirProjectCode,
  };

  // main validation will be performed inside this function
  const result = promResourceAllocationSchemaFunction(req.body, employeeAndProjectDetails);

  // create Joi Error for Row Highlighting in frontEnd
  const { valid, errorDetails } = createJoiErrorDetailsForHighlighting(result);

  if (!valid) {
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, { errorDetails });
  }
  next();
};

const promToolSaveClaimValidation = (req, res, next) => {
  const result = promToolSaveClaimSchema.validate(req.body, { abortEarly: false });
  // create Joi Error for Row Highlighting in frontEnd
  const { valid, errorDetails } = createJoiErrorDetailsForHighlighting(result);

  if (!valid) {
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, { errorDetails });
  }
  next();
};

const auditToolCostCenterValidation = (req, res, next) => {
  const result = auditToolCostCenterSaveSchema.validate(req.body, { abortEarly: false, allowUnknown: true });
  // create Joi Error for Row Highlighting in frontEnd
  const { valid, errorDetails } = createJoiErrorDetailsForHighlighting(result);

  if (!valid) {
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, { errorDetails });
  }
  next();
};

const promToolSalaryRevisionSaveValidation = async (req, res, next) => {
  const promToolEmployeeIds = await getAllPromToolEmployeeIdsInArray();
  const promToolEmployeeDateOfJoining = await getAllPromToolEmpIdsAndTheirDOJ();
  const latestSalaryRevisionDetails = await getLatestSalaryOfEmployee(
    req.body.filter((ele) => promToolEmployeeIds.includes(ele.resource_emp_id)).map((ele) => ele.resource_emp_id),
  );

  const result = promToolSaveSalaryRevisionSchemaFunction(req.body, {
    promToolEmployeeIds,
    latestSalaryRevisionDetails,
    promToolEmployeeDateOfJoining,
  });

  const { valid, errorDetails } = createJoiErrorDetailsForHighlighting(result);

  if (!valid) {
    // if joi found error then send 422
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, { errorDetails });
  }
  req.body = result.value;
  next();
};

const promUploadClaimValidation = async (req, res, next) => {
  const [employeeIds, projectCodesArray, expenseType, onlyActiveResourceData] = await Promise.all([
    await getAllPromToolEmployeeIdsInArray(),
    await fetchAllPromProjectCodeInArray(),
    await fetchAllExpenseTypeData(),
    await fetchAllActiveResourceDataInArray(),
  ]);
  const detailsFromDb = {
    employeeIds,
    projectCodesArray,
    onlyActiveResourceData,
    expenseTypeInArray: expenseType.map(({ expense_type: expType }) => expType),
  };

  const result = promToolUploadClaimSchemaFunction(req.body, detailsFromDb);
  const { valid, errorDetails } = createJoiErrorDetailsForHighlighting(result);

  if (!valid) {
    // if joi found error then send 422
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, { errorDetails });
  }
  next();
};

const promToolSaveAOPValidation = async (req, res, next) => {
  const [allGroupNames, allEmployeeIds] = await Promise.all([
    await getAllPromGroupNameInArray(),
    await getAllPromToolEmployeeIdsInArray(),
  ]);
  const result = promToolSaveAOPSchemaFunction(req.body, allGroupNames, allEmployeeIds);
  const { valid, errorDetails } = createJoiErrorDetailsForHighlighting(result);

  if (!valid) {
    // if joi found error then send 422
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, { errorDetails });
  }
  next();
};

const promToolSaveGroupValidation = async (req, res, next) => {
  const employeeIds = await getAllPromToolEmployeeIdsInArray();
  const allGroupCodes = (await getAllPromGroupCodesInArray()) ?? [null];
  const allGroupName = (await getAllPromGroupNameInArray()) ?? [null];

  const result = promToolSaveGroupDetailsSchemaFunction(req.body, { allGroupCodes, allGroupName, employeeIds });
  const { valid, errorDetails } = createJoiErrorDetailsForHighlighting(result);

  if (!valid) {
    // if joi found error then send 422
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, { errorDetails });
  }
  next();
};

const promToolUpdateGroupValidation = async (req, res, next) => {
  const [employeeIds, allGroupCodes, allGroupNames] = await Promise.all([
    await getAllPromToolEmployeeIdsInArray(),
    await getAllPromGroupCodesInArray(),
    await getAllPromGroupNameInArray(),
  ]);

  const result = promToolUpdateGroupDetailsSchemaFunction(req.body, employeeIds, allGroupCodes, allGroupNames);
  const { valid, errorDetails } = createJoiErrorDetailsForHighlighting(result);

  if (!valid) {
    // if joi found error then send 422
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, { errorDetails });
  }
  next();
};

const auditToolNonClosedMailListAlteration = (requestBody) => {
  // all Emails are coming in a single string (ex: "abc@avinsystems.com, bbqu@avinsystems.com")
  // this below code will separate by common and add into array
  const { toMailList } = requestBody;
  return toMailList
    .split(',')
    .map((ele) => ele?.toString().trim())
    .filter((ele) => ele !== '');
};

const auditToolNonClosedAuditBodyValidation = async (req, res, next) => {
  req.body.toMailList = auditToolNonClosedMailListAlteration(req.body);
  const result = auditToolNonClosedAuditCustomMailSchema.validate(req.body, { abortEarly: false });
  const { error } = result;
  const valid = error == null;
  if (!valid) {
    logger.info(error);
    const [errorDetails, invalidEmailsArray] = error.details.reduce(
      ([errorDetail, invalidEmails], { message, path, context: { value } }) => {
        if (message === 'Only official Email ID is allowed') {
          // if error message is above condition then add email to invalid email array
          invalidEmails.push(value);
        }
        errorDetail.push({
          email: value,
          emailIndex: path[1],
          errorMessage: message,
        });
        return [errorDetail, invalidEmails];
      },
      [[], []],
    );

    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, {
      errorDetails,
      invalidEmailsArray,
    });
  }
  next();
};

const promToolSaveMaternityDetailsRequestValidation = async (req, res, next) => {
  const [promToolEmployeeDateOfJoining, employeeIds, allGroupNames] = await Promise.all([
    await getAllPromToolEmpIdsAndTheirDOJ(),
    await getAllPromToolEmployeeIdsInArray(),
    await getAllPromGroupNameInArray(),
  ]);
  const result = promToolSaveMaternitySchemaFunction(req.body, {
    employeeIds,
    allGroupNames,
    promToolEmployeeDateOfJoining,
  });

  const { valid, errorDetails } = createJoiErrorDetailsForHighlighting(result);

  if (!valid) {
    // if joi found error then send 422
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, { errorDetails });
  }
  next();
};



const promToolSaveResourceSkillDataValidation = async (req, res, next) => {
  const [employeeIds, onlyActiveResourceData, allSkillData] = await Promise.all([
    await getAllPromToolEmployeeIdsInArray(),
    await fetchAllActiveResourceDataInArray(),
    await fetchAllSkillDataInArray(),
  ]);
  const detailsFromDb = {
    employeeIds,
    onlyActiveResourceData,
    allSkillData,
  };
  const result = promToolUploadResourceSkillDataSchemaFunction(req.body, detailsFromDb);
  const { valid, errorDetails } = createJoiErrorDetailsForHighlighting(result);

  if (!valid) {
    // if joi found error then send 422
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, { errorDetails });
  }
  next();
};

const promToolSavePreviousExpValidation = async (req, res, next) => {
  const [employeeIds, onlyActiveResourceData] = await Promise.all([
    await getAllPromToolEmployeeIdsInArray(),
    await fetchAllActiveResourceDataInArray(),
  ]);
  const detailsFromDb = {
    employeeIds,
    onlyActiveResourceData,
  };
  const result = promToolUploadPreviousExpSchemaFunction(req.body, detailsFromDb);
  const { valid, errorDetails } = createJoiErrorDetailsForHighlighting(result);

  if (!valid) {
    // if joi found error then send 422
    return appResponse.unProcessableEntity(res, constants.INVALID_INPUT, { errorDetails });
  }
  next();
};
module.exports = {
  promToolSaveMaternityDetailsRequestValidation,
  auditToolNonClosedAuditBodyValidation,
  promUploadClaimValidation,
  signUpValidation,
  loginValidation,
  roleValidation,
  promToolSaveGroupValidation,
  auditToolSaveEmployeeDataValidation,
  passwordValidation,
  deleteRoleValidation,
  promToolSaveRevenueDataValidation,
  promToolSaveResourceDataValidation,
  promToolSaveProjectDataValidation,
  promToolSaveResourcePlanningValidation,
  promToolAverageEngineeringCostValidation,
  promToolResourceAllocationValidation,
  promToolSaveClaimValidation,
  auditToolSaveProjectDataValidation,
  auditToolCostCenterValidation,
  promToolSalaryRevisionSaveValidation,
  promToolUpdateGroupValidation,
  promToolSaveAOPValidation,
  promToolUpdateResourcePlanningValidation,
  // promToolSaveClaimsDataValidation,
  promToolSaveClaimsSchemaValidation,
  promToolSaveClaimsSchemaFunction,
  promToolSaveResourceSkillDataValidation,
  promToolSavePreviousExpValidation,
};
