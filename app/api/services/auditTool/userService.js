/* eslint-disable arrow-body-style */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { salt, secret: secretKey, resetSecret, auditToolClientURL } = require('../../../config/config');
const { sendMail } = require('../../utils/email');
const userRepository = require('../../repositories/auditTool/userRepository');
const employeeRepository = require('../../repositories/auditTool/employeeRepository');
const { expiryDate } = require('../../utils/date');
const jwtService = require('../../helpers/JWT');
const { forgotPasswordMailData } = require('../../utils/EmailSchema');

const createUser = async (user) => {
  const userData = user;
  userData.password = await bcrypt.hash(userData.password, parseInt(salt, 10));
  userData.expiry_date = expiryDate();
  const createdUser = await userRepository.createUserInDB(userData);
  return createdUser;
};

const verifyUserEmailAndFetchRoles = async (email) => {
  const userData = await userRepository.verifyUserEmailAndGetUserRoles(email);

  if (userData === null) {
    return userData;
  }
  if (userData?.employeeData.userRoles.length === 0) {
    delete userData.userRoles;
    userData.role = [];
    return userData;
  }

  const roleFeatures = userData.employeeData.userRoles.flatMap(({ roleAndResponsibility }) => {
    return roleAndResponsibility.features.map((feature) => feature);
  });
  userData.userRoleGroups = userData.employeeData.userRoles.map(({ role_group: roleGroup }) => roleGroup);
  userData.role = [...new Set(roleFeatures)];
  delete userData.userRoles;

  return userData;
};

const checkPassword = async (UserPass, DBPass) => {
  const passwordCheck = await bcrypt.compare(UserPass, DBPass);
  return passwordCheck;
};

const forgotPassword = async (email, userName) => {
  const resetToken = jwt.sign({ email_id: email, secret: secretKey }, resetSecret, {
    expiresIn: '10m',
  });
  const resetMailData = forgotPasswordMailData(auditToolClientURL, resetToken, userName);
  const sendForgetPasswordMail = await sendMail(resetMailData.subject, resetMailData.text, resetMailData.html, email);
  return sendForgetPasswordMail;
};

const verifyDetails = async (email, empId) => {
  const employeeId = empId.toString();
  const empIdVerify = await employeeRepository.verifyEmpEmail(employeeId);

  // initialize the employee Exist to false and verify.
  const employeeExist = {
    // initialization to false
    employeeIdExist: false,
    employeeAndEmailAreEqual: false,
  };

  // if employee doesn't exist return employeeExist
  if (empIdVerify === null) return employeeExist;

  // if employee exist in database, check email and employee id equality
  if (empIdVerify.emp_id === employeeId) {
    employeeExist.employeeIdExist = true;
    if (empIdVerify.email_id === email) {
      employeeExist.employeeAndEmailAreEqual = true;
    }
    return employeeExist;
  }
};

const verifyLink = async (token) => {
  const { email, secret } = await jwtService.verifyToken(token);
  return { email, secret };
};

const resetPassword = async (verifyToken, password) => {
  const envSecret = secretKey;
  if (verifyToken.secret === envSecret) {
    const hashedPassword = await bcrypt.hash(password, parseInt(salt, 10));
    const passwordUpdate = await userRepository.resetPassword(verifyToken.email, hashedPassword);
    return passwordUpdate;
  }
};

module.exports = {
  createUser,
  verifyUserEmailAndFetchRoles,
  checkPassword,
  forgotPassword,
  verifyDetails,
  verifyLink,
  resetPassword,
};
