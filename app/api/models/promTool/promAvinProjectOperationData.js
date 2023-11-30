const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const promAvinProjectOperationData = sequelize.define(
    'avin_project_operation_data',
    {
      opr_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      project_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: 'compositeIndex',
      },
      revenue_date: {
        type: DataTypes.STRING(12),
        allowNull: false,
        unique: 'compositeIndex',
      },
      revenue: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
      },
    },
    {
      schema: 'prom_tool',
      freezeTableName: true,
    },
  );

  promAvinProjectOperationData.associate = (models) => {
    promAvinProjectOperationData.belongsTo(models.promAvinProjectDetails, {
      foreignKey: 'project_code',
      sourceKey: 'project_code',
      as: 'promAvinProjectDetails',
    });
  };
  return promAvinProjectOperationData;
};
