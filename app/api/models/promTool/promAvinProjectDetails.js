const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const promAvinProjectDetails = sequelize.define(
    'avin_project_details',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
      },
      project_code: {
        type: DataTypes.STRING(25),
        primaryKey: true,
        allowNull: false,
        unique: true,
        validate: {
          notNull: { msg: 'project code is required' },
        },
      },
      project_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          notNull: { msg: 'project name is required' },
        },
      },
      project_bu_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notNull: { msg: 'project group name is required' },
        },
      },
      project_bu_head: {
        type: DataTypes.STRING(10),
        allowNull: true,
        // validate: {
        //   notNull: { msg: 'project group head is required' },
        // },
      },
      project_manager: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: {
          notNull: { msg: 'project manager is required' },
        },
      },
      project_type: {
        type: DataTypes.STRING(25),
        allowNull: false,
        validate: {
          notNull: { msg: 'project type is required' },
        },
      },
      project_start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notNull: { msg: 'project start date is required' },
        },
      },
      project_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notNull: { msg: 'project end date is required' },
        },
      },
      po_ro_sow_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      po_ro_sow_value: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: 'po_ro_sow_value is required' },
        },
      },
      project_status: {
        type: DataTypes.STRING(15),
        allowNull: false,
        validate: {
          notNull: { msg: 'project status is required' },
        },
      },
    },
    {
      schema: 'prom_tool',
      freezeTableName: true,
    },
  );

  promAvinProjectDetails.addScope('onlyProjectCode', {
    attributes: ['project_code'],
  });

  promAvinProjectDetails.associate = (models) => {
    promAvinProjectDetails.hasMany(models.promAvinProjectOperationData, {
      foreignKey: 'project_code',
      sourceKey: 'project_code',
      as: 'promAvinProjectOperationData',
    });
    promAvinProjectDetails.hasMany(models.promAvinResourceAllocation, {
      foreignKey: 'project_code',
      sourceKey: 'project_code',
      as: 'promAvinResourceAllocation',
    });
    promAvinProjectDetails.hasMany(models.promAvinProjectResourceAndCostPlan, {
      foreignKey: 'project_code',
      sourceKey: 'project_code',
      as: 'promAvinProjectResourceAndCostPlan',
    });

    promAvinProjectDetails.belongsTo(models.groupDetails, {
      foreignKey: 'project_bu_name',
      targetKey: 'bu_name',
      as: 'projectGroupDetails',
    });

    promAvinProjectDetails.belongsTo(models.promAvinEmployeeDetails, {
      foreignKey: 'project_manager',
      targetKey: 'resource_emp_id',
      as: 'promAvinEmployeeDetails',
    });
  };

  return promAvinProjectDetails;
};
