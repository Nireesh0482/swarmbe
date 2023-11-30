const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const rolesAndResponsibility = sequelize.define(
    'roles_responsibilities',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      role_group: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'custom number of Members with permission to access Features',
      },
      features_permission: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        comment: 'permission for features in features Tables',
        allowNull: false,
      },
    },
    { freezeTableName: true, schema: 'audit_tool' },
  );
  rolesAndResponsibility.associate = (models) => {
    rolesAndResponsibility.hasMany(models.userRoles, {
      foreignKey: 'role_group',
      sourceKey: 'role_group',
      as: 'userRoles',
    });
  };
  return rolesAndResponsibility;
};
