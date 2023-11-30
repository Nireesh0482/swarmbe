const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const promAvinProjectResourcePlan = sequelize.define(
    'avin_project_resource_cost_plan',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      project_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      month_year: {
        type: DataTypes.STRING(12),
        allowNull: false,
      },
      planned_resource: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
      },
      planned_cost: {
        type: DataTypes.DECIMAL(20, 2),
      },
    },
    {
      schema: 'prom_tool',
      timestamps: false,
      freezeTableName: true,
    },
  );

  promAvinProjectResourcePlan.associate = (models) => {
    promAvinProjectResourcePlan.belongsTo(models.promAvinProjectDetails, {
      foreignKey: 'project_code',
      sourceKey: 'project_code',
      as: 'promAvinProjectDetails',
    });
    promAvinProjectResourcePlan.belongsTo(models.promAvinResourceAllocation, {
      foreignKey: 'project_code',
      sourceKey: 'project_code',
      as: 'promAvinResourceAllocation',
    });
  };
  return promAvinProjectResourcePlan;
};
