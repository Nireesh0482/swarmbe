const { DataTypes } = require('sequelize');

const sequelize = require('../../../config/db.config');

module.exports = () => {
  const resourcePreviousExpDetails = sequelize.define(
    'resource_previous_exp_details',
    {
      res_previous_exp_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      resource_emp_id: {
        type: DataTypes.STRING(6),
        allowNull: true,
      },
      years_of_exp: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
      },
      previous_company_details: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      joining_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      last_working_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
    },
    {
      schema: 'prom_tool',
      freezeTableName: true,
      timestamps: false,
    },
  );

  resourcePreviousExpDetails.associate = (models) => {
    resourcePreviousExpDetails.belongsTo(models.promAvinEmployeeDetails, {
      foreignKey: 'resource_emp_id',
      sourceKey: 'resource_emp_id',
      as: 'promAvinEmployeeDetails',
    });
  };

  return resourcePreviousExpDetails;
};
