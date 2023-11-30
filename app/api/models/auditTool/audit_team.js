const { DataTypes } = require('sequelize');

const sequelize = require('../../../config/db.config');

module.exports = () => {
  const auditTeam = sequelize.define(
    'audit_team',
    {
      unique_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      audit_id: {
        type: DataTypes.STRING,
      },
      audit_role: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: 'Role is required' },
        },
      },
      team_member: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: 'Employee ID is required' },
        },
      },
      remarks: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.STRING,
      },
    },
    {
      freezeTableName: true,
      schema: 'audit_tool',
    },
  );

  auditTeam.associate = (models) => {
    auditTeam.belongsTo(models.masterAudit, {
      foreignKey: 'audit_id',
      as: 'masterAudit',
    });
    auditTeam.belongsTo(models.employeeData, {
      foreignKey: 'team_member',
      as: 'employeeData',
    });
  };

  return auditTeam;
};
