const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const projectData = sequelize.define(
    'project_data',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
      },
      project_id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        validate: {
          notNull: { msg: 'Project ID field is required' },
        },
      },
      project_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: 'Project Name field is required' },
        },
      },
      short_project_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      start_date: {
        type: DataTypes.DATEONLY,
      },
      end_date: {
        type: DataTypes.DATEONLY,
      },
      status: {
        type: DataTypes.ENUM('Active', 'Inactive'),
      },
      project_manager: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: 'Project manager field is required' },
        },
      },
      qa: {
        type: DataTypes.INTEGER,
      },
      type: {
        type: DataTypes.STRING,
      },
    },
    { freezeTableName: true, schema: 'audit_tool' },
  );

  projectData.associate = (models) => {
    projectData.hasMany(models.projectEmpData, {
      foreignKey: 'project_id',
      as: 'projectEmpData',
    });
    projectData.hasMany(models.masterAudit, {
      foreignKey: 'project_id',
      as: 'masterAudit',
    });
  };

  return projectData;
};
