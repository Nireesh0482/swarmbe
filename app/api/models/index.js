/* eslint-disable arrow-body-style */
/* eslint-disable wrap-iife */
/* eslint-disable func-names */

const { Sequelize } = require('sequelize');
const sequelize = require('../../config/db.config');

const db = {};

const createSchemaInDatabase = async (schemaNames) => {
  const requiredSchema = ['audit_tool', 'prom_tool'];

  const schemaNotInDatabase =
    schemaNames.length === 0 ? requiredSchema : requiredSchema.filter((ele) => !schemaNames.includes(ele));

  // if no schema present in databases, then create schema in database
  const schemaCreation = await Promise.all(
    schemaNotInDatabase.map(async (ele) => {
      const createdSchema = await sequelize.createSchema(ele);

      return createdSchema;
    }),
  );
  return schemaCreation;
};

// create Schema if not Exist, create schema
(async () => {
  const allSchema = await sequelize.showAllSchemas({ logging: false });
  if (allSchema.length < 2) {
    await createSchemaInDatabase(allSchema);
  }
})();

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// audit-tool
db.users = require('./auditTool/user')();
db.employeeData = require('./auditTool/employee')();
db.projectData = require('./auditTool/project')();
db.masterAudit = require('./auditTool/masterAudit')();
db.masterCheckList = require('./auditTool/master_checklist')();
db.auditTeam = require('./auditTool/audit_team')();
db.auditStatus = require('./auditTool/audit_status')();
db.projectEmpData = require('./auditTool/project_emp_details')();
db.featuresAndAccessLevel = require('./auditTool/feature')();
db.roleAndResponsibility = require('./auditTool/roles')();
db.userRoles = require('./auditTool/userRoles')();
db.checklistType = require('./auditTool/checklistType')();
db.costCenter = require('./auditTool/costCenter')();
db.auditRoles = require('./auditTool/audit_roles')();
db.auditDesignation = require('./auditTool/audit_designation')();

// prom-Tool
db.promAvinEmployeeDetails = require('./promTool/promAvinEmployeeDetails')();
db.promUserRoles = require('./promTool/promUserRoles')();
db.promFeaturesAndAccessLevel = require('./promTool/promFeature')();
db.promAvinProjectDetails = require('./promTool/promAvinProjectDetails')();
db.promAvinProjectExpenses = require('./promTool/promAvinProjectExpenses')();
db.promAvinResourceAllocation = require('./promTool/promAvinResourceAllocation')();
db.promUsers = require('./promTool/promUser')();
db.promRolesAndResponsibility = require('./promTool/promRoles')();
db.promAvinProjectOperationData = require('./promTool/promAvinProjectOperationData')();
db.promAllocation = require('./promTool/promAllocation')();
db.joinedAsDetails = require('./promTool/joinAsDetails')();
db.groupDetails = require('./promTool/groupDetails')();
db.expenseType = require('./promTool/expenseType')();
db.projectStatus = require('./promTool/projectStatus')();
db.projectTypes = require('./promTool/projectTypes')();
db.skillDetails = require('./promTool/skillDetails')();
db.loactionDetails = require('./promTool/locationDetails')();
db.streamDetails = require('./promTool/streamDetails')();
db.resourceStatusData = require('./promTool/resourceStatus')();
db.promAvinProjectResourceAndCostPlan = require('./promTool/promAvinProjectResourceAndCostPlan')();
db.avinAverageEnggCost = require('./promTool/avinAverageEnggCost')();
db.promSalaryRevision = require('./promTool/salaryRevision')();
db.organizationGRPMgmt = require('./promTool/organizationGroupAOP')();
db.maternityDetails = require('./promTool/promMaternity')();
db.designationDetails = require('./promTool/designationDetails')();
db.resourceSkillDetails = require('./promTool/resourceSkillDetails')();
db.resourcePreviousExpDetails = require('./promTool/resourcePreviousExpDetails')();

// Associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
