const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const projectTypes = sequelize.define(
    'project_types',
    {
      project_type_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      project_type: {
        type: DataTypes.STRING(25),
        allowNull: false,
      },
    },
    {
      schema: 'prom_tool',
      freezeTableName: true,
      timestamps: false,
    },
  );

  return projectTypes;
};
