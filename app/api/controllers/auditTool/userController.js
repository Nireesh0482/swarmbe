/* eslint-disable object-curly-newline */
const userService = require('../../services/auditTool/userService');
const jwtService = require('../../helpers/JWT');
const { differenceInDays } = require('../../utils/date');
const constants = require('../../utils/constants');
const appResponse = require('../../utils/AppResponse');
const logger = require('../../utils/logger');
const { capitalizeName } = require('../../helpers/helperFunctions');

const createUser = async (req, res) => {
  try {
    const { name, employeeID, emailID, password } = req.body;
    const email = emailID.toLowerCase();
    // const isNumber = /^\d+$/.test(employeeID); // test whether employee id is all Digits
    // isNumber ? parseInt(employeeID, 10) :
    // if All Digit,remove prefix 0's
    const empId = employeeID.toString().toUpperCase();

    // Check whether User is already registered in avin employee database
    const userEmailExist = await userService.verifyUserEmailAndFetchRoles(email);
    if (userEmailExist) {
      return appResponse.conflict(res, constants.DUPLICATE_RECORD);
    }
    //  if employee Details is present in Employee Data Table ,Then User are allowed to Register
    const allowToRegister = await userService.verifyDetails(email, empId);

    if (!allowToRegister.employeeIdExist) {
      return appResponse.invalidCredentials(res, constants.INVALID_CREDENTIALS);
    }
    if (allowToRegister.employeeIdExist && !allowToRegister.employeeAndEmailAreEqual) {
      return appResponse.expectationFailed(res, constants.INVALID_INPUT);
    }

    const userCreated = await userService.createUser({
      full_name: name.replace(/\s+/g, ' ').trim(),
      emp_id: empId,
      email_id: email,
      password,
    });

    if (!userCreated) return appResponse.conflict(res, constants.USER_NOT_CREATED);
    return appResponse.created(res, constants.USER_CREATED);
  } catch (error) {
    logger.error(error);
    if (error?.parent?.type === 'DatabaseError') {
      return appResponse.conflict(res, error.parent.detail);
    }
    if (error?.name === 'SequelizeUniqueConstraintError') {
      return appResponse.conflict(res, error.parent.detail);
    }
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const loginUser = async (req, res) => {
  try {
    const emailId = req.body.email.toLowerCase();
    const userRecord = await userService.verifyUserEmailAndFetchRoles(emailId);

    if (!userRecord) {
      return appResponse.notFound(res, { message: constants.NO_RECORD_FOUND });
    }
    if (await userService.checkPassword(req.body.password, userRecord.password)) {
      const accessToken = jwtService.generateAccessToken(userRecord.email_id, userRecord.emp_id);
      const refreshToken = jwtService.generateRefreshToken(userRecord.email_id, userRecord.emp_id);
      res.cookie('refreshToken', refreshToken, {
        // secure: true,
        maxAge: 86400000,
        httpOnly: true,
        // signed: true,
      });
      const passwordExpiry = differenceInDays(userRecord.expiry_date);

      logger.info(`${userRecord.full_name} of Audit Tool is logged IN `);

      // capitalize the Name
      const nameCapitalized = capitalizeName(userRecord.full_name);

      return appResponse.success(res, constants.LOGGED_IN, {
        accessToken,
        passwordExpiry,
        confirmRole: userRecord.role,
        userName: nameCapitalized,
        userEmail: userRecord.email_id,
        employeeID: userRecord.emp_id,
        userRoleGroups: userRecord.userRoleGroups,
      });
    }
    return appResponse.invalidCredentials(res, constants.PASS_INCORRECT);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const emailExist = await userService.verifyUserEmailAndFetchRoles(email);
    if (emailExist) {
      const userName = emailExist.full_name;
      const mailSent = await userService.forgotPassword(email, userName);
      if (mailSent) {
        return appResponse.success(res, constants.EMAIL_SENT);
      }
      return appResponse.conflict(res, constants.EMAIL_FAIL);
    }
    return appResponse.notFound(res, constants.EMAIL_NOT_EXIST);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const verifyLink = async (req, res) => {
  const { token, password } = req.body;
  try {
    const verifyToken = await jwtService.verifyToken(token, res);
    const verifyMail = await userService.verifyUserEmailAndFetchRoles(verifyToken.email);
    if (verifyMail && verifyToken) {
      const passwordUpdated = await userService.resetPassword(verifyToken, password);
      if (passwordUpdated) {
        return appResponse.success(res, constants.PASSWORD_UPDATE);
      }
      return appResponse.conflict(res, constants.PASSWORD_NOT_UPDATE);
    }
    return appResponse.notFound(res, constants.EMAIL_NOT_EXIST);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

module.exports = {
  createUser,
  loginUser,
  forgotPassword,
  verifyLink,
};
