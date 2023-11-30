const logger = require('../../utils/logger');
const roleService = require('../../services/auditTool/roleService');
const appResponse = require('../../utils/AppResponse');
const constants = require('../../utils/constants');
// const { reloadUserRolesForAuditTool } = require('../../middleware/userRoleAuth');

const getAllEmployeeWithRoles = async (req, res) => {
  try {
    const getEmployeeRoles = await roleService.fetchAllRoles();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, getEmployeeRoles);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  }
};

const getRolesGroupsAndFeatureAccess = async (req, res) => {
  try {
    const rolesGroups = await roleService.fetchGroupRoles();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, rolesGroups);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  }
};

// role_group with both feature_access and employee id and their details
const getRolesGroupsWithFeatureAndTheirUserInfo = async (req, res) => {
  try {
    const rolesGroupsWithUserInfo = await roleService.fetchGroupRolesWithFeatureAndUserDetails();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, rolesGroupsWithUserInfo);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  }
};

const getFeaturesAndAccessLevel = async (req, res) => {
  try {
    const featuresAndAccess = await roleService.fetchAllFeatures();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, featuresAndAccess);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, constants.NO_RECORD_FOUND);
  }
};

const createRolesWithFeatures = async (req, res) => {
  try {
    const checkRoleAlreadyExist = await roleService.checkGroupExistence(req.body);
    if (checkRoleAlreadyExist) return appResponse.invalidInput(res, constants.DUPLICATE_RECORD);
    if (!checkRoleAlreadyExist) {
      const roleCreate = await roleService.createRolesWithFeatures(req.body);
      if (roleCreate) {
        return appResponse.success(res, constants.INSERTED_SUCCESSFULLY);
      }
      return appResponse.conflict(res, constants.DATA_NOT_SAVED);
    }
  } catch (err) {
    if (Object.keys(err).includes('errors')) {
      if (err?.errors[0]?.type === 'notNull Violation') {
        return appResponse.badRequest(res, constants.CANNOT_BE_EMPTY);
      }
      if (err?.errors[0]?.type === 'unique violation') {
        return appResponse.invalidInput(res, constants.DUPLICATE_RECORD);
      }
    }
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const updateRolesWithFeature = async (req, res) => {
  try {
    const checkGroupExist = await roleService.checkGroupExistence(req.body);
    if (!checkGroupExist) return appResponse.notFound(res, constants.NO_RECORD_FOUND);
    const roleUpdate = await roleService.updateRolesWithFeatures(req.body);
    if (roleUpdate) {
      return appResponse.success(res, constants.DATA_UPDATED);
    }
    return appResponse.conflict(res, constants.UPDATE_FAIL);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// delete the roles and their features in database.
// step 1) delete the assigned roles for user in prom_avin_roles first.
// step 2) after deleting user roles in prom_avin_roles,delete role and their features in roles_and_
// responsibilities table
const deleteRoleAndValues = async (req, res) => {
  try {
    const deleteRoles = await roleService.deleteRolesAndValues(req.body);
    if (deleteRoles) {
      return appResponse.success(res, constants.DELETE_SUCCESSFUL);
    }
    return appResponse.conflict(res, constants.UPDATE_FAIL);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const assignRolesToUser = async (req, res) => {
  try {
    const { emp_id: employeeId, role } = req.body;
    const assignedAndMailSentResult = await roleService.assignRoleToUser(role, employeeId);
    if (
      assignedAndMailSentResult.newRoleData.newRolePersistedData ===
        assignedAndMailSentResult.newRoleData.newRoleMailSentCount &&
      assignedAndMailSentResult.removedRoleData.removedRolePersistedData ===
        assignedAndMailSentResult.removedRoleData.removedRoleMailSentCount
    ) {
      return appResponse.success(res, constants.DATA_UPDATED);
    }

    if (
      !(
        assignedAndMailSentResult.newRoleData.newRolePersistedData ===
        assignedAndMailSentResult.newRoleData.newRoleMailSentCount
      ) ||
      !(
        assignedAndMailSentResult.removedRoleData.removedRolePersistedData ===
        assignedAndMailSentResult.removedRoleData.removedRoleMailSentCount
      )
    ) {
      return appResponse.notInserted(res, constants.PARTIAL_DATA, {
        newRoles: assignedAndMailSentResult.newRoleData.forUserMailNotReceived,
        removedRoles: assignedAndMailSentResult.removedRoleData.forUserMailNotReceived,
      });
    }
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  } catch (err) {
    logger.info(err);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

module.exports = {
  getAllEmployeeWithRoles,
  getRolesGroupsAndFeatureAccess,
  getFeaturesAndAccessLevel,
  updateRolesWithFeature,
  createRolesWithFeatures,
  deleteRoleAndValues,
  assignRolesToUser,
  getRolesGroupsWithFeatureAndTheirUserInfo,
};
