const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const promAvinProjectExpenses = sequelize.define(
    'avin_project_expenses',
    {
      pe_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      project_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      resource_emp_id: {
        type: DataTypes.STRING(6),
        allowNull: true,
      },
      expense_type: {
        type: DataTypes.STRING(25),
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
      },
      remarks: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      approver: {
        type: DataTypes.STRING(10),
      },
      approved_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      claim_status: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },
    },
    {
      schema: 'prom_tool',
      freezeTableName: true,
    },
  );

  promAvinProjectExpenses.associate = (models) => {
    promAvinProjectExpenses.belongsTo(models.promAvinProjectDetails, {
      foreignKey: 'project_code',
      as: 'promAvinProjectDetails',
    });
    promAvinProjectExpenses.belongsTo(models.promAvinEmployeeDetails, {
      foreignKey: { name: 'resource_emp_id', allowNull: true },
      sourceKey: 'resource_emp_id',
      as: 'promAvinEmployeeDetails',
    });
  };

  return promAvinProjectExpenses;
};
