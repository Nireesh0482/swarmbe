/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable max-len */
const cron = require('node-cron');
const auditService = require('../services/auditTool/auditService');
const logger = require('../utils/logger');
const { fetchAndSendMailForNonClosedAudits } = require('../services/auditTool/auditService');
const {
  updateSalaryRevisionForEmployees,
  updatingExperienceForEmployees,
  updatingExperienceForAvinEmployees,
} = require('../services/promTool/resourceManagementService');
const {
  cronJobGetPartialOrUnAllocatedEmployee,
  checkAllocationAndMoveToBenchIfNotAllocated,
  getBufferProjectEmployees,
  cronJobGetPlannedActualResourceCount,
  cronJobGetPartialAllocatedEmployee,
  cronJobGetPartialAllocatedEmployeeToAllGroupHeads
} = require('../services/promTool/promResourceAllocationService');
const { moveToGroupProjectBufferAfterMaternityEndDate } = require('../services/promTool/promMaternityService');
const { currentDate } = require('../utils/date');
// gather all Non closed Audits Information and send Email to group Members
const checkNonClosedAuditAndSendMail = async (req, res) => {
  try {
    cron.schedule('0 9 * * *', async () => {
      logger.info('cron Jobs Checking Database for Non Closed Audits');

      // get Audit Id of audit where closed(closure) date is in 2 days
      const auditIds = await auditService.findNearClosedAudits();

      // for all audit,extract Information and send Mail to team member.
      const sendEmailForTeamMemberForNonClosedAudit = await Promise.all(
        auditIds.map(async (auditDetails) => {
          const sentMailForNonClosedAudits = await fetchAndSendMailForNonClosedAudits(auditDetails);
          return sentMailForNonClosedAudits;
        }),
      );

      // if mails aren't sent to properly/mail sending failure occurs, then Log using logger.error to a file
      if (!sendEmailForTeamMemberForNonClosedAudit.every(({ mailSent }) => mailSent === true)) {
        logger.error(sendEmailForTeamMemberForNonClosedAudit);
      }
    });
  } catch (err) {
    logger.error(err);
  }
};

/**
 * @description on every 25th of month check partial or Unallocated employee for next month and
 * send mail to manager and manager's manager.
 */
const checkPartialOrUnallocatedEmployeeAndSendMail = async (req, res) => {
  try {
    // 25th every month at 9.00
    cron.schedule('1 9 25 * *', async () => {
      // cron.schedule('*/1 * * * *', async () => {
      logger.info('tool checking for Unallocated employee resource for next Month');
      await cronJobGetPartialOrUnAllocatedEmployee();
    });
  } catch (err) {
    // we can only log error as it is cron job
    logger.error(err);
  }
};

/**
 * @description if employee still not allocated after sending mail on 25, then on 27th move those
 * unallocated(i.e O allocation) employee to Buffer Project.
 */
const moveUnAllocatedEmployeesToBufferProject = async (req, res) => {
  try {
    // 28th every month at 9.02
    cron.schedule('2 9 28 * *', async () => {
      logger.info('Tool moving Unallocated Employee to Buffer Project');
      await checkAllocationAndMoveToBenchIfNotAllocated();
    });
  } catch (err) {
    logger.error(err);
  }
};

const getBufferProjectEmployeeAndSendMailToManagers = async (req, res) => {
  try {
    // 28th every month at 9.10
    cron.schedule('10 9 28 * *', async () => {
      logger.info('Tool checking Buffer Employee to Send Mail');
      await getBufferProjectEmployees();
    });
  } catch (err) {
    // we can only log error as it is cron job
    logger.error(err);
  }
};

const cronJobForUpdatingSalaryRevisionForEmployees = async () => {
  try {
    cron.schedule('0 20 6 * *', async () => {
      const employeeSalaryUpdatedCount = await updateSalaryRevisionForEmployees();
      logger.info(`Cron Job updated ${employeeSalaryUpdatedCount.length} employee's CTC`);
    });
  } catch (error) {
    logger.error(error);
  }
};

