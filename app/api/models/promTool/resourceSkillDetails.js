const { DataTypes } = require('sequelize');

const sequelize = require('../../../config/db.config');

module.exports = () => {
  const resourceSkillDetails = sequelize.define(
    'resource_skill_details',
    {
      skill_id: {
        type: DataTypes.STRING(60),
        // autoIncrement: true,
        primaryKey: true,
        // unique: true,
      },
      resource_emp_id: {
        type: DataTypes.STRING(6),
        allowNull: true,
        unique: 'compositeIndex',
      },
      skill: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: 'compositeIndex',
      },
      relevant_exp: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
      },
      competency_level: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
      },
    },
    {
      schema: 'prom_tool',
      freezeTableName: true,
      timestamps: false,
    },
  );

  resourceSkillDetails.associate = (models) => {
    resourceSkillDetails.belongsTo(models.promAvinEmployeeDetails, {
      foreignKey: 'resource_emp_id',
      sourceKey: 'resource_emp_id',
      as: 'promAvinEmployeeDetails',
    });
  };

  return resourceSkillDetails;
};
