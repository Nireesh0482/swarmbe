const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const promRolesAndResponsibility = sequelize.define(
    'prom_avin_roles_responsibilities',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
      },
      role_group: {
        type: DataTypes.STRING(25),
        primaryKey: true,
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
    {
      schema: 'prom_tool',
      freezeTableName: true,
    },
  );

  promRolesAndResponsibility.associate = (models) => {
    promRolesAndResponsibility.hasMany(models.promUserRoles, {
      foreignKey: 'role_group',
      sourceKey: 'role_group',
      as: 'promUserRoles',
    });
  };

  return promRolesAndResponsibility;
};
