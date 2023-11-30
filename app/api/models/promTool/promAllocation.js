const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const promAllocation = sequelize.define(
    'prom_allocation',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      allocation: {
        type: DataTypes.DECIMAL(5, 2),
      },
    },
    {
      schema: 'prom_tool',
      timestamps: false,
      freezeTableName: true,
    },
  );

  return promAllocation;
};
