const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const auditStatus = sequelize.define(
    'audit_designation',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      designation: { type: DataTypes.STRING, unique: true },
    },
    {
      freezeTableName: true,
      timestamps: false,
      schema: 'audit_tool',
    },
  );
  return auditStatus;
};
