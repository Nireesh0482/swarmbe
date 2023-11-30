const { DataTypes } = require('sequelize');

const sequelize = require('../../../config/db.config');

module.exports = () => {
  const masterCheckList = sequelize.define(
    'master_checklist',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
      },
      checklist_id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      description: {
        type: DataTypes.STRING,
      },
      type: {
        type: DataTypes.STRING,
      },
      remarks: {
        type: DataTypes.STRING,
      },
      checklist_tablename: {
        type: DataTypes.STRING,
      },
    },
    { freezeTableName: true, schema: 'audit_tool' },
  );

  masterCheckList.associate = (models) => {
    masterCheckList.hasMany(models.masterAudit, {
      foreignKey: 'checklist_id',
      as: 'masterAudit',
    });
  };

  return masterCheckList;
};
