/* eslint-disable arrow-body-style */
/* eslint-disable camelcase */
/* eslint-disable implicit-arrow-linebreak */

const logger = require('../../utils/logger');
const promRoleRepository = require('../../repositories/promTool/promRoleRepository');
const { capitalizeName } = require('../../helpers/helperFunctions');
const { rolesModificationMailUpdate } = require('../../utils/EmailSchema');
const { sendMail } = require('../../utils/email');

const fetchAllRoles = async () => {
  const getRoles = await promRoleRepository.getRolesWithUserInfo();

  // group into definite Structure and Return
  const finalRoles = getRoles.map(({ promAvinEmployeeDetails, ...rest }) => {
    const roleObjectToArray = { ...rest };
    roleObjectToArray.userRoles = promAvinEmployeeDetails.promUserRoles.map(({ role_group: role }) => role);
    return roleObjectToArray;
  });
  return finalRoles;
};

const fetchAllFeatures = async () => {
  const featuresAndAccess = await promRoleRepository.getFeaturesFromDB();
  return featuresAndAccess;
};

const featureStringFromNumber = (featuresNumber, features) => {
  // get Corresponding features name from their values
  const compareWithValue = (number) => {
    const { feature } = features.find(({ value }) => value === number);
    return feature;
  };
  return featuresNumber.map((number) => compareWithValue(number));
};

const fetchGroupRoles = async () => {
  // get all Roles with their Features and value
  const featureNameWithValue = await fetchAllFeatures();
  const groupRoles = await promRoleRepository.GroupRolesAndFeature();

  // grouping it to definite structure and Returning
  const rolesWithFeature = groupRoles.map(({ role_group: groups, features_permission: featuresNumber }) => ({
    groups,
    features: featureStringFromNumber(featuresNumber, featureNameWithValue),
    featuresValue: featuresNumber,
  }));
  return rolesWithFeature;
};

/**
 *
 * @param {String} groupName name of the group @example groupName = 'Admin'
 * @param {Array<Object>} userGroups employeeInformation with their groups - example below
 * @example userGroups=[{ resource_emp_id: '001',role_group: 'Admin'}]
 * @returns employee id and their name in separate arrays for one particular groups, @example returns
 * all the employee and their name in two array of Admin group
 */
const findUserAndTheirEmployeeIdsForThatRoles = (groupName, userGroups) => {
  // for a particular role get user employee id and their name
  const userNameAndEmployeeIdForRoles = userGroups.reduce(
    (finalNoOfUserForRole, { role_group: roleGroup, promUserEmployeeId: employeeInfo }) => {
      if (roleGroup === groupName) {
        return [
          ...finalNoOfUserForRole,
          { employeeName: employeeInfo.resource_name, employeeId: employeeInfo.resource_emp_id },
        ];
      }
      return finalNoOfUserForRole;
    },
    [],
  );

  // extract employee their name and employee id into two arrays
  const onlyUserName = userNameAndEmployeeIdForRoles.map(({ employeeName }) => employeeName);
  const onlyUserEmployeeId = userNameAndEmployeeIdForRoles.map(({ employeeId }) => employeeId);

  // example output: 1) onlyUserEmployeeId:[001,002]; 2)onlyUserName:["someName","someName2"]
  return { onlyUserEmployeeId, onlyUserName };
};

const fetchGroupRolesWithFeatureAndUserDetails = async () => {
  const featureNameWithValue = await fetchAllFeatures(); // get feature name and their Values
  const groupRoles = await promRoleRepository.GroupRolesAndFeature(); // get roles and their feature value
  const userGroups = await promRoleRepository.getRolesAlongWithTheirUserInfo(); // get user with their roles

  // combine all data into category and return
  const rolesWithFeature = groupRoles.map(({ role_group: groups, features_permission: featuresNumber }) => {
    const { onlyUserEmployeeId, onlyUserName } = findUserAndTheirEmployeeIdsForThatRoles(groups, userGroups);

    return {
      groups,
      features: featureStringFromNumber(featuresNumber, featureNameWithValue),
      userNames: onlyUserName,
      userEmployeeId: onlyUserEmployeeId,
    };
  });

  /**
   * @example : example output below :
   *   { groups: 'Admin',
   *     features: ['Resource Management', 'Role Allocation',],
   *     userNames: ['employee name', 'employee name 2'],
   *     userEmployeeId: [ '0022', '0472' ]
   *    }
   */
  return rolesWithFeature;
};

