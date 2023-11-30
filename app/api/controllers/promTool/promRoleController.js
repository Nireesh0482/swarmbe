/* eslint-disable global-require */
const logger = require('../../utils/logger');

const promRoleService = require('../../services/promTool/promRoleService');
const appResponse = require('../../utils/AppResponse');
const constants = require('../../utils/constants');

// all employee details with their roles("admin","superAdmin")
const getAllEmployeeWithRoles = async (req, res) => {
  try {
    // get All Employee Roles Details
    const getEmployeeRoles = await promRoleService.fetchAllRoles();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, getEmployeeRoles);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, constants.CANNOT_FETCH);
  }
};

// get role_groups and their feature_access_level Information
const getRolesGroupsAndFeatureAccess = async (req, res) => {
  try {
    const rolesGroups = await promRoleService.fetchGroupRoles();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, rolesGroups);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, constants.CANNOT_FETCH);
  }
};

// role_group with both feature_access and employee id and their details
const getRolesGroupsWithFeatureAndTheirUserInfo = async (req, res) => {
  try {
    const rolesGroupsWithUserInfo = await promRoleService.fetchGroupRolesWithFeatureAndUserDetails();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, rolesGroupsWithUserInfo);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, constants.CANNOT_FETCH);
  }
};

// get feature and Feature_and_Access value.
const getFeaturesAndAccessLevel = async (req, res) => {
  try {
    const featuresAndAccess = await promRoleService.fetchAllFeatures();
    return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, featuresAndAccess);
  } catch (err) {
    logger.error(err);
    return appResponse.notFound(res, constants.CANNOT_FETCH);
  }
};

// create roles(Ex: admin, superAdmin) with custom features access(Ex:resource Management feature)
const createRolesWithFeatures = async (req, res) => {
  try {
    // check whether role already exist
    const checkRoleAlreadyExist = await promRoleService.checkGroupExistence(req.body);
    if (checkRoleAlreadyExist) return appResponse.invalidInput(res, { message: constants.DUPLICATE_RECORD });

    if (!checkRoleAlreadyExist) {
      // if role not exist ,then create and save in database
      const roleCreate = await promRoleService.createRolesWithFeatures(req.body);
      if (roleCreate) {
        return appResponse.created(res, constants.INSERTED_SUCCESSFULLY);
      }
      return appResponse.conflict(res, constants.DATA_NOT_SAVED);
    }
  } catch (err) {
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// if roles is modified with feature added or removed,update it.
const updateRolesWithFeature = async (req, res) => {
  try {
    // check group exist in database,if not return conflict(409)
    const checkGroupExist = await promRoleService.checkGroupExistence(req.body);
    if (!checkGroupExist) return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
    const roleUpdate = await promRoleService.updateRolesWithFeatures(req.body);
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
    const deleteRoles = await promRoleService.deleteRolesAndValues(req.body);
    if (deleteRoles) {
      return appResponse.success(res, constants.DELETE_SUCCESSFUL);
    }
    return appResponse.conflict(res, constants.UPDATE_FAIL);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// add or remove particular roles to user and send mail to them
const assignUserToTheRole = async (req, res) => {
  try {
    const { emp_id: employeeId, role } = req.body;

    // assign role to user
    const assignedAndMailSentResult = await promRoleService.assignUserToTheRole(role, employeeId);

    // if roles is assigned successfully,persisted in db and sent mail successfully.
    if (
      assignedAndMailSentResult.newRoleData.newRolePersistedData ===
        assignedAndMailSentResult.newRoleData.newRoleMailSentCount &&
      assignedAndMailSentResult.removedRoleData.removedRolePersistedData ===
        assignedAndMailSentResult.removedRoleData.removedRoleMailSentCount
    ) {
      return appResponse.success(res, constants.DATA_UPDATED, assignedAndMailSentResult);
    }

    // if role is not assigned or not persisted to database or mail is not successfully. then throw error
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
      return appResponse.notInserted(
        res,
        { message: constants.PARTIAL_DATA },
        {
          assignedAndMailSentResult,
          newRoles: assignedAndMailSentResult.newRoleData.forUserMailNotReceived,
          removedRoles: assignedAndMailSentResult.removedRoleData.forUserMailNotReceived,
        },
      );
    }
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  } catch (err) {
    logger.error(err);
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
  assignUserToTheRole,
  getRolesGroupsWithFeatureAndTheirUserInfo,
};
