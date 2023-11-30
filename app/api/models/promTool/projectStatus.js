const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const projectStatus = sequelize.define(
    'project_status',
    {
      project_status_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      project_status: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },
    },
    {
      schema: 'prom_tool',
      freezeTableName: true,
      timestamps: false,
    },
  );

  return projectStatus;
};
