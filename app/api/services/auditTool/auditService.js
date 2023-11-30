/* eslint-disable indent */
/* eslint-disable no-nested-ternary */
/* eslint-disable camelcase */
/* eslint-disable arrow-body-style */
/* eslint-disable max-len */
const { nanoid } = require('nanoid');
const { readFile } = require('fs').promises;
const { emailMethod } = require('../../../config/config');
const employeeService = require('./employeeService');
const auditRepo = require('../../repositories/auditTool/auditRepository');
const { sendMail } = require('../../utils/email');
const emailSchema = require('../../utils/EmailSchema');
const { excelFormatter } = require('../../helpers/excelFormat');
const { createCalender } = require('../../helpers/calender');
const logger = require('../../utils/logger');
const { getProjectName } = require('./projectService');
const { differenceInDays, convertTZtoLocal } = require('../../utils/date');
const { empDetails } = require('../../repositories/auditTool/employeeRepository');
const { getCostCenterName } = require('./costCenterService');
const { auditReportService } = require('./auditReportsService');
const auditReportsRepo = require('../../repositories/auditTool/auditReportsRepository');

const auditIDGeneratorFunction = (masterAuditInfo, checkListType) => {
  const projectIdOrCostIdSnakeCase =
    masterAuditInfo.project_id === null && masterAuditInfo.cost_center_code
      ? masterAuditInfo.cost_center_code
      : masterAuditInfo.project_id.replace(' ', '_');
  const auditID = `${projectIdOrCostIdSnakeCase}_${checkListType.type}_${masterAuditInfo.instance}`; // auto generate
  return auditID;
};

const auditReportIDGenerator = (masterAuditInfo, checkListType) => {
  const projectIdOrCostIdSnakeCase =
    masterAuditInfo.project_id === null && masterAuditInfo.cost_center_code
      ? masterAuditInfo.cost_center_code
      : masterAuditInfo.project_id.replace(' ', '_');

  const auditReportName = `${'ar_audit_'}${projectIdOrCostIdSnakeCase}_${checkListType.type}_${
    masterAuditInfo.instance
  }`;
  return auditReportName;
};

const getSubStatus = async (auditId) => {
  const getStatus = await auditRepo.getSubStatus(auditId);
  return getStatus;
};

const updateSubStatus = async (auditId, subStatus) => {
  if (subStatus === 'In Progress' || subStatus === 'Initiated' || subStatus === 'Findings Submission') {
    const subStatus1 = 'DraftReportSent';
    await auditRepo.updateSubStatus(auditId, subStatus1); // update Status
  }
  if (subStatus === 'DraftReportSent') {
    const subStatus2 = 'FinalReportSent';
    await auditRepo.updateSubStatus(auditId, subStatus2); // update Status
  }
  const statusAfterUpdate = await getSubStatus(auditId);
  return statusAfterUpdate;
};

const getAllAudits = async () => {
  const allAudits = await auditRepo.getAudits();
  return allAudits;
};

const getAuditStatus = async () => {
  const auditStatus = await auditRepo.getAuditStatus();
  return auditStatus;
};

const updateAuditReport = async (masterAuditInfo) => {
  const masterAuditData = masterAuditInfo;
  if (masterAuditData.cost_center_code === '') {
    masterAuditData.cost_center_code = null;
  } else if (masterAuditData.project_id === '') {
    masterAuditData.project_id = null;
  }
  const updateAudits = await auditRepo.updateAuditReport(masterAuditData);
  return updateAudits[1][0];
};

const updateTeamAudit = async (teamAuditData, auditID) => {
  const updateTeam = await auditRepo.updateTeamAudit(teamAuditData, auditID);
  return updateTeam;
};

