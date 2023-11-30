const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const groupDetails = sequelize.define(
    'bu_details',
    {
      bu_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
      },
      bu_code: {
        type: DataTypes.STRING(25),
        unique: true,
        allowNull: false,
      },
      bu_name: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        unique: true,
        allowNull: false,
      },
      bu_head: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      remarks: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      schema: 'prom_tool',
      freezeTableName: true,
      timestamps: false,
    },
  );

  groupDetails.addScope('onlyGroupNames', {
    attributes: ['bu_name'],
  });

  groupDetails.associate = (models) => {
    groupDetails.hasMany(models.organizationGRPMgmt, {
      sourceKey: 'bu_name',
      foreignKey: 'org_bu_name',
      as: 'projectGroupAndOrgGroupNames',
    });

    groupDetails.hasMany(models.promAvinProjectDetails, {
      sourceKey: 'bu_name',
      foreignKey: 'project_bu_name',
      as: 'projectGroupFk',
    });
    groupDetails.hasMany(models.promAvinEmployeeDetails, {
      sourceKey: 'bu_name',
      foreignKey: 'bu_name',
      as: 'groupEmployees',
    });
  };

  return groupDetails;
};
