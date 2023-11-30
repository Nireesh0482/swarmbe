/* eslint-disable arrow-body-style */
/* eslint-disable global-require */
/* eslint-disable no-param-reassign */

const { checkPromUserPermissionForTheAPI } = require('../services/promTool/promRoleService');
const { checkAuditUserPermissionForTheAPI } = require('../services/auditTool/roleService');
const appResponse = require('../utils/AppResponse');
const constants = require('../utils/constants');

// -------------------- Single instance role Authentication method --------<END>-----------

/**
 * @description Multi instance function are developed in order make role based Authentication
 * StateLess.this will check the User permission for Each POST API by accessing the Database and
 * validating user role information.| Multi instance function are useful because PM2 requires stateless
 * app where data is not shared between multiple instance.
 * @example if user is making a post request which alter data in Database, then in middleware(current file)
 * we first check in database whether user has features permission to access this API.
 * if he has access next middleware will be called,otherwise user is not authorized to access the api.
 */

// ---------------------------- Multi instance(PM2) method------<Start>-----------------------------------

const checkPromUserPermissionForAPI = (featureNumber) => {
  return async (req, res, next) => {
    const { employeeId } = res.locals;
    const checkUserHasPermission = await checkPromUserPermissionForTheAPI(employeeId.toString(), featureNumber);

    // check whether user has features access to Particular resource.
    if (!checkUserHasPermission) {
      // if user is Authenticated go to Next Middleware else Return Unauthorized
      return appResponse.userNotAuthorizedForThisResource(res, constants.NOT_AUTHORIZED_TO_RESOURCE);
    }
    next();
  };
};

const checkAuditUserPermissionForAPI = (featureNumber) => {
  return async (req, res, next) => {
    const { employeeId } = res.locals;
    const checkUserHasPermission = await checkAuditUserPermissionForTheAPI(employeeId.toString(), featureNumber);

    // check whether user has features access to Particular resource.
    if (!checkUserHasPermission) {
      // if user is Authenticated go to Next Middleware else Return Unauthorized
      return appResponse.userNotAuthorizedForThisResource(res, constants.NOT_AUTHORIZED_TO_RESOURCE);
    }
    next();
  };
};

module.exports = {
  checkPromUserPermissionForAPI,
  checkAuditUserPermissionForAPI,
};