const updateDynamicChecklist = async (auditReportData, tableName) => {
  let updateQuery;
  let updateData;
  let comma;
  let count;
  for (let i = 0; i < auditReportData.length; i++) {
    const element = auditReportData[i];
    const size = Object.keys(element).length;
    updateQuery = `UPDATE ${tableName} SET `;
    count = 0;
    comma = ',';
    for (const property in element) {
      if (Object.hasOwnProperty.call(element, property)) {
        if (size - 1 === count) {
          comma = '';
        }
        if (element[property] == null) {
          updateQuery += `${property} = ${element[property]} ${comma} `;
        } else if (Array.isArray(element[property])) {
          const arrayToString = element[property].map((ele) => {
            return ele === null ? 'null' : ele.replace(/"/g, '').replace(/'/g, '');
          });
          // updateQuery += `${property} = '{${element[property]}}' ${comma} `;
          updateQuery += `${property} = '{${arrayToString}}' ${comma} `;
        } else {
          updateQuery += `${property} = '${
            property === 'id' ? element[property] : element[property].replace(/"/g, '').replace(/'/g, '')
          }' ${comma} `;
        }

        count += 1;
      }
    }
    updateQuery += `WHERE id = ${auditReportData[i].id}`;
    updateData = await auditRepo.updateDynamicChecklist(updateQuery);
  }
  return updateData;
};

const excelAttachment = async (filename) => {
  // consider the excel and all modification goes to this Excel
  const pathToAttachment = 'app/static/Excel/auditDraft.xlsx';

  // read file from the static path
  const attachment = await readFile(pathToAttachment, (err, data) => {
    if (err) logger.error(err);
    return data;
  });

  // if mail method is SEND_GRID then convert attachment to base64 otherwise nodeMailer will take care
  const EmailType = emailMethod;
  const sendCheckListAttachment =
    EmailType === 'SEND_GRID'
      ? {
          content: attachment.toString('base64'),
          filename: `${filename}.xlsx`,
          type: 'application/spreadsheet',
          disposition: 'attachment',
        }
      : {
          content: attachment,
          filename: `${filename}.xlsx`,
          type: 'application/spreadsheet',
          // disposition: 'attachment',
        };
  // return the generated attachment object
  return { sendCheckListAttachment };
};
const generateCalenderInvite = async (inviteData, employeeData) => {
  await createCalender(inviteData, employeeData); // create invite data and save in ics
  const invitePathAttachment = 'app/api/helpers/event.ics'; // stored ics PATH
  const EmailType = emailMethod;

  // read the ics file
  const inviteAttachment = await readFile(invitePathAttachment, (err, data) => {
    if (err) logger.error(err);
    return data;
  });

  // check if SEND_GRID is mail method,then convert to base64
  const attachmentData =
    EmailType === 'SEND_GRID'
      ? {
          filename: 'invite.ics',
          name: 'MeetingInvite.ics',
          content: inviteAttachment.toString('base64'),
          disposition: 'attachment',
          contentId: nanoid(),
          type: 'text/calendar; method=PUBLISH',
        }
      : {
          filename: 'invite.ics',
          name: 'MeetingInvite.ics',
          content: inviteAttachment,
          contentId: nanoid(),
          type: 'text/calendar; method=PUBLISH',
        };

  return attachmentData;
};
const auditDraftService = async (auditId, sheet, updatedSubStatus, inviteData) => {
  // retrieve the Necessary details required by using auditId from DB
  const auditInfo = await auditRepo.sendDraftData(auditId);

  auditInfo[0].auditId = auditId;

  // verified_by is replaced with employee name instead of id.
  const verifiedByEmployeeName = await empDetails(auditInfo[0].verified_by);
  auditInfo[0].verified_by = verifiedByEmployeeName[0].emp_name;

  // extract email ,auditTeamData and AuditorName from AuditInfo
  const [emails, auditTeamData, auditorName] = auditInfo[0].auditTeam.reduce(
    ([email, teamData, auditor], { employeeData, audit_role: auditRole }) => {
      if (auditRole === 'Auditor') auditor.push(employeeData.emp_name);
      email.push(employeeData.email_id);
      teamData.push(employeeData.emp_name);
      return [email, teamData, auditor];
    },
    [[], [], []],
  );

  const { costCenterName } = await getCostCenterName(auditInfo[0].cost_center_code);
  auditInfo[0].costCenterCode = auditInfo[0].cost_center_code;
  auditInfo[0].costCenterName = costCenterName;

  // construct Html mail using necessary Data
  const mailData =
    auditInfo[0].project_id === null
      ? emailSchema.sendDraftMailOptionsForCostCenter(auditInfo[0], auditorName, auditTeamData, updatedSubStatus)
      : emailSchema.sendDraftMailOptions(auditInfo[0], auditorName, auditTeamData, updatedSubStatus);

  const filename =
    auditInfo[0].project_id === null
      ? updatedSubStatus === 'FinalReportSent'
        ? `${auditInfo[0].costCenterName}_${auditId}_final`
        : `${auditInfo[0].costCenterName}_${auditId}_draft`
      : updatedSubStatus === 'FinalReportSent'
      ? `${auditInfo[0].projectData.project_name}_${auditId}_final`
      : `${auditInfo[0].projectData.project_name}_${auditId}_draft`;
  // generate calender for attachment
  let attachmentData;
  if (inviteData.meetingData) {
    attachmentData = await generateCalenderInvite(inviteData.meetingData, auditInfo);
  }
  // format the array of Objects to Excel Format
  const excelFormatted = await excelFormatter(sheet);
  if (!excelFormatted) return undefined;

  const { sendCheckListAttachment } = await excelAttachment(filename);
  let sendTeamMail;
  if (inviteData.meetingData) {
    sendTeamMail = await sendMail(mailData.subject, mailData.text, mailData.html, emails, attachmentData);
  } else {
    sendTeamMail = await sendMail(mailData.subject, mailData.text, mailData.html, emails, sendCheckListAttachment);
  }
  return sendTeamMail;
};
const getAuditDetails = async (auditId, projectId, checklistId) => {
  const auditData = await auditRepo.getAuditDetails(auditId, projectId, checklistId);
  let auditDetails = {
    id: auditData.id,
    project_name: auditData.projectData.project_name,
    project_id: auditData.project_id,
    cost_center_code: '',
    cost_center_name: '',
    checklist_name: auditData.masterCheckList.checklist_tablename,
    checklist_id: auditData.checklist_id,
    place_of_audit: auditData.place_of_audit,
    audit_start_date: convertTZtoLocal(auditData.audit_start_date),
    audit_end_date: convertTZtoLocal(auditData.audit_end_date),
    description: auditData.description,
    audit_remarks: auditData.audit_remarks,
    audit_id: auditData.audit_id,
    instance: auditData.instance,
    verified_by: auditData.verified_by,
    verified_by_name: auditData.employeeData.dataValues.verified_by_name,
    work_package: auditData.work_package,
    compliance_attribute: auditData.compliance_attribute,
    status: auditData.status,
    audit_sub_status: auditData.audit_sub_status,
    audit_report_name: auditData.audit_report_name,
    auditee_efforts: auditData.auditee_efforts,
    auditor_efforts: auditData.auditor_efforts,
  };
  if (auditData.status === 'Closed') {
    const complianceAttribute = auditData.compliance_attribute;
    const auditReportID = auditData.audit_report_name;
    const query1 = `select COUNT(${complianceAttribute}) from ${auditReportID} where ${complianceAttribute}[1]='no' OR ${complianceAttribute}[1]='NO' OR ${complianceAttribute}[1]='No'`;
    const data1 = await auditReportsRepo.getAuditReportByProject(query1);
    const count3 = data1[0].count;
    const query2 = `select COUNT(applicability) from ${auditReportID} where applicability[1]='Applicable' OR applicability[1]='Applicability'`;
    const data2 = await auditReportsRepo.getApplicability(query2);
    const applicabilityCount = data2[0].count;
    const processComplianceIndex = ([(applicabilityCount - count3) / applicabilityCount] * 100).toFixed(2);
    auditDetails.nonCompliances = count3;
    auditDetails.noOfApplicableChecks = applicabilityCount;
    auditDetails.processComplianceIndex = processComplianceIndex;
    return auditDetails;
  }

  return auditDetails;
};
// const getAuditDetails = async (auditId, projectId, checklistId) => {
//   const auditData = await auditRepo.getAuditDetails(auditId, projectId, checklistId);
//   return {
//     id: auditData.id,
//     project_name: auditData.projectData.project_name,
//     project_id: auditData.project_id,
//     cost_center_code: '',
//     cost_center_name: '',
//     checklist_name: auditData.masterCheckList.checklist_tablename,
//     checklist_id: auditData.checklist_id,
//     place_of_audit: auditData.place_of_audit,
//     audit_start_date: convertTZtoLocal(auditData.audit_start_date),
//     audit_end_date: convertTZtoLocal(auditData.audit_end_date),
//     description: auditData.description,
//     audit_remarks: auditData.audit_remarks,
//     audit_id: auditData.audit_id,
//     instance: auditData.instance,
//     verified_by: auditData.verified_by,
//     verified_by_name: auditData.employeeData.dataValues.verified_by_name,
//     work_package: auditData.work_package,
//     compliance_attribute: auditData.compliance_attribute,
//     status: auditData.status,
//     audit_sub_status: auditData.audit_sub_status,
//     audit_report_name: auditData.audit_report_name,
//     auditee_efforts: auditData.auditee_efforts,
//     auditor_efforts: auditData.auditor_efforts,
//   };
// };

const getAuditCostCenterDetails = async (auditId, costCenterCode, checklistId) => {
  const auditData = await auditRepo.getAuditCostCenterDetails(auditId, costCenterCode, checklistId);
  const auditDetails = {
    id: auditData.id,
    project_name: '',
    project_id: '',
    cost_center_code: auditData.cost_center_code,
    cost_center_name: auditData.cost_center_name,
    checklist_name: auditData.masterCheckList.checklist_tablename,
    checklist_id: auditData.checklist_id,
    place_of_audit: auditData.place_of_audit,
    audit_start_date: convertTZtoLocal(auditData.audit_start_date),
    audit_end_date: convertTZtoLocal(auditData.audit_end_date),
    description: auditData.description,
    audit_remarks: auditData.audit_remarks,
    audit_id: auditData.audit_id,
    instance: auditData.instance,
    verified_by: auditData.verified_by,
    verified_by_name: auditData.employeeData.dataValues.verified_by_name,
    work_package: '',
    compliance_attribute: auditData.compliance_attribute,
    status: auditData.status,
    audit_sub_status: auditData.audit_sub_status,
    audit_report_name: auditData.audit_report_name,
    auditee_efforts: auditData.auditee_efforts,
    auditor_efforts: auditData.auditor_efforts,
  };
  if (auditData.status === 'Closed') {
    const complianceAttribute = auditData.compliance_attribute;
    const auditReportID = auditData.audit_report_name;
    const query1 = `select COUNT(${complianceAttribute}) from ${auditReportID} where ${complianceAttribute}[1]='no' OR ${complianceAttribute}[1]='NO' OR ${complianceAttribute}[1]='No'`;
    const data1 = await auditReportsRepo.getAuditReportByProject(query1);
    const count3 = data1[0].count;
    const query2 = `select COUNT(applicability) from ${auditReportID} where applicability[1]='Applicable' OR applicability[1]='Applicability'`;
    const data2 = await auditReportsRepo.getApplicability(query2);
    const applicabilityCount = data2[0].count;
    const processComplianceIndex = ([(applicabilityCount - count3) / applicabilityCount] * 100).toFixed(2);
    auditDetails.nonCompliances = count3;
    auditDetails.noOfApplicableChecks = applicabilityCount;
    auditDetails.processComplianceIndex = processComplianceIndex;
    return auditDetails;
  }
  return auditDetails;
};
const getAuditCostCenterDetailsold = async (auditId, costCenterCode, checklistId) => {
  const auditData = await auditRepo.getAuditCostCenterDetails(auditId, costCenterCode, checklistId);
  return {
    id: auditData.id,
    project_name: '',
    project_id: '',
    cost_center_code: auditData.cost_center_code,
    cost_center_name: auditData.cost_center_name,
    checklist_name: auditData.masterCheckList.checklist_tablename,
    checklist_id: auditData.checklist_id,
    place_of_audit: auditData.place_of_audit,
    audit_start_date: convertTZtoLocal(auditData.audit_start_date),
    audit_end_date: convertTZtoLocal(auditData.audit_end_date),
    description: auditData.description,
    audit_remarks: auditData.audit_remarks,
    audit_id: auditData.audit_id,
    instance: auditData.instance,
    verified_by: auditData.verified_by,
    verified_by_name: auditData.employeeData.dataValues.verified_by_name,
    work_package: '',
    compliance_attribute: auditData.compliance_attribute,
    status: auditData.status,
    audit_sub_status: auditData.audit_sub_status,
    audit_report_name: auditData.audit_report_name,
    auditee_efforts: auditData.auditee_efforts,
    auditor_efforts: auditData.auditor_efforts,
  };
};

const getAuditReportDetails = async (auditReportId) => {
  const auditReportData = await auditRepo.getAuditReportDetails(auditReportId);
  // const complianceAttribute = auditReportData.compliance_attribute;
  // const auditReportID = auditReportData.audit_report_name;
  // const query1 = `select COUNT(${complianceAttribute}) from ${auditReportID} where ${complianceAttribute}[1]='no' OR ${complianceAttribute}[1]='NO' OR ${complianceAttribute}[1]='No'`;
  // const data1 = await auditReportsRepo.getAuditReportByProject(query1);
  // const count3 = data1[0].count;
  // const query2 = `select COUNT(applicability) from ${auditReportID} where applicability[1]='Applicable' OR applicability[1]='Applicability'`;
  // const data2 = await auditReportsRepo.getApplicability(query2);
  // const applicabilityCount = data2[0].count;
  // const processComplianceIndex = ([(applicabilityCount - count3) / applicabilityCount] * 100).toFixed(2);
  return auditReportData;
};

const getProjectID = async (auditId) => {
  const projectData = await auditRepo.getProjectID(auditId);
  return projectData;
};

const tableCreationQuery = (tableName, sendData) => {
  /**
   * @summary extract columns name from excel to create raw query in order to create table with its columns.
   * auditReportId is used as tableName
   */
  const firstObj = sendData[0];
  let count = 0;
  let query = `CREATE TABLE IF NOT EXISTS ${tableName} (`;
  for (const key in firstObj) {
    if (Object.hasOwnProperty.call(firstObj, key)) {
      const element = firstObj[key];
      let comma = ',';
      const size = Object.keys(firstObj).length;
      if (size - 1 === count) {
        comma = '';
      }
      if (key === 'id') {
        query += `${key} int primary key${comma} `;
      } else if (Array.isArray(element)) {
        query += `${key} TEXT[]${comma} `;
      } else {
        query += `${key} VARCHAR${comma} `;
      }
      count += 1;
    }
  }
  query += ')';
  return query;
};

const insertChecklistQuery = (sendData, tableName) => {
  /**
   * @summary extract columns and its data from request(frontend) to create raw query in order to
   *  insert data into respective columns.
   *  @field auditReportId is used as tableName
   */
  let keyValues = [];
  const arrayOfFiltered = sendData.map((element) => {
    const cleanedObject = {}; // generate,process and save all data required into this object
    const keys = Object.keys(element); // all keys name from object in a element.
    keyValues = keys.length > keyValues ? keys : keyValues;
    keys.forEach((objData, index) => {
      // each element is object which contains keys and values
      const key = keys[index];
      // object key names with "." & " " are replaced with "_"(underScore)
      cleanedObject[key.toLowerCase().trim().replace(/\s/g, '_').replace(/[.]/g, '_')] =
        key !== 'id'
          ? element[key] === null // if value is null then assign null.
            ? null
            : Array.isArray(element[key]) // check whether value is array
            ? element[key].map((ele) => ele.replace(/"/g, '').replace(/'/g, '')) // replace double quotes/single quote with empty space
            : element[key].replace(/"/g, '').replace(/'/g, '') // replace double quotes/single quote with empty space
          : element[key];
    });

    return cleanedObject;
  });

  // generate query for insert data into dynamic checkList table
  const insertQuery = `INSERT INTO ${tableName} SELECT * FROM json_populate_recordset(null::${tableName},'${JSON.stringify(
    arrayOfFiltered,
  )}');`;
  return insertQuery;
};

const deleteAuditTeamMembers = async (data) => {
  // get all the unique key of the rows and save it to a array
  const auditTeamMembersUniqueIds = data.map(({ unique_id }) => unique_id);
  // delete those rows from table
  const deleteTeamMembers = await auditRepo.deleteAuditTeamMembers(auditTeamMembersUniqueIds);
  return deleteTeamMembers;
};

const getProjectIDByName = async (projectName) => {
  const projectData = await auditRepo.getProjectIDByName(projectName);
  return projectData;
};
const getAuditsByProject = async (projectID) => {
  const auditsForProjectId = await auditRepo.getAuditsByProject(projectID);
  return auditsForProjectId.map(({ audit_id: auditId }) => auditId);
};

const gatherAndSaveAuditDetails = async (masterAuditInfo, auditTeamMembersData, checkList, checklistType) => {
  // check whether Audit is of project type or cost center type
  const masterAuditData = masterAuditInfo;
  if (masterAuditData.cost_center_code === '') {
    masterAuditData.cost_center_code = null;
  } else if (masterAuditData.project_id === '') {
    masterAuditData.project_id = null;
  }

  // generator unique audit ID
  const auditId = auditIDGeneratorFunction(masterAuditInfo, checklistType);
  // generator unique audit report name and use this name for creating table for audit report
  const auditReportName = auditReportIDGenerator(masterAuditInfo, checklistType);

  // assigning auditId and report name to masterAuditData object to save the info into database
  masterAuditData.audit_id = auditId;
  masterAuditData.audit_report_name = auditReportName;

  // create audit Team Details for audit_team table in a array
  const teamAuditData = auditTeamMembersData.map((ele) => ({
    ...ele,
    audit_id: auditId,
    status: 'Active',
  }));

  const { checkListData } = checkList; // checklist data from excel

  // generate raw query for create audit report table with its columns
  const rawQueryForAuditTableWithColumn = tableCreationQuery(auditReportName, checkListData);
  // generate raw queries for inserting dynamic data for audit report table
  const insertDataQuery = insertChecklistQuery(checkListData, auditReportName);

  /**
   * @summary create audit report table and insert the data into the table.
   * save the information of the audit into master checklist table
   */
  const saveAuditDetailsToDatabase = await auditRepo.saveAuditDetailsToMultipleTable({
    masterAuditData,
    teamAuditData,
    rawQueryToCreateTable: rawQueryForAuditTableWithColumn,
    insertDataQuery,
  });

  return saveAuditDetailsToDatabase;
};

const generateMailData = ({
  auditId,
  projName,
  projectID,
  costCenterName,
  costCenterCode,
  auditStartDate,
  auditEndDate,
  auditTeamMembersNames,
  auditStatus,
  auditorName,
  checklistType,
  description,
  verified_by,
  work_package,
  instance,
  inviteData,
}) => {
  // pass required mail Data in a object to generate mail html
  const requiredMailData = {
    auditId,
    projName,
    projectID,
    auditStartDate,
    auditEndDate,
    costCenterCode,
    costCenterName,
    auditTeamMembersNames,
    auditStatus,
    auditorName,
    verified_by,
    work_package,
    instance,
    checklistType,
    description,
    inviteData,
  };

  const mailingData =
    projectID === null
      ? emailSchema.sendInitiateMailForCostCentre(requiredMailData)
      : emailSchema.sendInitiateMail(requiredMailData);

  const calenderMailData =
    projectID === null
      ? emailSchema.calenderMailingDataForCostCentre(requiredMailData)
      : emailSchema.calenderMailingData(requiredMailData);
  return { mailingData, calenderMailData };
};

const getAuditorAndTeamIds = (teamData) => {
  const [auditorIds, teamMemberIds] = teamData.reduce(
    ([auditorId, teamMemberId], { audit_role: auditRole, team_member: teamMember }) => {
      teamMemberId.push(teamMember);
      if (auditRole === 'Auditor') auditorId.push(teamMember);
      return [auditorId, teamMemberId];
    },
    [[], []],
  );
  return { auditorIds, teamMemberIds };
};

const gatherEmployeeData = async (teamData) => {
  // gather All employee Data using Team Data and Their IdF
  const { auditorIds, teamMemberIds } = getAuditorAndTeamIds(teamData);
  const { auditTeamMembersNames, auditTeamMembersEmails, auditorName, employeeData } =
    await employeeService.individualEmployeeData(teamMemberIds, auditorIds);
  return { auditTeamMembersNames, auditTeamMembersEmails, auditorName, employeeData };
};

const sendAuditMail = async (teamData, masterAuditData, checklistType, inviteData) => {
  const {
    audit_start_date: auditStartDate,
    audit_end_date: auditEndDate,
    status: auditStatus,
    project_id: projectID,
    cost_center_code: costCenterCode,
    audit_id: auditId,
    verified_by,
    work_package,
    instance,
    description,
  } = masterAuditData;

  // get project name from database
  const { projName } = await getProjectName(projectID);
  const { costCenterName } = await getCostCenterName(costCenterCode);
  // get all team Members details using teamData
  const { auditTeamMembersNames, auditTeamMembersEmails, auditorName, employeeData } = await gatherEmployeeData(
    teamData,
  );

  // generate mail data using team & project details
  const { calenderMailData } = generateMailData({
    auditId,
    projName,
    projectID,
    auditStartDate,
    auditEndDate,
    auditTeamMembersNames,
    auditStatus,
    auditorName,
    costCenterName,
    costCenterCode,
    checklistType: checklistType.type,
    description,
    verified_by,
    work_package,
    instance,
    inviteData,
  });

  // generate calender for attachment
  const attachmentData = await generateCalenderInvite(inviteData, employeeData);

  // send Initiate Mail - removed because single email is enough to send Mail
  // const initiateMail = await sendMail(mailingData.subject, mailingData.text, mailingData.html, auditTeamMembersEmails);

  // send Calender Invite Mail
  const calenderMail = await sendMail(
    calenderMailData.subject,
    calenderMailData.text,
    calenderMailData.html,
    auditTeamMembersEmails,
    attachmentData,
  );
  return { calenderMail };
};

const sendMailForProjectData = async (teamData, masterAuditData, checklistType, auditReportData) => {
  const {
    audit_start_date: auditStartDate,
    audit_end_date: auditEndDate,
    status: auditStatus,
    project_id: projectID,
    audit_id: auditId,
    verified_by,
    instance,
    work_package,
    description,
  } = masterAuditData;

  // get projectName from database
  const { projName, shortProjectName } = await getProjectName(projectID);

  // get Team Details for the project
  const { auditTeamMembersNames, auditTeamMembersEmails, auditorName } = await gatherEmployeeData(teamData);
  const complianceAttribute = masterAuditData.compliance_attribute;
  const auditReportID = masterAuditData.audit_report_name;
  const query1 = `select COUNT(${complianceAttribute}) from ${auditReportID} where ${complianceAttribute}[1]='no' OR ${complianceAttribute}[1]='NO' OR ${complianceAttribute}[1]='No'`;
  const data1 = await auditReportsRepo.getAuditReportByProject(query1);
  const count3 = data1[0].count;
  const query2 = `select COUNT(applicability) from ${auditReportID} where applicability[1]='Applicable' OR applicability[1]='Applicability'`;
  const data2 = await auditReportsRepo.getApplicability(query2);
  const applicabilityCount = data2[0].count;
  const processComplianceIndex = ([(applicabilityCount - count3) / applicabilityCount] * 100).toFixed(2);
  const auditInformation = {
    auditId,
    projName,
    projectID,
    auditStartDate,
    auditEndDate,
    auditTeamMembersNames,
    auditStatus,
    auditorName,
    work_package,
    verified_by,
    instance,
    checklistType: checklistType.type,
    description,
    nonCompliances: count3,
    noOfApplicableChecks: applicabilityCount,
    processComplianceIndex,
  };
  const mailingData =
    auditStatus === 'Closed'
      ? emailSchema.sendClosedMail(auditInformation)
      : emailSchema.sendAuditUpdatesMail(auditInformation);

  const filename =
    auditStatus === 'Closed' ? `${shortProjectName}_${auditId}_closed` : `${projName}_${auditId}_Inprogress`;

  // generate excel data
  const excelFormatted = await excelFormatter(auditReportData);
  if (!excelFormatted) return undefined; // if excel data not generated return undefined

  // generate excel object to attach as attachment in Mail
  const { sendCheckListAttachment } = await excelAttachment(filename);

  // send mail using all details and attachments
  const sentClosedMail = await sendMail(
    mailingData.subject,
    mailingData.text,
    mailingData.html,
    auditTeamMembersEmails,
    sendCheckListAttachment,
  );
  return { sentClosedMail, auditInformation };
};

const sendMailForCostCenterData = async (teamData, masterAuditData, checklistType, auditReportData) => {
  const {
    audit_start_date: auditStartDate,
    audit_end_date: auditEndDate,
    status: auditStatus,
    cost_center_code: costCenterCode,
    audit_id: auditId,
    verified_by,
    instance,
    work_package,
    description,
  } = masterAuditData;

  // get projectName from database
  const { costCenterName } = await getCostCenterName(costCenterCode);

  // get Team Details for the project
  const { auditTeamMembersNames, auditTeamMembersEmails, auditorName } = await gatherEmployeeData(teamData);

  const auditInformation = {
    auditId,
    auditStartDate,
    auditEndDate,
    costCenterCode,
    costCenterName,
    auditTeamMembersNames,
    auditStatus,
    auditorName,
    work_package,
    verified_by,
    instance,
    checklistType: checklistType.type,
    description,
    // nonCompliances: count3,
    // noOfApplicableChecks: applicabilityCount,
    // processComplianceIndex,
  };

  const mailingData =
    auditStatus === 'Closed'
      ? emailSchema.sendClosedMailForCostCenter(auditInformation)
      : emailSchema.sendAuditUpdatesMailForCostCenter(auditInformation);

  const filename =
    auditStatus === 'Closed' ? `${costCenterName}_${auditId}_closed` : `${costCenterName}_${auditId}_Inprogress`;

  // generate excel data
  const excelFormatted = await excelFormatter(auditReportData);
  if (!excelFormatted) return undefined; // if excel data not generated return undefined

  // generate excel object to attach as attachment in Mail
  const { sendCheckListAttachment } = await excelAttachment(filename);

  // send mail using all details and attachments
  const sentClosedMail = await sendMail(
    mailingData.subject,
    mailingData.text,
    mailingData.html,
    auditTeamMembersEmails,
    sendCheckListAttachment,
  );
  return { sentClosedMail };
};

const sendAuditClosedMail = async (teamData, masterAuditData, checklistType, auditReportData) => {
  if (masterAuditData.project_id !== null) {
    const sendProjectMail = await sendMailForProjectData(teamData, masterAuditData, checklistType, auditReportData);
    return sendProjectMail;
  }
  const sendCostCentreMail = await sendMailForCostCenterData(teamData, masterAuditData, checklistType, auditReportData);
  return sendCostCentreMail;
};

const getChecklistType = async (checklistId) => {
  const checkListId = await auditRepo.getCheckListType(checklistId);
  return checkListId;
};

const lessThanTwoDays = (allNearClosedAudits) => {
  return allNearClosedAudits.length > 0
    ? allNearClosedAudits.filter((ele) => differenceInDays(ele.audit_end_date) <= 2)
    : [];
};

const findNearClosedAudits = async () => {
  const allNearClosedAudits = await auditRepo.nearClosedAudits();
  const auditIds = lessThanTwoDays(allNearClosedAudits);
  return auditIds;
};

const getEmployee = async (auditId, empId) => {
  const empCheck = await auditRepo.getEmployee(auditId, empId);
  return empCheck;
};

const checkClosedStatus = async (tableName) => {
  const query = `select status[1],type from ${tableName} where status[1]='Open' OR status[1]='Inprogress' OR status[1]='Onhold'`;
  const closedCheck = await auditRepo.getCheckClosedStatus(query);
  return closedCheck;
};

const checkEffortStatus = async (auditID) => {
  const closedCheck = await auditRepo.getCheckEffortStatus(auditID);
  return closedCheck;
};
const getAuditsForAllPrjs = async () => {
  const auditsForAllProject = await auditRepo.getAuditsForAllProjects();
  return auditsForAllProject.map(({ audit_id: auditId }) => auditId);
};

const getAuditTeamDetails = async (auditId) => {
  const auditTeamData = await auditRepo.getAuditTeamData(auditId);
  const teamData = [];
  auditTeamData.forEach((teamInfo, i) => {
    teamData.push({
      key: i + 1,
      unique_id: teamInfo.unique_id,
      audit_id: teamInfo.audit_id,
      audit_role: teamInfo.audit_role,
      team_member: teamInfo.team_member,
      remarks: teamInfo.remarks,
      status: teamInfo.status,
      team_member_name: teamInfo.employeeData.dataValues.audit_member_name,
    });
  });
  return teamData;
};

const getAuditsByCostCenter = async (costCenterCode) => {
  const auditsForCostCenter = await auditRepo.getAuditsByCostCenter(costCenterCode);
  return auditsForCostCenter.map(({ audit_id: auditId }) => auditId);
};

const fetchAndSendMailForNonClosedAudits = async (auditDetails, customMail, toMailList, ccMailList) => {
  const {
    audit_id: auditId,
    project_id: projectID,
    checklist_id: checkListId,
    cost_center_code: costCenterCode,
    audit_start_date: auditStartDate,
    audit_end_date: auditEndDate,
    status: auditStatus,
    work_package,
    instance,
    verified_by,
    description,
  } = auditDetails;
  const checklistType = await getChecklistType(checkListId); // get checklistType
  const { projName } = await getProjectName(projectID); // get project id
  const { costCenterName } = await getCostCenterName(costCenterCode);

  const employeeIds = await auditRepo.getAuditTeamMembersDetails(auditId); // get employeeIds for this audit

  // verified_by is replaced with employee name instead of id.
  const verifiedByEmployeeDetail = await empDetails(verified_by);
  const verifiedByEmployeeName = verifiedByEmployeeDetail[0].emp_name;

  // auditor is leading person and should be appear in email
  const { auditorIds, teamMemberIds } = getAuditorAndTeamIds(employeeIds);

  // get Employee details using their employee ids
  const { auditTeamMembersNames, auditTeamMembersEmails, auditorName } = await employeeService.individualEmployeeData(
    teamMemberIds,
    auditorIds,
  );

  const requiredMailData = {
    auditId,
    projName,
    projectID,
    auditStartDate,
    auditEndDate,
    costCenterCode,
    costCenterName,
    auditTeamMembersNames,
    auditStatus,
    work_package,
    verified_by: verifiedByEmployeeName,
    instance,
    auditorName,
    checklistType: checklistType.type,
    description,
  };
  // generate mail data such as subject ,text ,html using all information
  const mailingData =
    projectID === null
      ? emailSchema.auditNotClosedForCostCenter(requiredMailData, customMail)
      : emailSchema.auditNotClosed(requiredMailData, customMail);

  const mailSent =
    customMail === true
      ? await sendMail(mailingData.subject, mailingData.text, mailingData.html, toMailList, false, ccMailList)
      : await sendMail(mailingData.subject, mailingData.text, mailingData.html, auditTeamMembersEmails);

  return { mailSent, auditDetails: { auditId, projectID, checkListId, auditTeamMembersEmails } };
};

const sendCustomMailForNonClosedAudits = async (auditId, toMailList, ccMailList) => {
  /**
   * @description to ensure the @function fetchAndSendMailForNonClosedAudits function
   * add custom TO and CC mail list from users.
   * @var customMail to tell fetchAndSendMailForNonClosedAudits Function that this has Custom mailing list
   */
  const customMail = true;

  // get Audit Details(i.e non closed) details from database.
  const nonClosedAuditDetails = await auditRepo.getAuditDetailsByAuditID(auditId);

  // fetch all necessary details of the audit and send mail with custom cc and to mail list.
  const sendMailForNonClosedAudit = await fetchAndSendMailForNonClosedAudits(
    nonClosedAuditDetails,
    customMail,
    toMailList,
    ccMailList,
  );

  return sendMailForNonClosedAudit;
};

module.exports = {
  gatherAndSaveAuditDetails,
  sendCustomMailForNonClosedAudits,
  fetchAndSendMailForNonClosedAudits,
  getAllAudits,
  auditReportIDGenerator,
  updateAuditReport,
  updateTeamAudit,
  updateDynamicChecklist,
  auditDraftService,
  getAuditDetails,
  getAuditReportDetails,
  getProjectID,
  getAuditStatus,
  deleteAuditTeamMembers,
  getProjectIDByName,
  getAuditsByProject,
  sendAuditMail,
  sendAuditClosedMail,
  updateSubStatus,
  getSubStatus,
  getChecklistType,
  findNearClosedAudits,
  getAuditorAndTeamIds,
  getEmployee,
  checkClosedStatus,
  getAuditsForAllPrjs,
  getAuditTeamDetails,
  getAuditCostCenterDetails,
  getAuditsByCostCenter,
  checkEffortStatus
};
