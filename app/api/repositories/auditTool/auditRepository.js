/* eslint-disable no-await-in-loop */
const { Op } = require('sequelize');
const { QueryTypes } = require('sequelize');
const logger = require('../../utils/logger');
const dbInstance = require('../../models');
const { sequelize } = require('../../models');
const { Sequelize } = require('../../models');

const nearClosedAudits = async () => {
  const audits = await dbInstance.masterAudit.findAll({
    where: { status: { [Op.ne]: 'Closed' } },
    raw: true,
  });
  return audits;
};

const sendDraftData = async (auditId) => {
  const finalDraftData = await dbInstance.masterAudit
    .findAll({
      where: { audit_id: auditId },
      attributes: [
        'project_id',
        'cost_center_code',
        'audit_start_date',
        'audit_end_date',
        'status',
        'checklist_id',
        'description',
        'verified_by',
        'work_package',
        'instance',
      ],
      include: [
        {
          model: dbInstance.auditTeam,
          as: 'auditTeam',
          attributes: ['team_member', 'audit_role'],
          include: [
            {
              model: dbInstance.employeeData,
              as: 'employeeData',
              attributes: ['email_id', 'emp_name'],
            },
          ],
        },
        {
          model: dbInstance.projectData,
          as: 'projectData',
          attributes: ['project_name'],
        },
        {
          model: dbInstance.masterCheckList,
          as: 'masterCheckList',
          attributes: ['type'],
        },
      ],
    })
    .then((res) => JSON.parse(JSON.stringify(res)));
  // raw:true and nest:true not Used because to Avoid Separation of data
  return finalDraftData;
};

// get all projects
const getAudits = async () => {
  const getAudit = await dbInstance.masterAudit.findAll({});
  return getAudit;
};

// get all audit status
const getAuditStatus = async () => {
  const auditStatus = await dbInstance.auditStatus.findAll();
  return auditStatus;
};

const getLastAuditID = async () => {
  const lastId = await dbInstance.masterAudit.findOne({
    raw: true,
    limit: 1,
    attributes: ['audit_id', 'audit_report_name'],
    order: [['createdAt', 'DESC']],
  });
  return lastId;
};

const updateAuditReport = async (masterAuditData) => {
  const updateAuditData = await dbInstance.masterAudit.update(
    {
      project_id: masterAuditData.project_id,
      cost_center_code: masterAuditData.cost_center_code,
      checklist_id: masterAuditData.checklist_id,
      audit_start_date: masterAuditData.audit_start_date,
      audit_end_date: masterAuditData.audit_end_date,
      status: masterAuditData.status,
      place_of_audit: masterAuditData.place_of_audit,
      description: masterAuditData.description,
      audit_remarks: masterAuditData.audit_remarks,
      project_name: masterAuditData.project_name,
      work_package: masterAuditData.work_package,
      instance: masterAuditData.instance,
      verified_by: masterAuditData.verified_by,
      audit_report_name: masterAuditData.audit_report_name,
      audit_sub_status: masterAuditData.audit_sub_status,
      auditee_efforts: masterAuditData.auditee_efforts,
      auditor_efforts: masterAuditData.auditor_efforts,
    },
    { where: { id: masterAuditData.id }, returning: true, raw: true },
  );

  return updateAuditData;
};

const updateTeamAudit = async (teamAuditData, auditID) => {
  let updateTeamData;
  for (let i = 0; i < teamAuditData.length; i++) {
    // updating audit team with uniqueid
    if (teamAuditData[i].unique_id) {
      updateTeamData = await dbInstance.auditTeam.update(
        {
          audit_role: teamAuditData[i].audit_role,
          team_member: teamAuditData[i].team_member,
          remarks: teamAuditData[i].remarks,
        },
        { where: { unique_id: teamAuditData[i].unique_id } },
      );
    } else {
      // if it is new record while updating
      // checking whether team member exist or not
      const teamMemberData = await dbInstance.auditTeam.findOne({
        where: {
          [Op.and]: [{ audit_id: { [Op.like]: auditID } }, { team_member: { [Op.eq]: teamAuditData[i].team_member } }],
        },
      });
      // if teamMember exist and status inactive, change status as active
      if (teamMemberData !== null) {
        updateTeamData = await dbInstance.auditTeam.update(
          { status: 'Active' },
          { where: { unique_id: teamMemberData.dataValues.unique_id } },
        );
      } else {
        // if teamMember doesn't exist adding as new record
        const teamAuditInsert = {
          audit_id: auditID,
          audit_role: teamAuditData[i].audit_role,
          team_member: teamAuditData[i].team_member,
          remarks: teamAuditData[i].remarks,
          status: 'Active',
        };
        updateTeamData = await dbInstance.auditTeam.create(teamAuditInsert);
      }
    }
  }
  return updateTeamData;
};