const checkMaternityEndDateAndMoveToBufferProject = async () => {
  try {
    cron.schedule('15 9 * * *', async () => {
      const maternityEmployeeMovedToBuffer = await moveToGroupProjectBufferAfterMaternityEndDate();

      const updateCount = maternityEmployeeMovedToBuffer.reduce((acc, ele) => acc + (ele[0] ?? 0), 0);

      logger.info(`Cron Job updated ${updateCount} employee's data by moving to Buffer`);
    });
  } catch (error) {
    logger.error(error);
  }
};

const checkPlannedActualResourceCountAndSendMail = async (req, res) => {
  try {
    // last day of current month at 9.10
    cron.schedule(`10 21 28 * *`, async () => {
      //  cron.schedule('*/1 * * * *', async () => {
      logger.info('tool checking for Planned and actual count resource for current Month');
      await cronJobGetPlannedActualResourceCount();
    });
  } catch (err) {
    // we can only log error as it is cron job
    logger.error(err);
  }
};

const cronJobForUpdatingExperienceForEmployeesInResourceMang = async () => {
  try {
    cron.schedule(`10 9 1 * *`, async () => {
    // cron.schedule('*/1 * * * *', async () => {
      const employeeExpUpdate = await updatingExperienceForEmployees();
      logger.info('Cron Job updated employee`s Total Experience In Resoure Management');
    });
  } catch (error) {
    logger.error(error);
  }
};

const cronJobForUpdatingExperienceForEmployeesInResourceExpData = async () => {
  try {
    cron.schedule(`10 9 1 * *`, async () => {
    // cron.schedule('*/1 * * * *', async () => {
      const resourceExpUpdate = await updatingExperienceForAvinEmployees();
      logger.info('Cron Job updated employee`s Years of Experience in Resource Experience Data');
    });
  } catch (error) {
    logger.error(error);
  }
};

const movepartiallyAllocatedEmployeesToBufferProject = async (req, res) => {
  try {
    // 28th every month at 9.02
    cron.schedule('10 9 28 * *', async () => {
      // cron.schedule('*/1 * * * *', async () => {
      logger.info('Tool moving Unallocated Employee to Buffer Project');
      await cronJobGetPartialAllocatedEmployee();

    });
  } catch (err) {
    logger.error(err);
  }
};

const partialAllocatedEmployeeToAllGroupHeads = async (req, res) => {
  try {
    // 28th every month at 9.02
    cron.schedule('10 9 28 * *', async () => {
      // cron.schedule('*/1 * * * *', async () => {
      logger.info('Send Unallocated Employee Info to all group heads');
      await cronJobGetPartialAllocatedEmployeeToAllGroupHeads();
    });
  } catch (err) {
    logger.error(err);
  }
};

const runAllCronTasks = async () => {
  const instanceName = process.env.name ?? 'primary'; // when running in pm2 remove  this -- > ?? 'primary'
  if (instanceName === 'primary') {
    await checkNonClosedAuditAndSendMail();
    await checkPartialOrUnallocatedEmployeeAndSendMail();
    await moveUnAllocatedEmployeesToBufferProject();
    await getBufferProjectEmployeeAndSendMailToManagers();
    await cronJobForUpdatingSalaryRevisionForEmployees();
    await checkMaternityEndDateAndMoveToBufferProject();
    await checkPlannedActualResourceCountAndSendMail();
    await cronJobForUpdatingExperienceForEmployeesInResourceMang();
    await partialAllocatedEmployeeToAllGroupHeads();
    await movepartiallyAllocatedEmployeesToBufferProject();
    await cronJobForUpdatingExperienceForEmployeesInResourceExpData();
    logger.info('Cron jobs has been scheduled');
  }
};

module.exports = {
  checkNonClosedAuditAndSendMail,
  runAllCronTasks,
  checkPartialOrUnallocatedEmployeeAndSendMail,
  moveUnAllocatedEmployeesToBufferProject,
  getBufferProjectEmployeeAndSendMailToManagers,
  checkPlannedActualResourceCountAndSendMail,
  cronJobForUpdatingExperienceForEmployeesInResourceMang,
  movepartiallyAllocatedEmployeesToBufferProject,
  partialAllocatedEmployeeToAllGroupHeads,
  cronJobForUpdatingExperienceForEmployeesInResourceExpData
};
