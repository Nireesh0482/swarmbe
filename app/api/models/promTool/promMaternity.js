const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const promMaternity = sequelize.define(
    'maternity_details',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      resource_emp_id: {
        type: DataTypes.STRING(6),
        allowNull: false,
      },
      bu_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      reporting_manager: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      maternity_start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      maternity_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      internal_status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      remarks: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      schema: 'prom_tool',
      freezeTableName: true,
    },
  );

  promMaternity.associate = (models) => {
    promMaternity.belongsTo(models.promAvinEmployeeDetails, {
      foreignKey: 'resource_emp_id',
      targetKey: 'resource_emp_id',
      as: 'promAvinEmployeeDetails',
    });
    promMaternity.belongsTo(models.promAvinEmployeeDetails, {
      foreignKey: 'reporting_manager',
      targetKey: 'resource_emp_id',
      as: 'promAvinEmployeeDetailsForManager',
    });
    promMaternity.belongsTo(models.groupDetails, {
      foreignKey: 'bu_name',
      targetKey: 'bu_name',
      as: 'promGroupDetails',
    });
  };

  return promMaternity;
};