const updateDynamicChecklist = async (updateQuery) => {
  const updateData = await sequelize.query(updateQuery, { searchPath: 'audit_tool', supportsSearchPath: true });
  return updateData;
};

const getAuditTeamMembersDetails = async (auditId) => {
  const getTeams = await dbInstance.auditTeam.findAll({
    attributes: ['team_member', 'audit_role'],
    where: { audit_id: auditId },
    raw: true,
  });
  return getTeams;
};

const getAuditDetails = async (auditId, projectId, checklistId) => {
  const getAudit = await dbInstance.masterAudit.findOne({
    // audit_id,
    where: { audit_id: auditId },
    include: [
      {
        model: dbInstance.employeeData,
        as: 'employeeData',
        attributes: [['emp_name', 'verified_by_name']],
        on: {
          emp_id: { [Op.eq]: Sequelize.col('master_audit.verified_by') },
        },
      },

      {
        model: dbInstance.projectData,
        as: 'projectData',
        where: { project_id: projectId },
      },
      {
        model: dbInstance.masterCheckList,
        as: 'masterCheckList',
        where: { checklist_id: checklistId },
      },
      // {
      //   model: dbInstance.auditTeam,
      //   as: 'auditTeam',
      //   // where: { audit_id },
      //   required: false,
      //   where: {
      //     [Op.and]: [{ audit_id: { [Op.like]: auditId } }, { status: { [Op.eq]: 'Active' } }],
      //   },
      //   // && status:'Inactive'
      //   attributes: ['unique_id', 'audit_role', 'team_member', 'remarks', 'status'],
      // },
    ],
  });
  return getAudit;
};

const getAuditCostCenterDetails = async (auditId, costCenterCode, checklistId) => {
  const getAudit = await dbInstance.masterAudit.findOne({
    // audit_id,
    where: { audit_id: auditId },
    include: [
      {
        model: dbInstance.employeeData,
        as: 'employeeData',
        attributes: [['emp_name', 'verified_by_name']],
        on: {
          emp_id: { [Op.eq]: Sequelize.col('master_audit.verified_by') },
        },
      },
      {
        model: dbInstance.costCenter,
        as: 'costCenter',
        where: { cost_center_code: costCenterCode },
      },
      {
        model: dbInstance.masterCheckList,
        as: 'masterCheckList',
        where: { checklist_id: checklistId },
      },
    ],
  });
  return getAudit;
};

const getAuditReportDetails = async (auditReportId) => {
  const getQuery = `SELECT * FROM ${auditReportId} order by id ASC`;
  const getAuditData = await sequelize.query(getQuery, {
    type: QueryTypes.SELECT,
    searchPath: 'audit_tool',
    supportsSearchPath: true,
  });
  return getAuditData;
};

const getProjectID = async (auditId) => {
  const projectId = await dbInstance.masterAudit.findOne({
    where: { audit_id: auditId },
    raw: true,
    limit: 1,
    attributes: ['project_id', 'cost_center_code', 'checklist_id', 'audit_id', 'audit_report_name'],
  });
  return projectId;
};

const deleteAuditTeamMembers = async (teamMemberIds) => {
  const deleted = await dbInstance.auditTeam.destroy({ where: { unique_id: { [Op.in]: teamMemberIds } } });
  return deleted;
};

// get projectID
const getProjectIDByName = async (projectName) => {
  const projName = await dbInstance.projectData.findOne({ where: { project_name: projectName } });
  return projName;
};

// get project by audits
const getAuditsByProject = async (projectID) => {
  const getAudit = await dbInstance.masterAudit.findAll({ where: { project_id: projectID }, raw: true });
  return getAudit;
};

const getSubStatus = async (auditId) => {
  const getStatus = await dbInstance.masterAudit.findOne({
    attributes: ['audit_sub_status'],
    where: { audit_id: auditId },
    raw: true,
  });
  return getStatus;
};
const updateSubStatus = async (auditId, subStatus) => {
  const updatedSubStatus = await dbInstance.masterAudit.update(
    { audit_sub_status: subStatus },
    { where: { audit_id: auditId }, returning: true },
  );
  return updatedSubStatus;
};