const createRolesWithFeatures = async (roleWithFeatures) => {
  const { groupName: groups, features } = roleWithFeatures;
  const featuresPermission = [...new Set(features)]; // remove duplicate values
  const nameCapitalized = capitalizeName(groups); // capitalize the words Ex: admin -> Admin
  // create role with feature in database
  const createRole = await promRoleRepository.createRolesWithFeatures(nameCapitalized, featuresPermission);
  return createRole;
};

const updateRolesWithFeatures = async (updatedRoles) => {
  const { groupName: groups, features } = updatedRoles;
  const featuresPermission = [...new Set(features)];
  const updateRole = await promRoleRepository.updateRolesWithFeatures(groups, featuresPermission);
  // final Output Ex:Groups:Admin ,features:[11,12,13]
  return updateRole;
};

const checkGroupExistence = async (updatedRoles) => {
  const { groupName: groups } = updatedRoles;
  const groupExist = await promRoleRepository.roleGroupExists(groups);
  return groupExist > 0;
};

const deleteRolesAndValues = async (rolesAndValues) => {
  const { groupName: groups } = rolesAndValues;
  const Deleted = [];
  // for loop is used because groups is array of roles which needs to deleted in both prom_roles_and_responsibility and
  // prom_avin_roles
  for await (const eachRole of groups) {
    const deleteTheRoleInUserRolesTable = await promRoleRepository.deleteRoleInUserTable(eachRole);
    Deleted.push(await promRoleRepository.deleteRolesAndFeaturesValue(eachRole));
    logger.info(`${deleteTheRoleInUserRolesTable} number of ${eachRole} is Deleted in userRoles Table`);
  }
  return Deleted.length === groups.length;
};

/**
 *
 * @param {Array<String>} employeeIdArray => array of employee id @example [001,002,003,004]
 * @param {String} role => the main role for which user must be added or removed @example role:"admin"
 * @param {Array<Object>} existingUserRoles => existing user present for that role from database @example
 * [{ id:222,resource_emp_id: 002, role_group: "admin" },{},...])
 * @returns {Object<Object>} returns new user and removed user for the particular role
 */
const getNewlyAllocatedAndRemovedUserForTheRole = (employeeIdArray, role, existingUserRoles) => {
  const newUserForTheRole = employeeIdArray.reduce((newEmployeeForTheRoles, currentEmployeeId) => {
    const userRolesInDatabase = existingUserRoles.some((ele) => ele.resource_emp_id === currentEmployeeId);
    if (userRolesInDatabase) return [...newEmployeeForTheRoles];
    return [...newEmployeeForTheRoles, { resource_emp_id: currentEmployeeId, newRoleForUser: role }];
  }, []);

  // if employee id is removed from employeeIdArray but it exist in existingUserRoles(database),
  // then consider those employees should be removed for that particular role.
  const removeUserForTheRole = existingUserRoles
    .filter(({ resource_emp_id }) => !employeeIdArray.includes(resource_emp_id))
    .map(({ id, resource_emp_id }) => ({ id, resource_emp_id, removedRole: role }));

  return { newUserForTheRole, removeUserForTheRole };
};

const extractUserEmailAndName = (arrayOfUsersDetails, resourceEmpId) => {
  const findUserEmailAndName = arrayOfUsersDetails.filter(
    (usersRolesData) => usersRolesData.resource_emp_id === resourceEmpId,
  );
  return findUserEmailAndName[0];
};

const generateEmailTemplateForRoleChange = (rolesModified, Name, toolName, roleAdded, rolesRemoved) => {
  // get Html for Email Rendering
  return rolesModificationMailUpdate(rolesModified, Name, toolName, roleAdded, rolesRemoved);
};

