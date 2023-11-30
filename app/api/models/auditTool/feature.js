const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const featuresAndAccessLevel = sequelize.define(
    'features_access_level',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      feature: {
        type: DataTypes.STRING,
      },
      value: {
        type: DataTypes.INTEGER,
        unique: true,
        comment: 'value will indicated with Number for Internal calculation',
      },
    },
    { timestamps: false, freezeTableName: true, schema: 'audit_tool' },
  );

  return featuresAndAccessLevel;
};
