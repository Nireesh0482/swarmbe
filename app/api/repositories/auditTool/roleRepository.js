const dbInstance = require('../../models');

const getRolesWithUserInfo = async () => {
  // delete role in users table
  const allRoles = await dbInstance.users.findAll({
    attributes: { exclude: ['id', 'password', 'createdAt', 'updatedAt', 'expiry_date', 'role', 'emp_id'] },
    include: [
      {
        model: dbInstance.employeeData,
        as: 'employeeData',
        attributes: ['emp_id'],
        include: [{ model: dbInstance.userRoles, as: 'userRoles', attributes: ['role_group'] }],
      },
    ],
  });
  return JSON.parse(JSON.stringify(allRoles));
};

const GroupRolesAndFeature = async () => {
  const allGroupRolesWithFeature = await dbInstance.roleAndResponsibility.findAll({
    raw: true,
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'] },
  });
  return allGroupRolesWithFeature;
};

const getFeaturesFromDB = async () => {
  const featuresAndValues = await dbInstance.featuresAndAccessLevel.findAll({
    raw: true,
    attributes: { exclude: ['id'] },
  });
  return featuresAndValues;
};

const createRolesWithFeatures = async (groups, featuresPermission) => {
  const roleCreated = await dbInstance.roleAndResponsibility.create({
    role_group: groups,
    features_permission: featuresPermission,
  });
  return roleCreated;
};

const updateRolesWithFeatures = async (groups, featuresPermission) => {
  const roleUpdated = await dbInstance.roleAndResponsibility.update(
    { features_permission: featuresPermission },
    { where: { role_group: groups } },
  );
  return roleUpdated;
};

const roleGroupExists = async (groups) => {
  const groupExist = await dbInstance.roleAndResponsibility.count({ where: { role_group: groups } }, { raw: true });
  return groupExist;
};

const deleteRolesAndFeaturesValue = async (groups) => {
  const deletedRoles = await dbInstance.roleAndResponsibility.destroy({
    where: { role_group: groups },
  });
  return deletedRoles;
};

const singleGroupWithFeatures = async (groups) => {
  const groupData = await dbInstance.roleAndResponsibility.findOne({
    where: { role_group: groups },
    raw: true,
  });
  return groupData;
};

const deleteRoleInUserTable = async (groupNames) => {
  const deleteRole = await dbInstance.userRoles.destroy({
    where: { role_group: groupNames },
  });
  return deleteRole;
};

const assignRoleToUser = async (rolesForEmployee) => {
  const assignedRoles = await dbInstance.userRoles.bulkCreate(rolesForEmployee, {});
  return JSON.parse(JSON.stringify(assignedRoles));
};

const getSingleUserRoleFromUserTable = async (employeeId) => {
  const allRoles = await dbInstance.userRoles.findAll({
    where: { emp_id: employeeId },
    raw: true,
    attributes: { exclude: ['feature_values', 'id'] },
  });
  return allRoles;
};

const removeUsersRole = async (rowsUniqueId) => {
  const deleteRoles = await dbInstance.userRoles.destroy({
    where: { id: rowsUniqueId },
  });
  return deleteRoles;
};

const getArrayOfUserRolesDetailsFromDatabase = async (employeeIds) => {
  const usersRoles = await dbInstance.userRoles.findAll({
    where: { emp_id: employeeIds },
    raw: true,
  });
  return usersRoles;
};

const getUsersEmailAndNameFromTheirResourceId = async (resourceEmpId) => {
  const usersBasicDetails = await dbInstance.employeeData.findAll({
    where: { emp_id: resourceEmpId },
    attributes: ['emp_name', 'email_id', 'emp_id'],
    raw: true,
  });
  return usersBasicDetails;
};

const getRolesAlongWithTheirUserInfo = async () => {
  const rolesWithTheirUserInfo = await dbInstance.userRoles.findAll({
    raw: true,
    nest: true,
    attributes: ['emp_id', 'role_group'],
    include: [
      {
        model: dbInstance.employeeData,
        as: 'employeeId',
        attributes: ['emp_id', 'email_id', 'emp_name'],
      },
    ],
  });
  return rolesWithTheirUserInfo;
};

const getAllUserForParticularRole = async (roleName) => {
  const usersForRole = await dbInstance.userRoles.findAll({
    where: { role_group: roleName },
    raw: true,
  });
  return usersForRole;
};

const getRolesInformationForEmployeeId = async (employeeId) => {
  const userEmployeeRolesInfo = await dbInstance.userRoles.findAll({
    where: { emp_id: employeeId },
    raw: true,
    nest: true,
    include: [
      {
        model: dbInstance.roleAndResponsibility,
        as: 'roleAndResponsibility',
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
  assignRoleToUser,
  getSingleUserRoleFromUserTable,
  removeUsersRole,
  getArrayOfUserRolesDetailsFromDatabase,
  getUsersEmailAndNameFromTheirResourceId,
  getAllUserForParticularRole,
  getRolesAlongWithTheirUserInfo,
  getRolesInformationForEmployeeId,
};
