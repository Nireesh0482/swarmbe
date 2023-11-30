const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const userRoles = sequelize.define(
    'user_roles',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      emp_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role_group: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    { timestamps: false, freezeTableName: true, schema: 'audit_tool' },
  );

  userRoles.associate = (models) => {
    userRoles.belongsTo(models.employeeData, {
      targetKey: 'emp_id',
      foreignKey: 'emp_id',
      as: 'employeeId',
    });

    userRoles.belongsTo(models.roleAndResponsibility, {
      targetKey: 'role_group',
      foreignKey: 'role_group',
      as: 'roleAndResponsibility',
    });
  };

  return userRoles;
};
