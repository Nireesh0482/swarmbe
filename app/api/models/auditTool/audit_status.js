const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const auditStatus = sequelize.define(
    'audit_status',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      status: { type: DataTypes.STRING },
    },
    {
      freezeTableName: true,
      timestamps: false,
      schema: 'audit_tool',
    },
  );
  return auditStatus;
};
