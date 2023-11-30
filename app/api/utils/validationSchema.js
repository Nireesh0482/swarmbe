/* eslint-disable object-curly-newline */
/* eslint-disable arrow-body-style */
/* eslint-disable max-len */
/* eslint-disable newline-per-chained-call */
const dayjs = require('dayjs');
const Joi = require('joi');
const { joiPassword } = require('joi-password');
const {
  getOnlyDateFromFullDate,
  formatDate,
  isDateBetweenWithCustomParameter,
  dateAGreaterThanDateB,
  dateAGreaterThanOrEqualToDateB,
  isDateAYearMonthGreaterThanDateBYearMonthOfProject,
  checkMonthOverLapBetweenDate,
} = require('./date');

// validation for email,email should contain domain name as @avinsystems.com
const emailValidation = (value, helpers) => {
  const domain = value.substring(value.indexOf('@') + 1).toLowerCase();
  if (!(domain === 'avinsystems.com')) return helpers.error('any.invalid');
  return value;
};

const signUpSchema = Joi.object().keys({
  name: Joi.string().min(2).max(50).required(),
  employeeID: Joi.string().alphanum().required(),
  emailID: Joi.string()
    .email()
    .required()
    .custom(emailValidation, 'Email domain Validation')
    .message({ 'any.invalid': 'Only official Email ID is allowed' }),
  // used joi password library to validate password
  password: joiPassword
    .string()
    .min(8)
    .max(32)
    .minOfSpecialCharacters(1)
    .minOfLowercase(1)
    .minOfUppercase(1)
    .minOfNumeric(1)
    .noWhiteSpaces()
    .required()
    .messages({
      'password.minOfUppercase': '{#label} must contain Minimum of {#min} uppercase character',
      'password.minOfLowercase': '{#label} must contain Minimum of {#min} lowercase character',
      'password.minOfSpecialCharacters': '{#label} must contain Minimum of {#min} special character',
      'password.minOfNumeric': '{#label} must contain Minimum of {#min} Numeric character',
      'password.noWhiteSpaces': '{#label} must not contain any white space',
    })
    .label('Password'),

  domain: Joi.string().valid('AvinSystem', 'avin', 'Avin').messages({ 'any.only': '{{#label}} is Invalid' }),
  confirm: Joi.any()
    .equal(Joi.ref('password'))
    .required()
    .label('Confirm password')
    .messages({ 'any.only': '{{#label}} does not match' }),
});

const resetPassword = Joi.object().keys({
  token: Joi.string().required(),
  password: joiPassword
    .string()
    .min(8)
    .max(32)
    .minOfSpecialCharacters(1)
    .minOfLowercase(1)
    .minOfUppercase(1)
    .minOfNumeric(1)
    .noWhiteSpaces()
    .required()
    .messages({
      'password.minOfUppercase': '{#label} must contain Minimum of {#min} uppercase character',
      'password.minOfLowercase': '{#label} must contain Minimum of {#min} lowercase character',
      'password.minOfSpecialCharacters': '{#label} must contain Minimum of {#min} special character',
      'password.minOfNumeric': '{#label} must contain Minimum of {#min} Numeric character',
      'password.noWhiteSpaces': '{#label} must not contain any white space',
    })
    .label('password'),

  confirmpassword: Joi.any()
    .equal(Joi.ref('password'))
    .required()
    .label('Confirm password')
    .messages({ 'any.only': '{{#label}} does not match' }),
});

