const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const employeeData = sequelize.define(
    'employee_data',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
      },
      sl_no: { type: DataTypes.INTEGER },
      emp_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true,
        validate: { notNull: { msg: 'Employee ID is required' } },
      },
      emp_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          // /[a-zA-Z][a-zA-Z ]+/i  -->use this if that Regex didnt Worked
          is: { args: /^[a-z ]*$/i, msg: 'Employee Name can only be Alphabets' },
          notNull: { msg: 'Employee Name is required' },
        },
      },
      department: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          // is: { args: /^[a-z ]*$/i, msg: 'Department can only be Alphabets' },
          notNull: { msg: 'Department is required' },
        },
      },
      designation: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          // is: { args: /^[a-z ]*$/i, msg: 'Designation can only be lphabets' },
          notNull: { msg: 'Designation is required' },
        },
      },
      email_id: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          isEmail: { args: true, msg: 'Provide a valid Email address' },
          notNull: { msg: 'Email-ID is required' },
        },
      },
      manager_id: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notNull: { msg: 'Manager ID is required' } },
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'Active',
        allowNull: false,
        validate: {
          isIn: { args: [['Active', 'Inactive']], msg: 'Status can only be Active or Inactive' },
          notNull: { msg: 'Status is required' },
        },
      },
    },
    { freezeTableName: true, schema: 'audit_tool' },
  );

  employeeData.associate = (models) => {
    employeeData.hasMany(models.userRoles, {
      foreignKey: 'emp_id',
      sourceKey: 'emp_id',
      as: 'userRoles',
    });
    employeeData.hasMany(models.masterAudit, {
      foreignKey: 'verified_by',
      sourceKey: 'emp_id',
      as: 'verifiedByEmployee',
    });
  };
  return employeeData;
};
