const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const costCenter = sequelize.define(
    'avin_cost_centers',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
      },
      cost_center_code: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        validate: {
          notNull: { msg: 'cost center code field is required' },
        },
      },
      cost_center_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: 'cost center name field is required' },
        },
      },
      cost_center_head: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: 'cost center head field is required' },
        },
      },
      remarks: {
        type: DataTypes.STRING,
      },
    },
    { freezeTableName: true, schema: 'audit_tool' },
  );

  costCenter.associate = (models) => {
    costCenter.hasMany(models.masterAudit, {
      foreignKey: 'cost_center_code',
      as: 'masterAudit',
    });
    costCenter.belongsTo(models.employeeData, {
      foreignKey: 'cost_center_head',
      as: 'employeeData',
    });
  };

  return costCenter;
};
