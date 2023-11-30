const dbInstance = require('../../models');

const getRolesWithUserInfo = async () => {
  const allRoles = await dbInstance.promUsers.findAll({
    attributes: { exclude: ['id', 'password', 'createdAt', 'updatedAt', 'expiry_date', 'role'] },
    include: [
      {
        model: dbInstance.promAvinEmployeeDetails,
        as: 'promAvinEmployeeDetails',
        attributes: ['resource_emp_id'],
        include: [{ model: dbInstance.promUserRoles, as: 'promUserRoles', attributes: ['role_group'] }],
      },
    ],
  });

  return JSON.parse(JSON.stringify(allRoles));
};

const GroupRolesAndFeature = async () => {
  const allGroupRolesWithFeature = await dbInstance.promRolesAndResponsibility.findAll({
    order: [['role_group', 'ASC']],
    raw: true,
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'] },
  });
  return allGroupRolesWithFeature;
};

const getFeaturesFromDB = async () => {
  const featuresAndValues = await dbInstance.promFeaturesAndAccessLevel.findAll({
    raw: true,
    attributes: { exclude: ['id'] },
  });
  return featuresAndValues;
};

const createRolesWithFeatures = async (groups, featuresPermission) => {
  const roleCreated = await dbInstance.promRolesAndResponsibility.create({
    role_group: groups,
    features_permission: featuresPermission,
  });
  return roleCreated;
};

const updateRolesWithFeatures = async (groups, featuresPermission) => {
  const roleUpdated = await dbInstance.promRolesAndResponsibility.update(
    { features_permission: featuresPermission },
    { where: { role_group: groups } },
  );
  return roleUpdated;
};

const roleGroupExists = async (groups) => {
  const groupExist = await dbInstance.promRolesAndResponsibility.count(
    { where: { role_group: groups } },
    { raw: true },
  );
  return groupExist;
};

const deleteRolesAndFeaturesValue = async (groups) => {
  const deletedRoles = await dbInstance.promRolesAndResponsibility.destroy({
    where: { role_group: groups },
  });
  return deletedRoles;
};

const singleGroupWithFeatures = async (groups) => {
  const groupData = await dbInstance.promRolesAndResponsibility.findOne({
    where: { role_group: groups },
    raw: true,
  });
  return groupData;
};

const deleteRoleInUserTable = async (groupNames) => {
  const deleteRole = await dbInstance.promUserRoles.destroy({
    where: { role_group: groupNames },
  });
  return deleteRole;
};

const assignUserToRoleInDatabase = async (rolesForEmployee) => {
  const assignedRoles = await dbInstance.promUserRoles.bulkCreate(rolesForEmployee, {});
  return JSON.parse(JSON.stringify(assignedRoles));
};

const getSingleUserRoleFromUserTable = async (employeeId) => {
  const allRoles = await dbInstance.promUserRoles.findAll({
    where: { resource_emp_id: employeeId },
    raw: true,
    attributes: { exclude: ['feature_values', 'id'] },
  });
  return allRoles;
};

const removeUsersRole = async (rowUniqueIds) => {
  const deleteRoles = await dbInstance.promUserRoles.destroy({
    where: { id: rowUniqueIds },
  });

  return deleteRoles;
};

const getRolesInfo = async (roleArray) => {
  const groupData = await dbInstance.promRolesAndResponsibility.findAll({
    attributes: ['features_permission', 'role_group'],
    where: { role_group: roleArray },
    raw: true,
  });
  return groupData;
};

const getArrayOfUserRolesDetailsFromDatabase = async (employeeIds) => {
  const usersRoles = await dbInstance.promUserRoles.findAll({
    where: { resource_emp_id: employeeIds },
    raw: true,
  });
  return usersRoles;
};

const getUsersEmailAndNameFromTheirResourceId = async (resourceEmpId) => {
  const usersBasicDetails = await dbInstance.promAvinEmployeeDetails.findAll({
    where: { resource_emp_id: resourceEmpId },
    attributes: ['resource_name', 'email_id', 'resource_emp_id'],
    raw: true,
  });
  return usersBasicDetails;
};

const getRolesAlongWithTheirUserInfo = async () => {
  const rolesWithTheirUserInfo = await dbInstance.promUserRoles.findAll({
    raw: true,
    nest: true,
    attributes: ['resource_emp_id', 'role_group'],
    include: [
      {
        model: dbInstance.promAvinEmployeeDetails,
        as: 'promUserEmployeeId',
        attributes: ['resource_emp_id', 'email_id', 'resource_name'],
      },
    ],
  });
  return rolesWithTheirUserInfo;
};

const deleteUserRoles = async (empIdArray) => {
  const deleteRoles = await dbInstance.promUserRoles.destroy({
    where: { resource_emp_id: empIdArray },
  });
  return deleteRoles;
};

const getAllUserForParticularRole = async (roleName) => {
  const usersForRole = await dbInstance.promUserRoles.findAll({
    where: { role_group: roleName },
    raw: true,
  });
  return usersForRole;
};

const getRolesInformationForEmployeeId = async (employeeId) => {
  const userEmployeeRolesInfo = await dbInstance.promUserRoles.findAll({
    where: { resource_emp_id: employeeId },
    raw: true,
    nest: true,
    include: [
      {
        model: dbInstance.promRolesAndResponsibility,
        as: 'promRolesAndResponsibility',
        attributes: ['features_permission'],
      },
    ],
  });
  return userEmployeeRolesInfo;
};

module.exports = {
  getRolesWithUserInfo,
  deleteRoleInUserTable,
  GroupRolesAndFeature,
  getFeaturesFromDB,
  createRolesWithFeatures,
  updateRolesWithFeatures,
  roleGroupExists,
  deleteRolesAndFeaturesValue,
  singleGroupWithFeatures,
  assignUserToRoleInDatabase,
  getSingleUserRoleFromUserTable,
  removeUsersRole,
  getRolesInfo,
  getArrayOfUserRolesDetailsFromDatabase,
  getUsersEmailAndNameFromTheirResourceId,
  getRolesAlongWithTheirUserInfo,
  deleteUserRoles,
  getAllUserForParticularRole,
  getRolesInformationForEmployeeId,
};
