const auditService = require('../../services/auditTool/auditService');
const constants = require('../../utils/constants');
const appResponse = require('../../utils/AppResponse');
const logger = require('../../utils/logger');

const saveAuditReport = async (req, res) => {
  try {
    const { masterAuditInfo, auditTeamMembersData, checkList, meetingData } = req.body;

    // filled audit Details in master_audit details
    const checklistType = await auditService.getChecklistType(masterAuditInfo.checklist_id);

    const processAndSaveAuditDetails = await auditService.gatherAndSaveAuditDetails(
      masterAuditInfo,
      auditTeamMembersData,
      checkList,
      checklistType,
    );
    // while sending mail replacing verified_by with name as employee id is not understandable for user.
    processAndSaveAuditDetails.auditDetailsToMasterAudit.verified_by = masterAuditInfo.verified_by_name;

    // Send Initiate Mail and Calender Invite to all Team Members
    const sentMail = await auditService.sendAuditMail(
      processAndSaveAuditDetails.teamAuditDetails,
      processAndSaveAuditDetails.auditDetailsToMasterAudit,
      checklistType,
      meetingData,
    );
    // if (!sentMail.initiateMail && !sentMail.calenderMail) {
    if (!sentMail.calenderMail) {
      return appResponse.emailDeliveryFail(res, constants.EMAIL_FAIL);
    }
    if (processAndSaveAuditDetails.insertAuditReportDataToTable && sentMail) {
      return appResponse.success(res, constants.INSERTED_SUCCESSFULLY, {
        masterAuditData: processAndSaveAuditDetails.auditDetailsToMasterAudit,
        teamAudit: processAndSaveAuditDetails.teamAuditDetails,
      });
    }
    return appResponse.notInserted(res, constants.NOT_INSERTED);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      if (error?.errors[0].message === 'audit_id must be unique') {
        logger.error(error?.errors[0].message);
        return appResponse.expectationFailed(res, constants.DUPLICATE_RECORD);
      }
    }
    if (error.message === 'audit_id must be unique') {
      // logger.error(error.message);
      return appResponse.expectationFailed(res, constants.DUPLICATE_RECORD);
    }
    if (error.message === 'transaction Error') {
      logger.error(error);
      logger.error('Saved Data has been rolled backed');
      return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
    }
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// get audits
const getAllAudits = async (req, res) => {
  try {
    const data = await auditService.getAllAudits();
    if (data) return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, data);
    return appResponse.conflict(res, constants.CANNOT_FETCH);
  } catch (error) {
    logger.error(error);
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  }
};

const getAuditStatus = async (req, res) => {
  try {
    const data = await auditService.getAuditStatus();
    if (data) return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, data);
    return appResponse.conflict(res, constants.CANNOT_FETCH);
  } catch (error) {
    logger.error(error);
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  }
};

