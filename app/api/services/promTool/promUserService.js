/* eslint-disable arrow-body-style */
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../../utils/logger');
const appResponse = require('../../utils/AppResponse');
const constants = require('../../utils/constants');

const { expiryDate } = require('../../utils/date');
const { salt, secret: secretKey, resetSecret, promToolClientURL } = require('../../../config/config');
const { sendMail } = require('../../utils/email');
const promUserRepository = require('../../repositories/promTool/promUserRepository');
const promAvinEmployeeDetailsRepository = require('../../repositories/promTool/resourceManagementRepository');
const promRoleRepository = require('../../repositories/promTool/promRoleRepository');
const jwtService = require('../../helpers/JWT');
const { promForgotPasswordMailData } = require('../../utils/EmailSchema');

const createUser = async (user) => {
  const userData = user;
  userData.password = await bcrypt.hash(userData.password, parseInt(salt, 10));
  userData.expiry_date = expiryDate();
  const createdUser = await promUserRepository.createUserInDB(userData); // save the Details to Database
  return createdUser;
};

const verifyPromUserEmailAndFetchRoles = async (email) => {
  const userData = await promUserRepository.verifyPromUserEmailAndGetUserRoles(email);

  if (userData === null) return userData;

  if (
    userData?.promAvinEmployeeDetails?.promUserRoles.length === 0 ||
    !userData?.promAvinEmployeeDetails?.promUserRoles
  ) {
    delete userData.promAvinEmployeeDetails.promUserRoles;
    userData.role = [];
    userData.employeeStatus = userData?.promAvinEmployeeDetails?.resource_status ?? null;
    userData.groupName = userData?.promAvinEmployeeDetails?.bu_name ?? null;
    return userData;
  }

  // get users all role info name by map method, output => Ex: roleFeatures = ["admin","normal user"]
  const roleFeatures = userData.promAvinEmployeeDetails.promUserRoles.map(({ role_group: roleGroup }) => roleGroup);

  // get each role permission Ex: features_permission like 201/202/... for admin,superAdmin
  // output: [{ features_permission: [201, 202], role_group: "admin" }, { feat......}]
  const roleFeaturesLevel = await promRoleRepository.getRolesInfo(roleFeatures);

  // gather all features_permission from the roles,it might contain duplicate values from each roles,
  // because for Example admin and superAdmin both have features permission 201(feature) and 202(feature)
  // output => Ex: rolesFeatureArray =[201,202,203,201,202]
  const roleFeatureArray = roleFeaturesLevel.flatMap(({ features_permission: featureValue }) => featureValue);

  // remove duplicate value from array and assign to role key inside userData
  userData.role = [...new Set(roleFeatureArray)];

  userData.groupName = userData?.promAvinEmployeeDetails?.bu_name ?? null;

  userData.userRoleGroups = userData.promAvinEmployeeDetails.promUserRoles.map(
    ({ role_group: roleGroup }) => roleGroup,
  );

  // promAvinEmployeeDetails as well, assign it employeeStatus and check the condition in controller.
  // if employeeStatus is Active/Buffer allow to login
  userData.employeeStatus = userData.promAvinEmployeeDetails?.resource_status ?? null;
  delete userData.promAvinEmployeeDetails; // remove promAvinEmployeeDetails to avoid unnecessary data
  return userData;
};

const checkPassword = async (UserPass, DBPass) => {
  const passwordCheck = await bcrypt.compare(UserPass, DBPass);
  return passwordCheck;
};

// verify Whether User Details is Authentic
const verifyDetails = async (email, empId, resourceName) => {
  const employeeId = empId.toString();
  const empIdVerify = await promAvinEmployeeDetailsRepository.verifyEmpEmail(employeeId);

  // initialization to false
  const employeeExist = { employeeIdExist: false, employeeAndEmailAreEqual: false, employeeIsActive: false, employeeNameExist: false };

  if (empIdVerify === null) return employeeExist;

  // check whether Email & employeeId belong to same the employ
  if (empIdVerify.resource_emp_id === employeeId) {
    employeeExist.employeeIdExist = true;
    if (empIdVerify.email_id === email && empIdVerify.resource_name === resourceName) {
      employeeExist.employeeAndEmailAreEqual = true;
      employeeExist.employeeNameExist = true;
    }
    // if (empIdVerify.resource_name === resourceName) {
    //   employeeExist.employeeNameExist = true;
    // }
    if (
      empIdVerify.resource_status === 'Active' ||
      empIdVerify.resource_status === 'Buffer' ||
      empIdVerify.resource_status === 'Resigned'
    ) {
      employeeExist.employeeIsActive = true;
    }
    return employeeExist;
  }
};

const forgotPassword = async (email, userName) => {
  // create Token
  const resetToken = jwt.sign({ email_id: email, secret: secretKey }, resetSecret, {
    expiresIn: '10m',
  });
  const resetMailData = promForgotPasswordMailData(promToolClientURL, resetToken, userName);
  const sendForgetPasswordMail = await sendMail(resetMailData.subject, resetMailData.text, resetMailData.html, email);
  return sendForgetPasswordMail;
};

const verifyLink = async (token) => {
  const { email, secret } = await jwtService.verifyToken(token);
  return { email, secret };
};

const resetPassword = async (verifyToken, password) => {
  const envSecret = secretKey;
  if (verifyToken.secret === envSecret) {
    const hashedPassword = await bcrypt.hash(password, parseInt(salt, 10));
    const passwordUpdate = await promUserRepository.resetPassword(verifyToken.email, hashedPassword);
    return passwordUpdate;
  }
};

const getUserFolderDetailsByUniqueId = async (resourceEmpId) => {
  const resourceDetails = await promUserRepository.findUserDetailsByUniqueId(resourceEmpId);
  return resourceDetails;
};

const fetchUserProfilePicture = async (resourceEmpId) => {
  const userProfilePicture = await promUserRepository.getUserProfilePictureFromDatabase(resourceEmpId);
  // userProfilePicture.profile_picture = userProfilePicture.profile_picture.toString('base64');
  return { profile_picture: userProfilePicture.profile_picture };
  return userProfilePicture;
};

module.exports = {
  createUser,
  verifyPromUserEmailAndFetchRoles,
  checkPassword,
  verifyDetails,
  forgotPassword,
  verifyLink,
  resetPassword,
  getUserFolderDetailsByUniqueId,
  fetchUserProfilePicture,
};
