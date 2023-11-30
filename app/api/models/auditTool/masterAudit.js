const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const masterAudit = sequelize.define(
    'master_audit',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
      },
      audit_id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      project_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cost_center_code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      checklist_id: {
        type: DataTypes.STRING,
      },
      audit_start_date: {
        type: DataTypes.DATEONLY,
      },
      audit_end_date: {
        type: DataTypes.DATEONLY,
      },
      status: {
        type: DataTypes.STRING,
      },
      place_of_audit: {
        type: DataTypes.STRING,
      },
      description: {
        type: DataTypes.STRING,
      },
      audit_remarks: {
        type: DataTypes.STRING,
      },
      verified_by: {
        type: DataTypes.STRING,
      },
      work_package: {
        type: DataTypes.STRING,
      },
      instance: {
        type: DataTypes.STRING,
      },
      audit_report_name: {
        type: DataTypes.STRING,
      },
      compliance_attribute: {
        type: DataTypes.STRING,
      },
      audit_sub_status: {
        type: DataTypes.STRING,
      },
      auditee_efforts: {
        type: DataTypes.STRING,
      },
      auditor_efforts: {
        type: DataTypes.STRING,
      },
    },
    { freezeTableName: true, schema: 'audit_tool' },
  );

  masterAudit.associate = (models) => {
    masterAudit.belongsTo(models.projectData, {
      foreignKey: 'project_id',
      as: 'projectData',
    });
    masterAudit.belongsTo(models.masterCheckList, {
      foreignKey: 'checklist_id',
      as: 'masterCheckList',
    });
    masterAudit.hasMany(models.auditTeam, {
      foreignKey: 'audit_id',
      as: 'auditTeam',
    });
    masterAudit.belongsTo(models.employeeData, {
      foreignKey: 'verified_by',
      as: 'employeeData',
    });
    masterAudit.belongsTo(models.costCenter, {
      foreignKey: 'cost_center_code',
      as: 'costCenter',
    });
  };

  return masterAudit;
};