const updateAuditReport = async (req, res) => {
  try {
    const {
      masterAuditData,
      checkList: { checkListData: auditReportData },
      teamAuditData,
    } = req.body;

    const { audit_report_name: tableName, audit_id: auditID, checklist_id: checkListId } = masterAuditData;
    // update Master Audit data to master_audit Table.
    const updatedMasterAuditData = await auditService.updateAuditReport(masterAuditData);

    // update team members details for the audit to team_audit table.
    const teamUpdateData = await auditService.updateTeamAudit(teamAuditData, auditID);
    // update changes for checkListData to dynamically created checklist/report table.
    const dynamicCheckListData = await auditService.updateDynamicChecklist(auditReportData, tableName);
    // get checklist Type of checklist from database and add it to mail.
    const checklistType = await auditService.getChecklistType(checkListId);

    if (updatedMasterAuditData.status === 'Closed') {
      const checkClosedStatus = await auditService.checkClosedStatus(tableName);
      const checkEfforts = await auditService.checkEffortStatus(auditID);

      if (checkClosedStatus.length > 0) {
        return appResponse.methodNotAllowed(res, constants.CHECKS_OPEN, checkClosedStatus);
      }
    }

    // while sending mail replacing verified_by with name as employee id is not understandable for user.
    updatedMasterAuditData.verified_by = masterAuditData.verified_by_name;
    // after all updates to database, notify users through mail.
    const sentMail = await auditService.sendAuditClosedMail(
      teamAuditData,
      updatedMasterAuditData,
      checklistType,
      auditReportData,
    );

    if (!sentMail.sentClosedMail) {
      return appResponse.expectationFailed(res, constants.EMAIL_FAIL);
    }

    if (updatedMasterAuditData && teamUpdateData && dynamicCheckListData) {
      return appResponse.success(res, constants.DATA_UPDATED);
    }
    return appResponse.notInserted(res, constants.UPDATE_FAIL);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const auditSendDraft = async (req, res) => {
  try {
    const { auditId, tableData } = req.body;
    const { audit_sub_status: subStatus } = await auditService.getSubStatus(auditId);
    const { audit_sub_status: updatedSubStatus } = await auditService.updateSubStatus(auditId, subStatus);
    const sentDraftEmail = await auditService.auditDraftService(auditId, tableData, updatedSubStatus, req.body);
    if (!sentDraftEmail) return appResponse.conflict(res, constants.EMAIL_FAIL);
    return appResponse.success(res, constants.EMAIL_SENT);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// get audit details by audit id
const getAuditDetails = async (req, res) => {
  const { auditId, empId } = req.body;
  try {
    const empCheck = await auditService.getEmployee(auditId, empId);
    if (empCheck) {
      const projectData = await auditService.getProjectID(auditId);
      const { project_id: projectId, checklist_id: checklistId, cost_center_code: costCenterCode } = projectData;
      let auditData;
      if (projectData.cost_center_code === null) {
        auditData = await auditService.getAuditDetails(auditId, projectId, checklistId);
      } else {
        auditData = await auditService.getAuditCostCenterDetails(auditId, costCenterCode, checklistId);
      }
      const auditTeamData = await auditService.getAuditTeamDetails(auditId);
      const auditReportData = await auditService.getAuditReportDetails(auditData.audit_report_name);
      // if (auditData.status === 'Closed') {
      //   auditData = {
      //     nonCompliances: auditReportData.nonCompliances,
      //     noOfApplicableChecks: auditReportData.noOfApplicableChecks,
      //     processComplianceIndex: auditReportData.processComplianceIndex,
      //   };
      // }

      // (auditData.nonCompliances = auditReportData.nonCompliances),
      //   (auditData.noOfApplicableChecks = auditReportData.noOfApplicableChecks),
      //   (auditData.processComplianceIndex = auditReportData.processComplianceIndex);
      if (auditData && auditReportData) {
        return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, {
          auditData,
          auditTeamData,
          auditReportData,
        });
      }

      return appResponse.notFound(res, constants.CANNOT_FETCH);
    }
    return appResponse.conflict(res, constants.EMP_NOT_EXIST);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// delete audit team members
const deleteAuditTeamMembers = async (req, res) => {
  try {
    const data = req.body;
    const deletedData = await auditService.deleteAuditTeamMembers(data);
    if (deletedData > 0) return appResponse.success(res, constants.DELETE_SUCCESSFUL);
    return appResponse.conflict(res, constants.DELETE_FAIL);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// get audits
const getAuditsByProject = async (req, res) => {
  const projectName = req.body.project_name;
  try {
    if (projectName) {
      let data;
      if (projectName === 'All') {
        data = await auditService.getAuditsForAllPrjs();
      } else {
        const result = await auditService.getProjectIDByName(projectName);
        const projectID = result.project_id;
        data = await auditService.getAuditsByProject(projectID);
      }
      if (data) return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, data);
    } else {
      let data;
      if (req.body.cost_center_code === 'All') {
        data = await auditService.getAuditsForAllPrjs();
      } else {
        data = await auditService.getAuditsByCostCenter(req.body.cost_center_code);
      }
      if (data) return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, data);
    }

    return appResponse.conflict(res, constants.CANNOT_FETCH);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const sendCustomMailForNonClosedAudit = async (req, res) => {
  try {
    const { auditId, toMailList, ccMailList } = req.body;
    const sendNonClosedMail = await auditService.sendCustomMailForNonClosedAudits(auditId, toMailList, ccMailList);
    if (!sendNonClosedMail.mailSent) {
      return appResponse.conflict(res, constants.EMAIL_FAIL);
    }
    return appResponse.success(res, constants.EMAIL_SENT, sendNonClosedMail.auditDetails);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

module.exports = {
  saveAuditReport,
  getAllAudits,
  updateAuditReport,
  auditSendDraft,
  getAuditDetails,
  getAuditStatus,
  deleteAuditTeamMembers,
  getAuditsByProject,
  sendCustomMailForNonClosedAudit,
};