const gatherDetailsAndSendMailForRoleChangeToUsers = async (newRolesAllocatedToUser, removedRolesForUser) => {
  const newRoleData = {
    // to check how much mail sent to each user whole roles are updated
    newRolePersistedData: newRolesAllocatedToUser.length,
    newRoleMailSentCount: 0,
    forUserMailNotReceived: [],
  };
  const removedRoleData = {
    // to check how many mail sent to each user whose role removed
    removedRolePersistedData: removedRolesForUser.length,
    removedRoleMailSentCount: 0,
    forUserMailNotReceived: [],
  };

  // main Function to send Mail for adding and Removing role are start Here

  // in newRolesAllocatedUser(array of Object), there are No user Info such as email and Name
  // so get individual name and email from Database and send  mail to each individual
  if (newRolesAllocatedToUser.length > 0) {
    // save all resource_emp_id in array
    const newRolesResourceEmployeeIds = newRolesAllocatedToUser.map((ele) => ele.resource_emp_id);

    // and fetch their detail using array of resource_emp_ids from avin_employee_details Table in one go.
    const userEmailAndNameForSendingMail = await promRoleRepository.getUsersEmailAndNameFromTheirResourceId(
      newRolesResourceEmployeeIds,
    );

    // combine user role change details with their details
    // before:[ { resource_emp_id:"0001", newRoleForUser: ["admin"] },]
    // after : [ { resource_emp_id:"0001", newRoleForUser:["admin"], name:"someName", email_id:"abc@avin.com" ] },]
    const userWithNewAllocatedRolesAndTheirDetails = newRolesAllocatedToUser.reduce(
      (previousValue, { resource_emp_id, newRoleForUser }) => {
        const userEmailAndName = extractUserEmailAndName(userEmailAndNameForSendingMail, resource_emp_id);
        return [...previousValue, { ...userEmailAndName, resource_emp_id, newRoleForUser }];
      },
      [],
    );

    // for each user send Mail with role information
    const sendIndividualMailToUser = await Promise.all(
      userWithNewAllocatedRolesAndTheirDetails.map(async ({ newRoleForUser, resource_name, email_id }) => {
        const mailTemplateForRoleChange = generateEmailTemplateForRoleChange(
          newRoleForUser,
          resource_name,
          'RM Tool',
          true,
          false,
        );

        const mailSentCheck = await sendMail(
          mailTemplateForRoleChange.subject,
          mailTemplateForRoleChange.text,
          mailTemplateForRoleChange.html,
          email_id,
        );
        return { mailSentCheck, email_id }; // if additional info require add here
      }),
    );
    // check whether mail sent for Each user
    newRoleData.newRoleMailSentCount = sendIndividualMailToUser.filter((ele) => ele.mailSentCheck === true).length;

    // if some mail are not sent , use that information and show in frontend about Mail Failure for that User
    if (sendIndividualMailToUser.length !== newRoleData.newRoleMailSentCount.length) {
      newRoleData.forUserMailNotReceived = sendIndividualMailToUser
        .filter((ele) => ele.mailSentCheck === false)
        .map((ele) => ele.email_id);
    }
  }

  // in removedRolesForUser(array of Object), there are No user Info such as email and Name
  // so get individual name and email from Database and send  mail to each individual
  if (removedRolesForUser.length > 0) {
    // save all resource_emp_id in array
    const removedRolesResourceEmployeeIds = removedRolesForUser.map((ele) => ele.resource_emp_id);

    // and fetch their detail using array of resource_emp_ids from avin_employee_details Table in one go.
    const userEmailAndNameForSendingMail = await promRoleRepository.getUsersEmailAndNameFromTheirResourceId(
      removedRolesResourceEmployeeIds,
    );

    // combine user role change details with their details
    // before:[ { resource_emp_id:"0001", newRoleForUser: ["admin"] },]
    // after : [ { resource_emp_id:"0001", newRoleForUser:["admin"], name:"someName", email_id:"abc@avin.com" ] },]
    const userWithRemovedRolesAndTheirDetails = removedRolesForUser.reduce(
      (previousValue, { resource_emp_id, removedRole }) => {
        const userEmailAndName = extractUserEmailAndName(userEmailAndNameForSendingMail, resource_emp_id);
        return [...previousValue, { ...userEmailAndName, resource_emp_id, removedRole }];
      },
      [],
    );

    // for each user send Mail with role information
    const sendIndividualMailToUser = await Promise.all(
      userWithRemovedRolesAndTheirDetails.map(async ({ removedRole, resource_name, email_id }) => {
        const mailTemplateForRoleChange = generateEmailTemplateForRoleChange(
          removedRole,
          resource_name,
          'RM Tool',
          false,
          true,
        );

        const mailSentCheck = await sendMail(
          mailTemplateForRoleChange.subject,
          mailTemplateForRoleChange.text,
          mailTemplateForRoleChange.html,
          email_id,
        );
        return { mailSentCheck, email_id };
      }),
    );

    // check whether mail sent for Each user
    removedRoleData.removedRoleMailSentCount = sendIndividualMailToUser.filter(
      (ele) => ele.mailSentCheck === true,
    ).length;

    // if some mail are not sent , use that information and show in frontend about Mail Failure for that User
    if (sendIndividualMailToUser.length !== removedRoleData.removedRoleMailSentCount.length) {
      removedRoleData.forUserMailNotReceived = sendIndividualMailToUser
        .filter((ele) => ele.mailSentCheck === false)
        .map((ele) => ele.email_id);
    }
  }

  // newRoleData & removedRoleData are the information of how much mail sent per database saved/persisted in database
  // so we can show information if anything went wrong with sending mail and their Information
  return { newRoleData, removedRoleData };
};

