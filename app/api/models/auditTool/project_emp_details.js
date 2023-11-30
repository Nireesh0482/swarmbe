const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const projectEmpData = sequelize.define(
    'project_emp_details',
    {
      pe_id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      project_id: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: 'Project ID is required' },
        },
      },
      emp_id: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: 'Employee ID is required' },
        },
      },
      role: {
        type: DataTypes.STRING,
      },
      project_emp_status: {
        type: DataTypes.STRING,
        defaultValue: 'Active',
      },
    },
    { freezeTableName: true, schema: 'audit_tool' },
  );

  projectEmpData.associate = (models) => {
    projectEmpData.belongsTo(models.projectData, {
      foreignKey: 'project_id',
      as: 'projectData',
    });
  };
  projectEmpData.associate = (models) => {
    projectEmpData.belongsTo(models.employeeData, {
      foreignKey: 'emp_id',
      as: 'employeeData',
    });
  };
  return projectEmpData;
};
