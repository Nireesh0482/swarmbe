const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const designationDetails = sequelize.define(
    'designation_details',
    {
      designation_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      designation: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
    },
    {
      schema: 'prom_tool',
      freezeTableName: true,
      timestamps: false,
    },
  );

  return designationDetails;
};
