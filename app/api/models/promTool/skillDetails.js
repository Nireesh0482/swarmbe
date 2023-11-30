const { DataTypes } = require('sequelize');

const sequelize = require('../../../config/db.config');

module.exports = () => {
  const skillDetails = sequelize.define(
    'skill_details',
    {
      skill_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      skill: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
    },
    {
      schema: 'prom_tool',
      freezeTableName: true,
      timestamps: false,
    },
  );

  return skillDetails;
};
