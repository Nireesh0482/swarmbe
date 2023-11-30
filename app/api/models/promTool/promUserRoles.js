const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const promAvinRoles = sequelize.define(
    'prom_avin_roles',
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
      role_group: {
        type: DataTypes.STRING(25),
        allowNull: false,
      },
    },
    {
      schema: 'prom_tool',
      timestamps: false,
      freezeTableName: true,
    },
  );

  promAvinRoles.associate = (models) => {
    promAvinRoles.belongsTo(models.promAvinEmployeeDetails, {
      targetKey: 'resource_emp_id',
      foreignKey: 'resource_emp_id',
      as: 'promUserEmployeeId',
    });
    promAvinRoles.belongsTo(models.promRolesAndResponsibility, {
      targetKey: 'role_group',
      foreignKey: 'role_group',
      as: 'promRolesAndResponsibility',
    });
  };

  return promAvinRoles;
};
