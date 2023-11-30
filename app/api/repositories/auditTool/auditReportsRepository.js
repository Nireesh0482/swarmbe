/* eslint-disable max-len */
/* eslint-disable no-await-in-loop */
const { QueryTypes } = require('sequelize');
const dbInstance = require('../../models');
const { sequelize } = require('../../models');

const getAllAudits = async (queryParams) => {
  const AllData = await dbInstance.masterAudit.findAll({
    where: queryParams,
    attributes: [
      'audit_id',
      'audit_report_name',
      'compliance_attribute',
      'audit_start_date',
      'audit_end_date',
      'status',
    ],
    raw: true,
  });
  const auditIdCount = AllData.length;
  return { AllData, auditIdCount };
};

const getComplianceData = async (AllData) => {
  // get how many "NO" present in compliance(this
  // column name can be Different in Different audit) column in all Audit
  let compliance;
  let nonCompliance;
  let nonComplianceList;
  let complianceCount;
  let totalComplianceCount = 0;
  let nonComplianceCount;
  let totalNonComplianceCount = 0;
  const finalNCTypeCount = [];
  let finalNCCount;
  for (const audit of AllData) {
    // getting compliance count
    compliance = await sequelize.query(
      `select  COUNT(${audit.compliance_attribute}) from ${audit.audit_report_name} where ${audit.compliance_attribute}[1]='yes' OR ${audit.compliance_attribute}[1]='YES' OR ${audit.compliance_attribute}[1]='Yes';`,
      {
        raw: true,
        type: QueryTypes.SELECT,
        searchPath: 'audit_tool',
        supportsSearchPath: true,
      },
    );
    complianceCount = compliance[0].count;
    totalComplianceCount = parseInt(totalComplianceCount, 10) + parseInt(complianceCount, 10);
    // getting noncompliance count
    nonCompliance = await sequelize.query(
      `select  COUNT(${audit.compliance_attribute}) from ${audit.audit_report_name} where ${audit.compliance_attribute}[1]='no' OR ${audit.compliance_attribute}[1]='NO' OR ${audit.compliance_attribute}[1]='No'`,
      {
        raw: true,
        type: QueryTypes.SELECT,
        searchPath: 'audit_tool',
        supportsSearchPath: true,
      },
    );
    nonComplianceCount = nonCompliance[0].count;
    totalNonComplianceCount = parseInt(totalNonComplianceCount, 10) + parseInt(nonComplianceCount, 10);
    //  getting noncompliance list
    nonComplianceList = await sequelize.query(
      `select  type,COUNT(${audit.compliance_attribute}) filter (where ${audit.compliance_attribute}[1]='no' OR ${audit.compliance_attribute}[1]='NO' OR ${audit.compliance_attribute}[1]='No') from ${audit.audit_report_name} GROUP BY type`,
      {
        raw: true,
        type: QueryTypes.SELECT,
        searchPath: 'audit_tool',
        supportsSearchPath: true,
      },
    );
    for (const total of nonComplianceList) {
      const processArea = total.type;
      const processAreaNCCount = total.count;
      if (finalNCTypeCount.length === 0) {
        finalNCTypeCount.push(nonComplianceList);
      } else {
        finalNCCount = finalNCTypeCount[0];
        for (const finalData of finalNCCount) {
          if (finalData.type === processArea) {
            finalData.count = parseInt(finalData.count, 10) + parseInt(processAreaNCCount, 10);
          }
        }
      }
    }
  }
  return { totalComplianceCount, totalNonComplianceCount, finalNCCount };
};

const getAuditsByProject = async (queryResult) => {
  //   const query = `SELECT audit_id,
  // date_trunc('month', audit_start_date)::date as month_begin,
  // (date_trunc('month', audit_end_date) + interval '1 month -1 day')::date as month_end
  // FROM master_audit
  // GROUP BY date_trunc('month', audit_start_date),date_trunc('month', audit_end_date),audit_id`;
  //   const query1 = `select audit_id, to_char(audit_start_date, 'YYYY-MM'),to_char(audit_end_date, 'YYYY-MM') from master_audit`;
  const data1 = await dbInstance.masterAudit.findAll({
    where: queryResult,
    // include: [
    //   {
    //     model: dbInstance.projectData,
    //     as: 'projectData',
    //     attributes: ['project_name'],
    //     where: { project_id: queryResult.project_id },
    //   },
    // ],
    raw: true,
  });
  return data1;
};

const getAuditReportByProject = async (query) => {
  const result = await sequelize.query(query, {
    raw: true,
    type: QueryTypes.SELECT,
    searchPath: 'audit_tool',
    supportsSearchPath: true,
  });
  return result;
};

const getAuditReport = async (query) => {
  const result = await sequelize.query(query, {
    raw: true,
    type: QueryTypes.SELECT,
    searchPath: 'audit_tool',
    supportsSearchPath: true,
  });
  return result;
};

const getApplicability = async (query) => {
  const result = await sequelize.query(query, {
    raw: true,
    type: QueryTypes.SELECT,
    searchPath: 'audit_tool',
    supportsSearchPath: true,
  });
  return result;
};

const getmonthwiseNCData = async (request) => {
  const query = `SELECT * FROM master_audit WHERE (audit_start_date, audit_end_date) OVERLAPS ('${request.start_date}'::DATE, '${request.end_date}'::DATE) AND project_id='${request.project_id}' AND  status='Closed'`;
  const monthWiseData = await sequelize.query(query, {
    raw: true,
    type: QueryTypes.SELECT,
    searchPath: 'audit_tool',
    supportsSearchPath: true,
  });

  return monthWiseData;
};
const getmonthwiseNCDataAllProjects = async (request) => {
  const query = `SELECT * FROM master_audit WHERE (audit_start_date, audit_end_date) OVERLAPS ('${request.start_date}'::DATE, '${request.end_date}'::DATE) AND  status='Closed'`;
  const monthWiseData = await sequelize.query(query, {
    raw: true,
    type: QueryTypes.SELECT,
    searchPath: 'audit_tool',
    supportsSearchPath: true,
  });
  return monthWiseData;
};
const getmonthwiseCostCenterNCData = async (request) => {
  const query = `SELECT * FROM master_audit WHERE (audit_start_date, audit_end_date) OVERLAPS ('${request.start_date}'::DATE, '${request.end_date}'::DATE) AND cost_center_code='${request.cost_center_code}' AND  status='Closed'`;
  const monthWiseData = await sequelize.query(query, {
    raw: true,
    type: QueryTypes.SELECT,
    searchPath: 'audit_tool',
    supportsSearchPath: true,
  });

  return monthWiseData;
};

module.exports = {
  getAllAudits,
  getComplianceData,
  getAuditsByProject,
  getAuditReportByProject,
  getAuditReport,
  getApplicability,
  getmonthwiseNCData,
  getmonthwiseCostCenterNCData,
  getmonthwiseNCDataAllProjects,
};
