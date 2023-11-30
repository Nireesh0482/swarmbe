const logger = require('../../utils/logger');
const jwtService = require('../../helpers/JWT');
const { differenceInDays } = require('../../utils/date');
const constants = require('../../utils/constants');
const appResponse = require('../../utils/AppResponse');
const { capitalizeName } = require('../../helpers/helperFunctions');
const promUserService = require('../../services/promTool/promUserService');

// create new user in Database if user is register in avin_employee table and has valid email
const createUser = async (req, res) => {

  try {
    const { name, employeeID, emailID, password } = req.body;
    const email = emailID.toLowerCase();

    // const isNumber = /^\d+$/.test(employeeID); // test whether employee id is all Digits
    // isNumber ? parseInt(employeeID, 10) :
    // if All Digit,remove prefix 0's

    const empId = employeeID.toString().toUpperCase();

    // Check Whether User is Already Registered in Avin Employee Database
    const userEmailExist = await promUserService.verifyPromUserEmailAndFetchRoles(email);

    if (userEmailExist) {
      return appResponse.conflict(res, constants.DUPLICATE_RECORD);
    }
    //  if employee Details is present in Employee Data Table ,Then User are allowed to Register
    const allowToRegister = await promUserService.verifyDetails(email, empId, name);
    if (!allowToRegister.employeeIdExist) {
      return appResponse.invalidCredentials(res, constants.INVALID_CREDENTIALS);
    }
    // if employee is Inactive or Resigned in employee database, then return not allowed to signup
    if (allowToRegister.employeeIdExist && !allowToRegister.employeeIsActive) {
      return appResponse.methodNotAllowed(res, constants.USER_NOT_AUTHORIZED);
    }
    // if employee id exist but given employee id  email doesn't match with database then return expectation failed
    if (allowToRegister.employeeIdExist && (!allowToRegister.employeeAndEmailAreEqual && !allowToRegister.employeeNameExist)) {
      return appResponse.expectationFailed(res, constants.INVALID_INPUT);
    }

    // Add user to Database
    const userCreated = await promUserService.createUser({
      full_name: name.replace(/\s+/g, ' ').trim(),
      resource_emp_id: empId,
      email_id: email,
      password,
    });

    if (!userCreated) return appResponse.conflict(res, constants.USER_NOT_CREATED);
    return appResponse.created(res, constants.USER_CREATED); // send success message
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

// login user if exist in prom_user table and user is not Inactive in avin_employee Table
const loginUser = async (req, res) => {
  try {
    const emailId = req.body.email.toLowerCase(); // convert email to lowercase

    const userRecord = await promUserService.verifyPromUserEmailAndFetchRoles(emailId); // check user exist

    // if user record not found ,return 404
    if (!userRecord) {
      return appResponse.notFound(res, constants.NO_RECORD_FOUND);
    }

    // if user is Inactive in database,then user is Not authorized
    if (userRecord.employeeStatus === 'Inactive') {
      return appResponse.methodNotAllowed(res, constants.NOT_AUTHORIZED_TO_RESOURCE);
    }

    // if user exist, verify password
    if (await promUserService.checkPassword(req.body.password, userRecord.password)) {
      const accessToken = jwtService.generateAccessToken(userRecord.email_id, userRecord.resource_emp_id); // 180m
      const refreshToken = jwtService.generateRefreshToken(userRecord.email_id, userRecord.resource_emp_id); // 1day

      res.cookie('refreshToken', refreshToken, { maxAge: 86400000, httpOnly: true }); // cookie valid for 1 day

      const passwordExpiry = differenceInDays(userRecord.expiry_date); // generate password expiry date

      logger.info(`${userRecord.full_name} of RM Tool is logged IN `); // for admin purpose

      const nameCapitalized = capitalizeName(userRecord.full_name); // capitalize the Name

      return appResponse.success(res, constants.LOGGED_IN, {
        accessToken,
        passwordExpiry,
        confirmRole: userRecord.role,
        userName: nameCapitalized,
        userEmail: userRecord.email_id,
        employeeID: userRecord.resource_emp_id,
        userRoleGroups: userRecord.userRoleGroups,
        userGroup: userRecord.groupName,
      });
    }
    return appResponse.invalidCredentials(res, constants.PASS_INCORRECT);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

// forgot password API to generate secret key ,send mail and allow user to reset password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const emailExist = await promUserService.verifyPromUserEmailAndFetchRoles(email);
    if (emailExist) {
      const userName = emailExist.full_name;
      const mailSent = await promUserService.forgotPassword(email, userName);
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

// verify Link sent in reset password from mail
const verifyLink = async (req, res) => {
  const { token, password } = req.body;
  try {
    const verifyToken = await jwtService.verifyToken(token, res);
    const verifyMail = await promUserService.verifyPromUserEmailAndFetchRoles(verifyToken.email);
    if (verifyMail && verifyToken) {
      const passwordUpdated = await promUserService.resetPassword(verifyToken, password);
      if (passwordUpdated) {
        return appResponse.success(res, constants.PASSWORD_UPDATE);
      }
      return appResponse.conflict(res, constants.PASSWORD_NOT_UPDATE);
    }

    return appResponse.notFound(res, constants.EMAIL_NOT_EXIST);
  } catch (error) {
    if (error.message === 'Invalid Token') {
      return appResponse.invalidCredentials(res, { message: constants.INVALID_TOKEN });
    }
    return appResponse.internalServerError(res, constants.DATA_NOT_SAVED);
  }
};

const verifyUserDetails = async (req, res, next) => {
  try {
    const { resourceEmpId } = req.body;

    // get user Details by using unique id and email
    const userDetails = await promUserService.getUserFolderDetailsByUniqueId(resourceEmpId);

    if (!userDetails) {
      // if user is Authenticated go to Next Middleware else Return Unauthorized
      return appResponse.badRequest(res, constants.INVALID_USER_DETAILS);
    }
    next();
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.INVALID_USER_DETAILS);
  }
};


const getUserProfilePictureFromDatabase = async (req, res) => {
  try {
    const { resourceEmpId } = req.body;
    const userProfilePicture = await promUserService.fetchUserProfilePicture(resourceEmpId);
    if (userProfilePicture) {
      return appResponse.success(res, constants.SUCCESSFULLY_FETCHED, userProfilePicture);
    }
    return appResponse.conflict(res, constants.CANNOT_FETCH);
  } catch (error) {
    logger.error(error);
    return appResponse.internalServerError(res, constants.INVALID_USER_DETAILS);
  }
};


module.exports = {
  createUser,
  loginUser,
  forgotPassword,
  verifyLink,
  verifyUserDetails,
  getUserProfilePictureFromDatabase
};