// applicable both audit and prom Tool
const loginSchema = Joi.object().keys({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const auditToolSaveEmployeeSaveFunction = (requestBody, detailsFromDb) => {
  const { allDesignationDataFromDb } = detailsFromDb;
  // 'Emp ID': Joi.string().pattern(/^[0][0-9]*$/).required(),
  const auditToolSaveEmployeeDataElement = Joi.object().keys({
    key: Joi.number().allow('', null),
    sl_no: Joi.number().allow('', null),
    emp_id: Joi.string()
      .pattern(/[a-zA-Z0-9]{4,}/)
      .label('Employee ID')
      .messages({ 'string.pattern.base': '{{#label}} can contain only number or alphabets with at least 4 character.' })
      .required(),
    emp_name: Joi.string()
      .pattern(/^\d+$/, { invert: true })
      .pattern(/^([a-zA-Z]+\s)*[a-zA-Z]+$/)
      .trim()
      .label('Employee Name')
      .messages({
        'string.pattern.base':
          '{{#label}} can contain only alphabets. Make sure no white space are present Before or after {{#label}}',
        'string.trim': '{{#label}} contains trailing white spaces either before or after.please remove it.',
      })
      .required(),
    email_id: Joi.string()
      .email()
      .required()
      .label('Email ID')
      .custom(emailValidation, 'Email domain Validation')
      .message({ 'any.invalid': 'Only official Email ID is allowed' }),
    department: Joi.string().required().label('Department').trim(),
    designation: Joi.string()
      .valid(...allDesignationDataFromDb) // only allow certain designation. this designation are fetched from database.
      .label('Designation')
      .required(),
    manager_id: Joi.alternatives().try(Joi.string(), Joi.number()).required().label('Manager ID'),
    status: Joi.string().valid('Active', 'Inactive').required().label('Status'),
  });

  const auditToolSaveEmployeeDataSchema = Joi.array().items(auditToolSaveEmployeeDataElement).min(1);
  return auditToolSaveEmployeeDataSchema.validate(requestBody, { abortEarly: false, allowUnknown: true });
};

const auditToolProjectSaveFunction = (requestBody, detailsFromDB) => {
  const { auditToolRolesList } = detailsFromDB;
  const auditToolSaveProjectSaveElementSchema = Joi.object().keys({
    sl_no: Joi.alternatives(Joi.string(), Joi.number()).allow('', null),
    key: Joi.number().allow('', null),
    project_id: Joi.string().required().label('Project ID'),
    project_name: Joi.string().required().label('Project Name').trim(),
    start_date: Joi.string().required().label('Project Start Date'),
    end_date: Joi.string().required().label('Project End Date'),
    status: Joi.string().valid('Active', 'Inactive').required().label('Status'),
    project_manager: Joi.string().required().label('Project Manager'),
    qa: Joi.string().required().label('QA'),
    type: Joi.string().required().label('Type'),
    emp_id: Joi.string().required().label('Employee ID'),
    role: Joi.string()
      .valid(...auditToolRolesList)
      .label('Role') // only allow certain roles to be assigned.
      .required(),
    project_emp_status: Joi.string().valid('Active', 'Inactive').required().label('Employee Status for Project'),
    short_project_name: Joi.string().allow('', null).label('Short Project Name').trim(),
  });

  const auditToolSaveProjectSaveSchema = Joi.array().items(auditToolSaveProjectSaveElementSchema);
  return auditToolSaveProjectSaveSchema.validate(requestBody, { abortEarly: false, allowUnknown: true });
};

const auditToolCostCenterSaveElementSchema = Joi.object().keys({
  sl_no: Joi.alternatives(Joi.string(), Joi.number()).allow('', null),
  key: Joi.number().allow('', null),
  group_code: Joi.string().required().label('Group Code'),
  group_name: Joi.string().required().label('Group Name'),
  group_head: Joi.string().required().label('Group Head'),
  group_head_name: Joi.string().allow('', null).label('Group Head Name'),
  remarks: Joi.string().allow('', null).label('Remarks').trim(),
});

const auditToolCostCenterSaveSchema = Joi.array().items(auditToolCostCenterSaveElementSchema);

// both audit and prom tool
const roleSchema = Joi.object().keys({
  groupName: Joi.string().min(1).required(),
  features: Joi.array().min(1),
});

// both audit and prom Tool
const deleteRoleSchema = Joi.object().keys({ groupName: Joi.array().min(1).required() });

// ------------------------ PROM Tool ----------------------------------------

const promToolRevenueSchemaFunction = (requestBody, { projectDataArray }) => {
  const checkWhetherDatesFalledorNot = (value, helpers) => {
    const {
      ancestors: [{ project_code: projectCode }],
    } = helpers.state;

    const projectDateFromDatabase = projectDataArray.find((ele) => ele.project_code === projectCode);
    if (projectDateFromDatabase !== null) {
      // const data = checkMonthOverLapBetweenDate(value, projectDateFromDatabase.project_start_date, value, projectDateFromDatabase.project_end_date)
      const data = dayjs(value).isBetween(
        projectDateFromDatabase.project_start_date,
        projectDateFromDatabase.project_end_date,
        'month',
        '[]',
      );

      if (data === false) {
        return helpers.message({
          custom: `${value} must be between project start date  ${projectDateFromDatabase.project_start_date} and project end date ${projectDateFromDatabase.project_end_date}`,
        });
      }
    }
    return value;
  };

  const promToolSaveRevenueDataEachElementSchema = Joi.object().keys({
    opr_id: Joi.alternatives().try(Joi.string(), Joi.number()),
    key: Joi.number(),
    project_code: Joi.string().required().label('Project Code'),
    project_name: Joi.string().required().label('Project Name'),
    project_bu_name: Joi.string().required().label('Project BU Name'),
    revenue_date: Joi.string()
      .required()
      .label('Month')
      .custom(checkWhetherDatesFalledorNot, 'verify whether month and year between project start and end date'),
    revenue: Joi.alternatives().try(Joi.string(), Joi.number().positive()).required().label('Revenue'),
  });
  const promToolSaveRevenueDataSchema = Joi.array().items(promToolSaveRevenueDataEachElementSchema);
  return promToolSaveRevenueDataSchema.validate(requestBody, { abortEarly: false, allowUnknown: true });
};

/**
 * only prom tool
 * validate whether req.body is array of elements and for each element perform validation
 * through @var promToolSaveRevenueDataEachElementSchema
 */
//const promToolSaveRevenueDataSchema = Joi.array().items(promToolSaveRevenueDataEachElementSchema);

const promToolSaveManagementSchemaFunction = (requestBody, detailsFromDatabase) => {
  const {
    // allSkillData,
    allResourceStatus,
    allStreamDetails,
    allJoinedAsDetails,
    allGroupNames,
    allLocations,
    allDesignations,
    promToolEmployeeDateOfJoining,
    //allresorceEmailIds,
  } =
    // const { allPromEmployeeIds, allSkillData, allResourceStatus, allStreamDetails, allJoinedAsDetails, allGroupNames } =
    detailsFromDatabase;

  const employeeIdAndDateOfJoiningValidation = (value, helpers) => {
    const {
      ancestors: [{ resource_emp_id: resourceEmpID }],
    } = helpers.state;

    const employeeDateOfJoiningFromDatabase = promToolEmployeeDateOfJoining.find(
      (ele) => ele.resource_emp_id === resourceEmpID,
    );

    if (employeeDateOfJoiningFromDatabase != null) {
      const compareDates = dateAGreaterThanDateB(formatDate(value), employeeDateOfJoiningFromDatabase.resource_doj);
      if (!compareDates) {
        // return false if new date is not greater than old revision start date
        return helpers.message({
          custom: `${formatDate(value)} must be greater than ${formatDate(
            employeeDateOfJoiningFromDatabase.resource_doj,
          )}`,
        });
      }
      return value;
    }
    return value;
  };

  const promToolResourceManagementElementSchema = Joi.object().keys({
    sr_no_: Joi.alternatives().try(Joi.string(), Joi.number()),
    id: Joi.alternatives().try(Joi.string(), Joi.number()),
    key: Joi.alternatives().try(Joi.string(), Joi.number()),
    bu_name: Joi.string()
      .valid(...allGroupNames)
      .required()
      .label('BU Name'),
    resource_emp_id: Joi.string()
      .max(6)
      .required()
      .regex(/^[a-zA-Z0-9]*$/)
      .label('Resource Emp ID'),
    email_id: Joi.string()
      .email()
      .required()
      .label('Email ID')
      // .disallow(...allresorceEmailIds)
      // .messages({ 'any.invalid': '{{#label}} already exist in database.' })
      .custom(emailValidation, 'Email domain Validation')
      .message({ 'any.invalid': 'Only official Email ID is allowed' }),
    is_reporting_manager: Joi.string().required().valid('Yes', 'No').label('Is Reporting Manager'),
    resource_name: Joi.string()
      .required()
      .regex(/^[a-zA-Z0-9 ]*$/)
      .label('Resource Name'),
    resource_doj: Joi.date().required().label('Resource DOJ'),
    // designation: Joi.string().required().label('Designation').trim(),
    designation: Joi.string()
      .required()
      .valid(...allDesignations)
      .label('Designation')
      .trim(),

    reporting_manager: Joi.string()
      // .valid(...allPromEmployeeIds)
      .required()
      .label('Reporting Manager')
      .messages({ 'any.only': "{{#label}} Employee ID doesn't exist in database." }),
    reporting_manager_name: Joi.string(),
    // location: Joi.string().required().label('Location').trim(),
    location: Joi.string()
      .required()
      .valid(...allLocations)
      .label('Location')
      .trim(),

    joined_as: Joi.string()
      .valid(...allJoinedAsDetails)
      .required()
      .label('Joined as'),
    ctc: Joi.number().positive().required().label('CTC'),
    per_month: Joi.number().required().label('Per Month'),
    stream: Joi.string()
      .valid(...allStreamDetails)
      .allow('', null)
      .label('Stream'),
    total_years_exp: Joi.number().allow('', null).allow(0).positive().label('Total years exp.'),
    // skill_data: Joi.array()
    //   .items(Joi.string().valid(...allSkillData))
    //   .label('Skill Data'),
    resource_status: Joi.valid(...allResourceStatus)
      .required()
      .label('Resource status'),
    resource_lwd: Joi.date()
      .allow('', null)
      .custom(employeeIdAndDateOfJoiningValidation, 'validate Employee ID existence and date of Joining')
      .label('Resource LWD'),
  });

  // only prom tool
  // validate whether req.body is array of elements and for each element perform validation
  // through resourceManagementObjectValidation
  const promToolResourceManagementSchema = Joi.array().items(promToolResourceManagementElementSchema);
  return promToolResourceManagementSchema.validate(requestBody, { abortEarly: false, allowUnknown: true });
};

const promToolSaveProjectDataSchemaFunction = (body, detailsFromDatabase) => {
  const { groupNameFromDatabase, promToolEmployeeIds, allProjectStatus, allProjectTypes } = detailsFromDatabase;

  const promToolSaveProjectDataElementSchema = Joi.object().keys({
    sr_no_: Joi.alternatives().try(Joi.string(), Joi.number()), // different excel will have different serial No.
    id: Joi.alternatives().try(Joi.string(), Joi.number()),
    key: Joi.alternatives().try(Joi.string(), Joi.number()),
    project_code: Joi.string()
      // .regex(/^[a-zA-Z0-9]*$/)
      .required()
      .label('Project Code')
      .trim(),
    // .disallow(...allprojectcodes)
    // .messages({ 'any.invalid': '{{#label}} already exist in database.' }),
    //Joi.alternatives().try(Joi.string(), Joi.number()).required().label('Project Code'),
    project_name: Joi.string()
      .required()
      // .disallow(...allprojectNames)
      // .messages({ 'any.invalid': '{{#label}} already exist in database.' })
      .label('Project Name')
      .trim(),
    project_bu_name: Joi.string()
      .valid(...groupNameFromDatabase)
      .required()
      .label('project BU Name'),
    project_bu_head: Joi.string()
      .valid(...promToolEmployeeIds)
      .required()
      .label('Project BU Head')
      .messages({ 'any.only': "{{#label}} Employee ID doesn't exist in database." }),
    project_manager: Joi.string()
      .valid(...promToolEmployeeIds)
      .required()
      .label('Project Manager')
      .messages({ 'any.only': "{{#label}} Employee ID doesn't exist in database." }),
    project_type: Joi.string()
      .valid(...allProjectTypes)
      .required()
      .label('Project Type'),
    project_start_date: Joi.string().required().label('Project Start Date'),
    project_end_date: Joi.date()
      .greater(Joi.ref('project_start_date'))
      .required()
      .label('Project End Date')
      .messages({ 'date.greater': '{{#label}} Must be greater then Project Start Date' }),
    po_ro_sow_number: Joi.alternatives()
      .try(Joi.string().alphanum(), Joi.number())
      .required()
      .label('PO/RO/SOW Number'),
    po_ro_sow_value: Joi.number().positive().required().label('PO/RO/SOW Value'),
    project_status: Joi.string()
      .valid(...allProjectStatus)
      .label('Project Status')
      .required(),
  });
  // only prom tool
  // validate whether req.body is array of elements and for each element perform validation
  // through resourceManagementObjectValidation
  const promToolSaveProjectDataSchema = Joi.array().items(promToolSaveProjectDataElementSchema);
  return promToolSaveProjectDataSchema.validate(body, { abortEarly: false, allowUnknown: true });
};

const promToolSaveGroupDetailsSchemaFunction = (body, detailsFromDb) => {
  const { allGroupCodes, allGroupName, employeeIds } = detailsFromDb;
  const promToolSaveGroupDetailsElement = Joi.object().keys({
    sl_no: Joi.alternatives(Joi.string(), Joi.number()).allow('', null),
    key: Joi.number().allow('', null),
    bu_code: Joi.string()
      .disallow(...allGroupCodes)
      .required()
      .label('BU Code')
      .trim()
      .messages({ 'any.invalid': '{{#label}} already exist in database.' }),
    bu_name: Joi.string()
      .disallow(...allGroupName)
      .required()
      .label('BU Name')
      .trim()
      .messages({ 'any.invalid': '{{#label}} already exist in database.' }),
    bu_head: Joi.string()
      .valid(...employeeIds)
      .required()
      .label('BU Head')
      .messages({ 'any.only': '{{#label}} BU Head is Inactive.' }),
    remarks: Joi.string().allow('', null).label('Remarks').trim(),
  });
  const promToolSaveGroupDetailsSchema = Joi.array().items(promToolSaveGroupDetailsElement);
  return promToolSaveGroupDetailsSchema.validate(body, { abortEarly: false, allowUnknown: true });
};

const promToolSaveMaternitySchemaFunction = (body, databaseDetails) => {
  const { promToolEmployeeDateOfJoining, employeeIds, allGroupNames } = databaseDetails;
  const employeeIdAndDateOfJoiningValidation = (value, helpers) => {
    const {
      ancestors: [{ resource_emp_id: resourceEmpID }],
    } = helpers.state;
    const employeeDateOfJoiningFromDatabase = promToolEmployeeDateOfJoining.find(
      (ele) => ele.resource_emp_id === resourceEmpID,
    );
    if (employeeDateOfJoiningFromDatabase != null) {
      const compareDates = dateAGreaterThanDateB(formatDate(value), employeeDateOfJoiningFromDatabase.resource_doj);
      if (!compareDates) {
        // return false if new date is not greater than old revision start date
        return helpers.message({
          custom: `${formatDate(value)} must be greater than ${formatDate(
            employeeDateOfJoiningFromDatabase.resource_doj,
          )}`,
        });
      }
      return value;
    }
    return value;
  };

  const promToolSaveMaternitySchemaElement = Joi.object().keys({
    resource_emp_id: Joi.string()
      .valid(...employeeIds)
      .required()
      .label('Resource Emp Id')
      .messages({ 'any.only': "{{#label}} Employee ID doesn't exist in database." }),
    bu_name: Joi.string()
      .valid(...allGroupNames)
      .required()
      .label('BU Name'),
    reporting_manager: Joi.string()
      .valid(...employeeIds)
      .required()
      .label('Reporting Manager')
      .messages({ 'any.only': "{{#label}} Employee ID doesn't exist in database." }),
    maternity_start_date: Joi.date()
      .required()
      .label('Maternity Start Date')
      .custom(employeeIdAndDateOfJoiningValidation, 'validate Employee ID existence and date of Joining'),
    maternity_end_date: Joi.date()
      .greater(Joi.ref('maternity_start_date'))
      .required()
      .label('Maternity End Date')
      .messages({ 'date.greater': '{{#label}} Must be greater then Maternity Start Date' }),
    remarks: Joi.string().allow(null, '').label('Remarks').optional().trim(),
  });

  const promToolSaveMaternityDetailsSchema = Joi.array().items(promToolSaveMaternitySchemaElement);
  return promToolSaveMaternityDetailsSchema.validate(body, { abortEarly: false, allowUnknown: true });
};

const promToolUpdateGroupDetailsSchemaFunction = (body, employeeIds, groupCodes, groupNames) => {
  const promToolSaveGroupDetailsElement = Joi.object().keys({
    sl_no: Joi.alternatives(Joi.string(), Joi.number()).allow('', null),
    key: Joi.number().allow('', null),

    bu_code: Joi.string()
      .required()
      .valid(...groupCodes)
      .label('BU Code'),

    bu_name: Joi.string()
      .required()
      .valid(...groupNames)
      .label('BU Name'),

    bu_head: Joi.string()
      .valid(...employeeIds)
      .required()
      .label('BU Head')
      .messages({ 'any.only': "{{#label}} Employee ID doesn't exist in database." }),
    remarks: Joi.string().allow('', null).label('Remarks').trim(),
  });
  const promToolSaveGroupDetailsSchema = Joi.array().items(promToolSaveGroupDetailsElement);
  return promToolSaveGroupDetailsSchema.validate(body, { abortEarly: false, allowUnknown: true });
};

const promToolResourcePlanningSchemaFunction = (
  requestBody,
  { allEngineeringCostFromDb, projectCodesArray, projectDataArray },
) => {
  const checkWhetherAverageCostIsDeclaredInDB = (value, helpers) => {
    // check for this particular month average engineering cost is present in database,else return error
    const monthDataPresent = allEngineeringCostFromDb.some((ele) => ele.average_engg_date === value);
    if (!monthDataPresent) {
      return helpers.message({ custom: `Average Engg Cost is not declared for the month ${value}` });
    }
    return value;
  };

  const checkWhetherDatesFalledorNot = (value, helpers) => {
    const {
      ancestors: [{ project_code: projectCode }],
    } = helpers.state;

    const projectDateFromDatabase = projectDataArray.find((ele) => ele.project_code === projectCode);
    if (projectDateFromDatabase !== null) {
      const data = dayjs(value).isBetween(
        projectDateFromDatabase.project_start_date,
        projectDateFromDatabase.project_end_date,
        'month',
        '[]',
      );
      if (data === false) {
        return helpers.message({
          custom: `${value} must be between project start date  ${projectDateFromDatabase.project_start_date} and project end date ${projectDateFromDatabase.project_end_date}`,
        });
      }
    }
    return value;
  };
  const promToolResourcePlanningElementSchema = Joi.object().keys({
    sl_no: Joi.alternatives().try(Joi.string(), Joi.number()).allow('', null),
    id: Joi.alternatives().try(Joi.string(), Joi.number()),
    key: Joi.alternatives().try(Joi.string(), Joi.number()),
    month_year: Joi.string()
      .required()
      .custom(checkWhetherAverageCostIsDeclaredInDB, 'verify whether average engineering cost present in db')
      .custom(checkWhetherDatesFalledorNot, 'verify whether month and year between project start and end date')
      .label('Month'),
    planned_cost: Joi.number().required().label('Planned Cost'),
    planned_resource: Joi.alternatives()
      .try(Joi.string().pattern(/^[0-9]+$/), Joi.number().positive())
      .messages({ 'string.pattern.base': '{{#label}} can contain only positive number' })
      .messages({ 'alternatives.match': '{{#label}} can contain only positive number' })
      .required()
      .label('Planned Resource'),

    project_code: Joi.string()
      .required()
      .label('Project Code')
      .valid(...projectCodesArray)
      .messages({ 'any.only': '{{#label}} Project is closed' }),
  });

  const promToolResourcePlanningSchema = Joi.array().items(promToolResourcePlanningElementSchema);
  return promToolResourcePlanningSchema.validate(requestBody, { abortEarly: false, allowUnknown: true });
};

const promToolUpdateResourcePlanningElementSchema = Joi.object().keys({
  id: Joi.string().required().label('id'),
  key: Joi.alternatives().try(Joi.string(), Joi.number()),
  month_year: Joi.string().required().label('Month'),
  project_code: Joi.string().required().label('Project Code'),
  planned_cost: Joi.alternatives()
    .try(Joi.string().pattern(/^[0-9]+$/), Joi.number())
    .required()
    .messages({ 'string.pattern.base': '{{#label}} can contain only positive number' })
    .messages({ 'alternatives.match': '{{#label}} can contain only positive number' })
    .label('Planned Cost'),

  planned_resource: Joi.alternatives().try(Joi.string(), Joi.number().positive()).required().label('Planned Resource'),
});

const promToolUpdateResourcePlanningSchema = Joi.array().items(promToolUpdateResourcePlanningElementSchema);

// const promToolAverageEngineeringCostElementSchema = Joi.object().keys({
//   key: Joi.number(),
//   un_id: Joi.number(),
//   average_engg_cost: Joi.alternatives().try(Joi.string(), Joi.number().positive()).label('Average Engg. Cost'),
//   average_engg_date: Joi.string().required().label('Month'),
// });

const promToolAverageEngineeringCostSchema = (requestBody, detailsFromDatabase) => {
  const { allGroupNames } = detailsFromDatabase;

  const promToolAverageEngineeringCostElementSchema = Joi.object().keys({
    key: Joi.number(),
    un_id: Joi.number(),
    bu_name: Joi.string()
      .valid(...allGroupNames)
      .required()
      .label('BU Name'),
    average_engg_cost: Joi.alternatives().try(Joi.string(), Joi.number().positive()).label('Average Engg. Cost'),
    average_engg_date: Joi.string().required().label('Month'),
  });
  const promToolAverageEngineeringElementSchema = Joi.array().items(promToolAverageEngineeringCostElementSchema);
  return promToolAverageEngineeringElementSchema.validate(requestBody, { abortEarly: false, allowUnknown: true });
};

const promResourceAllocationSchemaFunction = (requestBody, detailsFromDb) => {
  // fetch all details
  const {
    empIdAndTheirDOJ,
    getAllProjectStartEndDateInfo,
    onlyPromEmployeeIdsInArray,
    allocationFromDb,
    employeeAndTheirProjectCode,
  } = detailsFromDb;

  // unit custom function for Joi
  const allowOnlyProjectCodesUnderEmployeeGroup = (value, helpers) => {
    const {
      ancestors: [{ resource_emp_id: resourceEmpId }],
    } = helpers.state;

    const projectCodesAllowedForEmployee = employeeAndTheirProjectCode.find(
      (ele) => ele.resource_emp_id === resourceEmpId,
    );
    const acceptableProjectCodeForEmployee = projectCodesAllowedForEmployee?.projectCodes ?? [];
    if (!acceptableProjectCodeForEmployee.includes(value)) {
      return helpers.message({
        custom: "Project doesn't belong to employee group",
      });
    }
    return value;
  };

  // unit custom function for Joi
  const verifyAllocationBetweenProjectStartAndEndDate = (value, helpers) => {
    const {
      path: [, fieldName],
      ancestors: [{ project_code: projectCode }],
    } = helpers.state;

    const dateFormatted = formatDate(value); // convert joi date to YYYY-MM-DD

    const projectDetails = getAllProjectStartEndDateInfo.find((ele) => ele.project_code === projectCode);

    const customErrorMessage = () => {
      return helpers.message({
        custom: `Date must be between ${projectDetails.project_start_date}(Project Start Date) and ${projectDetails.project_end_date}(Project End Date)`,
      });
    };

    if (fieldName === 'start_date') {
      // with granularity start_date cannot be project_end_date
      const isDateBetweenProjectStartAndEndDate = isDateBetweenWithCustomParameter(
        dateFormatted,
        projectDetails.project_start_date,
        projectDetails.project_end_date,
        'date',
        '[)',
      );
      if (!isDateBetweenProjectStartAndEndDate) return customErrorMessage();
      return value;
    }

    if (fieldName === 'end_date') {
      // with granularity end_date cannot be project_start_date
      const isDateBetweenProjectStartAndEndDate = isDateBetweenWithCustomParameter(
        dateFormatted,
        projectDetails.project_start_date,
        projectDetails.project_end_date,
        'date',
        '(]',
      );
      if (!isDateBetweenProjectStartAndEndDate) return customErrorMessage();
      return value;
    }
  };

  // unit custom function for Joi
  const employeeIdAndDateOfJoiningValidation = (value, helpers) => {
    if (!onlyPromEmployeeIdsInArray.includes(value)) {
      return helpers.message({
        custom: `${value} Employee ID doesn't exist in database.`,
      });
    }
    const {
      ancestors: [{ start_date: allocationStartDate }],
    } = helpers.state;

    const employeeDateOfJoiningFromDatabase = empIdAndTheirDOJ.get(value);
    const employeeStartDateIsGreaterThanDateOfJoining = dateAGreaterThanOrEqualToDateB(
      allocationStartDate,
      employeeDateOfJoiningFromDatabase,
    );

    if (!employeeStartDateIsGreaterThanDateOfJoining) {
      return helpers.message({
        custom: `Employee allocation start date(${allocationStartDate}) must be greater than or equal to Employee's date of joining(${employeeDateOfJoiningFromDatabase})`,
      });
    }
    return value;
  };

  // main process start here
  const promToolResourceAllocationElementSchema = Joi.object()
    .keys({
      sl_no: Joi.alternatives().try(Joi.string(), Joi.number()),
      ra_id: Joi.number(),
      key: Joi.alternatives().try(Joi.string(), Joi.number()),
      resource_emp_id: Joi.string()
        .required()
        .label('Resource Emp Id')
        .custom(employeeIdAndDateOfJoiningValidation, 'validate Employee ID existence and date of Joining'),
      resource_name: Joi.string().optional(),
      project_code: Joi.string()
        .required()
        .label('Project Code')
        .messages({ 'any.only': "{{#label}} doesn't exist in database." })
        .custom(allowOnlyProjectCodesUnderEmployeeGroup, 'allow project code which to employee group'),

      start_date: Joi.date()
        .required()
        .label('Start Date')
        .custom(
          verifyAllocationBetweenProjectStartAndEndDate,
          'only Allow start_date equal to or after project_start_date ',
        ),

      end_date: Joi.date()
        .greater(Joi.ref('start_date'))
        .required()
        .label('End Date')
        .messages({ 'date.greater': '{{#label}} Must be greater then Start Date' })
        .custom(
          verifyAllocationBetweenProjectStartAndEndDate,
          'only Allow start_date equal to or after project_start_date ',
        ),

      allocation: Joi.number()
        .positive()
        .valid(...allocationFromDb)
        .required()
        .label('Allocation'),
      billable_resource: Joi.number()
        .positive()
        .allow(0)
        .max(Joi.ref('allocation'))
        .required()
        .label('Billable Resource')
        .messages({ 'number.max': '{{#label}} Must be less than or equal to Allocation' }),

      project_bu_name: Joi.string().optional(),
      supervisor: Joi.string()
        .valid(...onlyPromEmployeeIdsInArray)
        .required()
        .label('Supervisor')
        .messages({ 'any.only': "{{#label}} Employee ID doesn't exist in database." }),
    })
    .when(Joi.object({ ra_id: Joi.number().required() }).unknown(), {
      then: Joi.object({
        resource_status_in_project: Joi.string()
          .valid('Active', 'Buffer', 'Resigned', 'Inactive')
          .required()
          .label('Project Resource Status'),
      }),
      // allow only Active while saving new Allocation
      otherwise: Joi.object({
        resource_status_in_project: Joi.string().valid('Active').required().label('Project Resource Status'),
      }),
    });

  const promToolResourceAllocationSchema = Joi.array().items(promToolResourceAllocationElementSchema);

  return promToolResourceAllocationSchema.validate(requestBody, { abortEarly: false });
};

const promToolSaveClaimElementSchema = Joi.object().keys({
  amount: Joi.number().positive().required().label('Amount'),
  approver: Joi.string().required().label('Approver'),
  approver_name: Joi.string().required().label('Approver Name'),
  claim_status: Joi.string().required().label('Claim Status'),
  date: Joi.string().required().label('Date'),
  expense_type: Joi.string().required().label('Expense Type'),
  key: Joi.number(),
  project_code: Joi.string().required().label('Project Code'),
  project_name: Joi.string().required().label('Project Name'),
  remarks: Joi.string().allow('', null).label('Remarks').trim(),
  resource_emp_id: Joi.string().label('Resource Emp ID'),
  resource_emp_name: Joi.string().label('Resource Name'),
});

const promToolSaveClaimSchema = Joi.array().items(promToolSaveClaimElementSchema);

// const promToolSaveClaimSchema = Joi.array().items(promToolSaveClaimElementSchema);
// const promToolSaveClaimsSchemaFunction = (requestBody, detailsFromDatabase) => {
//   const {
//     allActiveResourceList
//   } =
//     // const { allProEmployeeIds, allSkillData, allResourceStatus, allStreamDetails, allJoinedAsDetails, allGroupNames } =
//     detailsFromDatabase;m

//   const promToolSaveClaimElementSchema = Joi.object().keys({
//     amount: Joi.number().positive().required().label('Amount'),
//     approver: Joi.string().required().label('Approver').valid(...allActiveResourceList),
//     approver_name: Joi.string().required().label('Approver Name'),
//     claim_status: Joi.string().required().label('Claim Status'),
//     date: Joi.string().required().label('Date'),
//     expense_type: Joi.string().required().label('Expense Type'),
//     key: Joi.number(),
//     project_code: Joi.string().required().label('Project Code'),
//     project_name: Joi.string().required().label('Project Name'),
//     remarks: Joi.string().allow('', null).label('Remarks').trim(),
//     resource_emp_id: Joi.string().label('Resource Emp ID').allow('', null),
//     resource_emp_name: Joi.string().label('Resource Name'),
//   });

//   // only prom tool
//   // validate whether req.body is array of elements and for each element perform validation
//   // through claimsObjectValidation
//   const promToolClaimSchema = Joi.array().items(promToolSaveClaimElementSchema);
//   return promToolClaimSchema.validate(requestBody, { abortEarly: false, allowUnknown: true });
// };

const promToolUploadClaimSchemaFunction = (requestBody, detailsFromDb) => {
  const { projectCodesArray, expenseTypeInArray, employeeIds, onlyActiveResourceData } = detailsFromDb;
  const disallowSameApprover = (value, helpers) => {
    // check whether Employee ID exist in database
    if (!employeeIds.includes(value)) {
      return helpers.message({
        custom: "approver Id doesn't exist in database",
      });
    }
    const {
      ancestors: [{ resource_emp_id: resourceEmployeeId }],
    } = helpers.state;

    const isEmpAndApproverSame = resourceEmployeeId === value;

    if (isEmpAndApproverSame) {
      return helpers.message({
        custom: 'Employee ID and Approver cannot be same',
      });
    }
    return value;
  };
  const promToolUploadClaimElementSchema = Joi.object().keys({
    project_code: Joi.string()
      .valid(...projectCodesArray)
      .required()
      .label('Project Code')
      .messages({ 'any.only': '{{#label}} Project is Closed' }),
    resource_emp_id: Joi.string()
      .valid(...onlyActiveResourceData)
      .allow('', null)
      // .required()
      .label('Resource Emp ID')
      .messages({ 'any.only': "{{#label}} Employee ID doesn't exist in database." }),

    expense_type: Joi.string()
      .valid(...expenseTypeInArray)
      .required()
      .label('Expense Type'),
    date: Joi.date().required().label('Date'),
    amount: Joi.number().positive().required().label('Amount'),
    remarks: Joi.string().allow('', null).label('Remarks').trim(),
    approver: Joi.string()
      .required()
      .label('Approver')
      .valid(...onlyActiveResourceData)
      .custom(disallowSameApprover, 'check whether Employee ID and Approver are same')
      .messages({ 'any.only': '{{#label}} approver Id is Inactive.' }),
  });
  const promToolUploadClaimSchema = Joi.array().items(promToolUploadClaimElementSchema);

  return promToolUploadClaimSchema.validate(requestBody, { abortEarly: false, allowUnknown: true, stripUnknown: true });
};

const promToolSaveSalaryRevisionSchemaFunction = (
  requestBody,
  { promToolEmployeeDateOfJoining, promToolEmployeeIds, latestSalaryRevisionDetails },
) => {
  const promRevisionStartDateValidation = (value, helpers) => {
    // only allow 1st day of month  for revision start date
    const isOnlyFirstDateOfMonth = getOnlyDateFromFullDate(value.toString().trim()) === 1;
    if (!isOnlyFirstDateOfMonth) return helpers.error('any.invalid');
    return value;
  };

  const startEndMoreThanPreviousRevisionStart = (value, helpers) => {
    const {
      ancestors: [{ resource_emp_id: resourceEmployeeId }],
    } = helpers.state;

    const previousRevisionStartDate = latestSalaryRevisionDetails.find(
      (ele) => ele.resource_emp_id === resourceEmployeeId,
    );

    if (previousRevisionStartDate != null) {
      const compareDates = dateAGreaterThanDateB(formatDate(value), previousRevisionStartDate.revision_start_date);
      if (!compareDates) {
        // return false if new date is not greater than old revision start date
        return helpers.message({
          custom: `${formatDate(value)} must be greater than ${formatDate(
            previousRevisionStartDate.revision_start_date,
          )}`,
        });
      }
      return value;
    }
    return value;
  };

  const employeeIdAndDateOfJoiningValidation = (value, helpers) => {
    const {
      ancestors: [{ resource_emp_id: resourceEmpID }],
    } = helpers.state;
    const employeeDateOfJoiningFromDatabase = promToolEmployeeDateOfJoining.find(
      (ele) => ele.resource_emp_id === resourceEmpID,
    );
    if (employeeDateOfJoiningFromDatabase != null) {
      const compareDates = dateAGreaterThanDateB(formatDate(value), employeeDateOfJoiningFromDatabase.resource_doj);
      if (!compareDates) {
        // return false if new date is not greater than old revision start date
        return helpers.message({
          custom: `${formatDate(value)} must be greater than ${formatDate(
            employeeDateOfJoiningFromDatabase.resource_doj,
          )}`,
        });
      }
      return value;
    }
    return value;
  };

  const promToolSaveSalaryRevisionElementSchema = Joi.object().keys({
    key: Joi.alternatives().try(Joi.string(), Joi.number()).allow('', null),
    sl_no: Joi.alternatives().try(Joi.string(), Joi.number()).allow('', null),
    resource_emp_id: Joi.string()
      .valid(...promToolEmployeeIds)
      .required()
      .trim()
      .label('Resource Emp Id')
      .messages({ 'any.only': "{{#label}} Employee ID doesn't exist in database." }),
    revision_start_date: Joi.date()
      .required()
      .label('Revision Start Date')
      .custom(promRevisionStartDateValidation, 'allow only 1st of the month as Revision Start Date')
      .custom(
        startEndMoreThanPreviousRevisionStart,
        'allow if revision start date is more than previous revision start date',
      )
      .custom(employeeIdAndDateOfJoiningValidation, 'validate Employee ID existence and date of Joining')
      .messages({ 'any.invalid': 'only first date of the Month is allowed' }),
    revision_end_date: Joi.valid(null).required().label('Revision End Date'),
    ctc: Joi.number().positive().required().label('CTC'),
    remarks: Joi.string().allow('', null).trim().label('Remarks').trim(),
  });

  // main process which call other variable and function
  const promToolSaveSalaryRevisionSchema = Joi.array().items(promToolSaveSalaryRevisionElementSchema);

  return promToolSaveSalaryRevisionSchema.validate(requestBody, { abortEarly: false });
};

const promToolSaveAOPSchemaFunction = (body, allGroupNames, employeeIds) => {
  const promToolSaveAOPSaveDataElementSchema = Joi.object().keys({
    key: Joi.alternatives().try(Joi.string(), Joi.number()).allow('', null),
    sl_no: Joi.alternatives().try(Joi.string(), Joi.number()).allow('', null),
    org_bu_name: Joi.string()
      .required()
      .valid(...allGroupNames)
      .label('Org BU Name'),
    org_bu_head: Joi.string()
      .required()
      .valid(...employeeIds)
      .label('Org BU Head')
      .messages({ 'any.only': "{{#label}} Employee ID doesn't exist in database." }),
    aop_resource: Joi.number().min(1).required().label('AOP Resource'),
    aop_cost: Joi.number().min(1).required().label('AOP Cost'),
    aop_revenue: Joi.number().min(1).required().label('AOP Revenue'),
    aop_month: Joi.required().label('AOP Month'),
    remarks: Joi.string().allow('', null).label('Remarks').trim(),
  });
  const promToolSaveAOPDataSchema = Joi.array().items(promToolSaveAOPSaveDataElementSchema);
  return promToolSaveAOPDataSchema.validate(body, { abortEarly: false, allowUnknown: true });
};

const avinEmailValidation = Joi.string()
  .email()
  .custom(emailValidation, 'Email domain Validation')
  .message({ 'any.invalid': 'Only official Email ID is allowed' });

const auditToolNonClosedAuditCustomMailSchema = Joi.object().keys({
  auditId: Joi.string().required(),
  toMailList: Joi.array().items(avinEmailValidation).min(1).required(),
  ccMailList: Joi.string().required(),
});

const promToolUploadResourceSkillDataSchemaFunction = (requestBody, detailsFromDb) => {
  const { employeeIds, onlyActiveResourceData, allSkillData } = detailsFromDb;

  const promToolUploadResourceSkillDataElementSchema = Joi.object().keys({
    resource_emp_id: Joi.string()
      .valid(...onlyActiveResourceData)
      .required()
      .label('Resource Emp ID')
      .messages({ 'any.only': "{{#label}} Employee ID doesn't exist in database." }),
    skill: Joi.string()
      .valid(...allSkillData)
      .required()
      .label('Skill'),
    relevant_exp: Joi.number().positive().allow(0).required().label('Relevant Exp'),
    competency_level: Joi.number()
      .positive()
      .required()
      .label('Competency Level')
      .valid(1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0),
  });
  const promToolResourceSkillDataClaimSchema = Joi.array().items(promToolUploadResourceSkillDataElementSchema);

  return promToolResourceSkillDataClaimSchema.validate(requestBody, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
};

const promToolUploadPreviousExpSchemaFunction = (requestBody, detailsFromDb) => {
  const { employeeIds, onlyActiveResourceData } = detailsFromDb;

  const promToolUploadPreviousExpElementSchema = Joi.object().keys({
    resource_emp_id: Joi.string()
      .valid(...onlyActiveResourceData)
      .required()
      .label('Resource Emp ID')
      .messages({ 'any.only': "{{#label}} Employee ID doesn't exist in database." }),
    years_of_exp: Joi.number().positive().allow(0).required().label('Years of Exp.'),
    previous_company_details: Joi.string().required().label('Previous Company Details').trim(),
    joining_date: Joi.date().required().label('Joining Date'),
    last_working_date: Joi.allow(null).label('Last Working Date'),
  });
  const promToolPreviousExpClaimSchema = Joi.array().items(promToolUploadPreviousExpElementSchema);

  return promToolPreviousExpClaimSchema.validate(requestBody, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });
};

module.exports = {
  auditToolNonClosedAuditCustomMailSchema,
  promToolUpdateResourcePlanningSchema,
  signUpSchema,
  loginSchema,
  roleSchema,
  resetPassword,
  deleteRoleSchema,
  //promToolSaveRevenueDataSchema,
  promToolSaveManagementSchemaFunction,
  promResourceAllocationSchemaFunction,
  promToolSaveGroupDetailsSchemaFunction,
  promToolSaveProjectDataSchemaFunction,
  promToolUpdateGroupDetailsSchemaFunction,
  promToolResourcePlanningSchemaFunction,
  promToolAverageEngineeringCostSchema,
  promToolSaveClaimSchema,
  auditToolProjectSaveFunction,
  auditToolCostCenterSaveSchema,
  promToolUploadClaimSchemaFunction,
  promToolSaveSalaryRevisionSchemaFunction,
  promToolSaveAOPSchemaFunction,
  auditToolSaveEmployeeSaveFunction,
  promToolSaveMaternitySchemaFunction,
  //promToolSaveClaimsSchemaFunction,
  promToolRevenueSchemaFunction,
  promToolUploadResourceSkillDataSchemaFunction,
  promToolUploadPreviousExpSchemaFunction,
};
