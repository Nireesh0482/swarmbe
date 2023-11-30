const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const featuresAndAccessLevel = sequelize.define(
    'prom_features_access_level',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      feature: {
        type: DataTypes.STRING(50),
      },
      value: {
        type: DataTypes.INTEGER,
        unique: true,
        comment: 'value will indicated with Number for Internal calculation',
      },
    },
    {
      schema: 'prom_tool',
      timestamps: false,
      freezeTableName: true,
    },
  );

  return featuresAndAccessLevel;
};