const removeUsersForTheRoleFromTheDatabase = async (removedUserForRole) => {
  let removedFromDatabaseCount = 0;
  // if any roles Removed ,then remove it from database as well
  if (removedUserForRole.length > 0) {
    // extract unique id of the Table for removed users.
    const rowsIdForRemovingUserForRole = removedUserForRole.map(({ id }) => id);

    // remove the user for role from table using Id(primary key) and persist in Database
    const removedUserRoleFromDB = await promRoleRepository.removeUsersRole(rowsIdForRemovingUserForRole);
    removedFromDatabaseCount = removedUserRoleFromDB;

    logger.info(`${removedUserRoleFromDB} user role record is Removed`); // log how many records deleted
  }
  return removedFromDatabaseCount;
};

const addNewUserForTheRoleInTheDatabase = async (newRolesAllocatedToUser) => {
  let addedToDatabaseCount = 0;
  // if new user are allocated to the role,then add to database, if no New role allocated for Users
  // then send back 0 roles are added to database
  if (newRolesAllocatedToUser.length > 0) {
    // create array of object of new roles and user to use in BulkCreate
    // ex: [{resource_emp_id:100,role_group:"admin"},{resource_emp_id:101,role_group:"admin"}]
    const newRolesForUser = newRolesAllocatedToUser.map(({ resource_emp_id, newRoleForUser }) => ({
      resource_emp_id,
      role_group: newRoleForUser,
    }));

    // assign new user to Role and Persist in Database
    const assignUserToRole = await promRoleRepository.assignUserToRoleInDatabase(newRolesForUser);
    addedToDatabaseCount = assignUserToRole.length;
  }
  return addedToDatabaseCount;
};

const assignUserToTheRole = async (roles, employeeIdArray) => {
  // convert resource_emp_id from integer to string ,as it is string in database
  const empIdInString = employeeIdArray.map((ele) => ele?.toString().trim());

  const employeeIds = [...new Set(empIdInString)]; // remove duplicate if any emp_id is repeated

  /**
   * @param {roles} => description:only single role is present so we can pass as roles[0]
   * extract all the user with row unique id for the particular role.
   * row unique id is useful and used delete the particular row in removeUserForTheRoleFromTheDatabase function
   */
  const allUserForTheRole = await promRoleRepository.getAllUserForParticularRole(roles[0]);

  // separate newly allocated role and removed roles for users.
  const { newUserForTheRole, removeUserForTheRole } = getNewlyAllocatedAndRemovedUserForTheRole(
    employeeIds,
    roles[0],
    allUserForTheRole,
  );

  // if any roles Removed ,then remove it from database as well
  await removeUsersForTheRoleFromTheDatabase(removeUserForTheRole);

  // if new Roles are allocated ,then add to database
  await addNewUserForTheRoleInTheDatabase(newUserForTheRole);

  // send Mail to each User about their Roles Modification
  const persistedAndSendMailInfo = await gatherDetailsAndSendMailForRoleChangeToUsers(
    newUserForTheRole,
    removeUserForTheRole,
  );

  return persistedAndSendMailInfo;
};

const checkPromUserPermissionForTheAPI = async (employeeId, featureAccessValue) => {
  const userRolesAndFeatureInformation = await promRoleRepository.getRolesInformationForEmployeeId(
    employeeId.toString(),
  );

  return userRolesAndFeatureInformation.some(({ promRolesAndResponsibility: { features_permission: features } }) => {
    return features.includes(featureAccessValue);
  });
};

module.exports = {
  fetchAllRoles,
  fetchGroupRoles,
  fetchAllFeatures,
  createRolesWithFeatures,
  updateRolesWithFeatures,
  checkGroupExistence,
  deleteRolesAndValues,
  assignUserToTheRole,
  gatherDetailsAndSendMailForRoleChangeToUsers,
  fetchGroupRolesWithFeatureAndUserDetails,
  checkPromUserPermissionForTheAPI,
};
