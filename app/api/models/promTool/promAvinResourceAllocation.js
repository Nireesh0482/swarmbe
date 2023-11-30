const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const promAvinResourceAllocation = sequelize.define(
    'avin_resource_allocation',
    {
      ra_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      resource_emp_id: {
        type: DataTypes.STRING(6),
        allowNull: false,
      },
      project_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      supervisor: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      allocation: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      billable_resource: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      resource_status_in_project: {
        type: DataTypes.STRING(15),
      },
    },
    {
      schema: 'prom_tool',
      freezeTableName: true,
    },
  );

  promAvinResourceAllocation.associate = (models) => {
    promAvinResourceAllocation.belongsTo(models.promAvinEmployeeDetails, {
      foreignKey: 'resource_emp_id',
      as: 'promAvinEmployeeDetails',
    });
    promAvinResourceAllocation.belongsTo(models.promAvinEmployeeDetails, {
      foreignKey: 'resource_emp_id',
      sourceKey: 'supervisor',
      as: 'promAvinEmployeeDetailsForSupervisor',
    });
    promAvinResourceAllocation.belongsTo(models.promAvinProjectDetails, {
      foreignKey: 'project_code',
      as: 'promAvinProjectDetails',
    });
  };

  return promAvinResourceAllocation;
};