const getCheckListType = async (checklistId) => {
  const checkListType = await dbInstance.masterCheckList.findOne({
    attributes: ['type'],
    where: { checklist_id: checklistId },
    raw: true,
  });
  return checkListType;
};

const getEmployee = async (auditId, empId) => {
  const empCheck = await dbInstance.auditTeam.findOne({
    where: { audit_id: auditId, team_member: empId, status: 'Active' },
    raw: true,
  });
  return empCheck;
};

const getCheckClosedStatus = async (query) => {
  const result = await sequelize.query(query, {
    raw: true,
    type: QueryTypes.SELECT,
    searchPath: 'audit_tool',
    supportsSearchPath: true,
  });
  return result;
};

const getCheckEffortStatus = async (auditID) => {
  const getAudit = await dbInstance.masterAudit.findAll({ where: { audit_id: auditID } });
  return getAudit;
};

// get all project audits
const getAuditsForAllProjects = async () => {
  const getAudit = await dbInstance.masterAudit.findAll({ attributes: ['audit_id'] });
  return getAudit;
};

const getAuditTeamData = async (auditId) => {
  const getAuditTeam = await dbInstance.auditTeam.findAll({
    where: { audit_id: auditId },
    include: [
      {
        model: dbInstance.employeeData,
        as: 'employeeData',
        attributes: [['emp_name', 'audit_member_name']],
        on: {
          emp_id: { [Op.eq]: Sequelize.col('audit_team.team_member') },
        },
      },
    ],
  });
  return getAuditTeam;
};

// get audits by costCenterCode
const getAuditsByCostCenter = async (costCenterCode) => {
  const getAudit = await dbInstance.masterAudit.findAll({ where: { cost_center_code: costCenterCode }, raw: true });
  return getAudit;
};

// get Audit Details by using audit_id(primary Key)
const getAuditDetailsByAuditID = async (auditId) => {
  const auditDetails = await dbInstance.masterAudit.findOne({
    raw: true,
    where: { audit_id: auditId },
  });
  return auditDetails;
};

const saveAuditDetailsToMultipleTable = async ({
  masterAuditData,
  teamAuditData,
  rawQueryToCreateTable,
  insertDataQuery,
}) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      // save the main information of the Audit into Master checklist Table
      const auditDetailsToMasterAudit = await dbInstance.masterAudit.create(masterAuditData, {
        transaction: t,
      });
      // create audit Report table using raw query along with columns
      const createAuditReportTable = await sequelize.query(rawQueryToCreateTable, {
        searchPath: 'audit_tool',
        supportsSearchPath: true,
        transaction: t,
      });

      // insert data into audit report table which was created earlier step
      const insertAuditReportDataToTable = await sequelize.query(insertDataQuery, {
        searchPath: 'audit_tool',
        supportsSearchPath: true,
        transaction: t,
      });

      // save the team members details of the audit into table
      const teamAuditDetails = await dbInstance.auditTeam.bulkCreate(teamAuditData, {
        returning: true,
        transaction: t,
      });

      return {
        auditDetailsToMasterAudit: auditDetailsToMasterAudit.toJSON(),
        teamAuditDetails: JSON.parse(JSON.stringify(teamAuditDetails)),
        createAuditReportTable,
        insertAuditReportDataToTable,
      };
    });
    return result;
  } catch (error) {
    console.log(error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      if (error?.errors[0].message === 'audit_id must be unique') {
        logger.error(error?.errors[0].message, 'logging transaction error');
        throw new Error(error?.errors[0].message);
      }
    }
    throw new Error('transaction Error');
  }
};

module.exports = {
  saveAuditDetailsToMultipleTable,
  getAuditDetailsByAuditID,
  nearClosedAudits,
  getAudits,

  getLastAuditID,
  updateDynamicChecklist,
  updateTeamAudit,
  updateAuditReport,
  getAuditTeamMembersDetails,
  getAuditDetails,
  getAuditReportDetails,
  getProjectID,
  getAuditStatus,
  deleteAuditTeamMembers,
  getProjectIDByName,
  getAuditsByProject,
  sendDraftData,
  updateSubStatus,
  getSubStatus,
  getCheckListType,
  getEmployee,
  getCheckClosedStatus,
  getAuditsForAllProjects,
  getAuditTeamData,
  getAuditCostCenterDetails,
  getAuditsByCostCenter,
  getCheckEffortStatus
};
