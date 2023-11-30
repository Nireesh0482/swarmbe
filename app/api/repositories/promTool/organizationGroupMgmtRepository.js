/* eslint-disable no-unused-vars */
/* eslint-disable object-curly-newline */
/* eslint-disable camelcase */
const dbInstance = require('../../models');
const logger = require('../../utils/logger');

const insertAOPData = async (AOPData) => {
  const insertedAOPData = await dbInstance.organizationGRPMgmt.bulkCreate(AOPData, {
    returning: true,
  });
  return insertedAOPData;
};

// cross-check and remove
const getAOPDataByName = async (request) => {
  const AOPData = await dbInstance.projectGroupName.findOne({
    where: { project_bu_name: request.org_bu_name },
    raw: true,
  });
  return AOPData;
};

const updateAOPData = async (aopData) => {
  const updateAOPDataWithProjectHead = await Promise.all(
    aopData.map(
      async ({ id, org_bu_name, org_bu_head, aop_resource, aop_cost, aop_revenue, aop_month, remarks }) => {
        // data needed to be updated in AOP group data
        // [org_bu_name ,aop_month] shouldn't be updated
        const dataToBeUpdated = {
          org_bu_head,
          aop_resource,
          aop_cost,
          aop_revenue,
          remarks,
        };
        // update data in org aop table
        const updatedAOPData = await dbInstance.organizationGRPMgmt.update(dataToBeUpdated, {
          where: { id },
        });
        return updatedAOPData;
      },
    ),
  );
  return updateAOPDataWithProjectHead;
};

// cross-check and remove
const insertGrpNameData = async (grpName) => {
  const insertedGRPData = await dbInstance.projectGroupName.create({
    project_bu_name: grpName.org_bu_name,
  });
  return insertedGRPData;
};

const getAllGroupDetails = async () => {
  const groupDetails = await dbInstance.groupDetails.findAll({
    raw: true,
    attributes: ['bu_name', 'bu_head'],
  });
  return groupDetails;
};

const getAllGroupAOPDataWithoutTimeStamp = async () => {
  const allGroupAOPData = await dbInstance.organizationGRPMgmt.scope('removeTimeStamp').findAll({ raw: true });

  return allGroupAOPData;
};

const fetchAllGRPProjects = async (org_bu_name) => {
  const groupData = await dbInstance.promAvinProjectDetails.findAll({
    where: { project_bu_name: org_bu_name },
    attributes: ['project_code'],
    raw: true,
  });
  return groupData;
};

const fetchAllProjectsByGRP = async () => {
  const groupData = await dbInstance.promAvinProjectDetails.findAll({
    attributes: ['project_code'],
    raw: true,
  });
  return groupData;
};

// cross-check and remove
const fetchAllProjGroupNameData = async (request) => {
  const groupData = await dbInstance.projectGroupName.findAll({
    where: { project_bu_name: request.org_bu_name },
    nest: true,
    raw: true,
    include: [
      {
        model: dbInstance.organizationGRPMgmt,
        as: 'projectGroupAndOrgGroupNames',
        attributes: [],
        where: { org_bu_name: request.org_bu_name },
        include: {
          model: dbInstance.promAvinEmployeeDetails,
          as: 'groupHeadEmployeeIdFk',
          attributes: [['resource_name', 'resourceName']],
        },
      },
    ],
  });
  return groupData;
};

const getGRPInfoByName = async (request) => {
  const AOPData = await dbInstance.organizationGRPMgmt.findAll({
    where: { org_bu_name: request.org_bu_name },
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    order: [['org_bu_name', 'ASC']],
    raw: true,
  });

  return AOPData;
};

const getAllGroupNameInArray = async () => {
  const allGroupNames = await dbInstance.groupDetails.findAll({
    raw: true,
    attributes: [
      [dbInstance.Sequelize.fn('ARRAY_AGG', dbInstance.Sequelize.col('bu_details.bu_name')), 'groupNames'],
    ],
  });
  return allGroupNames;
};

const getAllGroupCodesInArray = async () => {
  const allGroupCodes = await dbInstance.groupDetails.findAll({
    raw: true,
    attributes: [
      [dbInstance.Sequelize.fn('ARRAY_AGG', dbInstance.Sequelize.col('bu_details.bu_code')), 'groupCodes'],
    ],
  });
  return allGroupCodes;
};

const saveGroupDetails = async (groupDetails, bufferProjectForProjectGroup) => {
  try {
    const result = await dbInstance.sequelize.transaction(async (t) => {
      const saveGroupDetail = await dbInstance.groupDetails
        .bulkCreate(groupDetails, {
          returning: true,
          transaction: t,
        })
        .then(async (createdGroupDetails) => {
          const createBufferProject = await dbInstance.promAvinProjectDetails.bulkCreate(bufferProjectForProjectGroup, {
            returning: true,
            transaction: t,
          });
          return { createdGroupDetails, bufferProjectForGroup: createBufferProject };
        })
        .catch((err) => {
          throw new Error('Error while inserting Group and itsBuffer Project', { cause: err });
        });

      return saveGroupDetail;
    });
    return result;
  } catch (error) {
    logger.error(error);
    throw new Error('transaction Error', { cause: error });
  }
};

const updateGroupDetails = async (updateGroupDetailsArray) => {
  const updateGroupDetailsAndHeadDetails = await Promise.all(
    updateGroupDetailsArray.map(async ({ bu_name, bu_head, remarks }) => {
      const dataToBeUpdated = {
        bu_head,
        remarks,
      };
      // update data in org aop table
      const updatedGroupData = await dbInstance.groupDetails.update(dataToBeUpdated, {
        where: { bu_name },
      });

      const updateProjectHeadInProjectDetails = await dbInstance.promAvinProjectDetails.update(
        { project_bu_head: bu_head },
        { where: { project_bu_name: bu_name } },
      );
      const updateGroupData = await dbInstance.organizationGRPMgmt.update(
        { org_bu_head: bu_head },
        { where: { org_bu_name: bu_name } },
      );
      return { updatedGroupData, updateProjectHeadInProjectDetails, updateGroupData };
    }),
  );
  return updateGroupDetailsAndHeadDetails;
};

const fetchAllOrgAOPDetails = async () => {
  const orgGroupDetails = await dbInstance.organizationGRPMgmt.findAll({
    raw: true,
    attributes: { exclude: ['createAt', 'updatedAt'] },
    order: [['org_bu_name', 'ASC']],
  });
  return orgGroupDetails;
};

const ORGGroupNameVerify = async (groupNames) => {
  const ORGGroupData = await dbInstance.organizationGRPMgmt.findAll({
    attributes: ['org_bu_name'],
    where: { org_bu_name: groupNames },
    raw: true,
  });
  return ORGGroupData;
};

module.exports = {
  fetchAllOrgAOPDetails,
  getAllGroupDetails,
  updateGroupDetails,
  saveGroupDetails,
  insertAOPData,
  getAOPDataByName,
  updateAOPData,
  insertGrpNameData,
  getAllGroupAOPDataWithoutTimeStamp,
  fetchAllGRPProjects,
  fetchAllProjectsByGRP,
  fetchAllProjGroupNameData,
  getAllGroupNameInArray,
  getGRPInfoByName,
  getAllGroupCodesInArray,
  ORGGroupNameVerify,
};
