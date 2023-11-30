/* eslint-disable camelcase */
const { Op } = require('sequelize');
const logger = require('../../utils/logger');
const dbInstance = require('../../models');

const getAllEmployeeData = async () => {
  const allEmployeeData = await dbInstance.employeeData.findAll({
    raw: true,
    attributes: { exclude: ['id', 'sl_no', 'createdAt', 'updatedAt'] },
  });
  return allEmployeeData;
};

const getEveryEmployeeData = async () => {
  const allEmployeeData = await dbInstance.employeeData.findAll({ raw: true });
  return allEmployeeData;
};

const deleteEmployeeRolePermissionFromAuditTool = async (inActiveEmployeeList) => {
  const deleteEmployeeRoles = await dbInstance.userRoles.destroy({
    where: { emp_id: inActiveEmployeeList },
  });
  logger.info(`${deleteEmployeeRoles} number employee roles removed from Audit Tool`);
  return deleteEmployeeRoles;
};

// From excel to DB
const createEmployeeDB = async (employeeData, inActiveEmployeeList = []) => {
  const createEmp = await dbInstance.employeeData
    .bulkCreate(employeeData, {
      updateOnDuplicate: ['emp_id', 'emp_name', 'department', 'designation', 'email_id', 'manager_id', 'status'],
      validate: true,
    })
    .catch((error) => {
      throw error;
    });
  const deleteRoleForInActiveEmployee = await deleteEmployeeRolePermissionFromAuditTool(inActiveEmployeeList);
  return { addedToDb: createEmp.length, deleteRoleForInActiveEmployee };
};

const findEmployee = async (masterAudits) => {
  const empEmail = await dbInstance.employeeData.findAll({
    attributes: ['email_id'],
    where: { emp_id: masterAudits },
    raw: true,
  });
  return empEmail;
};

const deleteEmpData = async (employeeIds) => {
  const deleted = await dbInstance.employeeData.update(
    { status: 'Inactive' },
    { where: { [Op.and]: { emp_id: employeeIds } } },
  );
  await deleteEmployeeRolePermissionFromAuditTool(employeeIds);
  return deleted;
};

const verifyEmpEmail = async (employeeId) => {
  const empExist = await dbInstance.employeeData.findOne({
    raw: true,
    attributes: ['emp_id', 'email_id'],
    where: { emp_id: employeeId },
  });
  return empExist;
};

const empName = async (teamMember) => {
  const result = await dbInstance.employeeData.findOne({
    attributes: ['emp_name', 'email_id'],
    where: { emp_id: teamMember },
    raw: true,
  });
  return result;
};

const empDetails = async (teamMember) => {
  const employeeData = await dbInstance.employeeData.findAll({
    attributes: ['emp_name', 'email_id'],
    where: { emp_id: teamMember },
    raw: true,
  });
  return employeeData;
};

const findManagerDetails = async (managerIds) => {
  const managerData = await dbInstance.employeeData.findAll({
    attributes: ['emp_name', 'emp_id', 'status'],
    where: { emp_id: managerIds, status: 'Active' },
    raw: true,
  });
  return managerData;
};

const findEmployeeDetails = async (employeeIds) => {
  const employeeData = await dbInstance.employeeData.findAll({
    attributes: ['emp_name', 'emp_id', 'status'],
    where: { emp_id: employeeIds },
    raw: true,
  });
  return employeeData;
};

const getEmployeeRolesList = async () => {
  const employeeRolesList = await dbInstance.auditRoles.findAll({
    raw: true,
    attributes: [
      [
        dbInstance.Sequelize.fn(
          'ARRAY_AGG',
          dbInstance.Sequelize.fn('DISTINCT', dbInstance.Sequelize.col('audit_roles.roles')),
        ),
        'employeeRoles',
      ],
    ],
  });
  return employeeRolesList[0].employeeRoles;
};

const getEmployeeDesignationList = async () => {
  const employeeDesignationList = await dbInstance.auditDesignation.findAll({
    raw: true,
    attributes: [
      [
        dbInstance.Sequelize.fn(
          'ARRAY_AGG',
          dbInstance.Sequelize.fn('DISTINCT', dbInstance.Sequelize.col('audit_designation.designation')),
        ),
        'employeeDesignation',
      ],
    ],
  });
  return employeeDesignationList[0].employeeDesignation;
};

module.exports = {
  getEmployeeRolesList,
  getEmployeeDesignationList,
  findEmployee,
  createEmployeeDB,
  getAllEmployeeData,
  deleteEmpData,
  getEveryEmployeeData,
  verifyEmpEmail,
  empName,
  empDetails,
  findManagerDetails,
  findEmployeeDetails,
};
