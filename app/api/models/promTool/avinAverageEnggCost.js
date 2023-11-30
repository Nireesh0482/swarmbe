const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const avinAverageEnggCost = sequelize.define(
    'avin_average_engg_cost',
    {
      un_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      average_engg_date: {
        type: DataTypes.STRING(12),
        allowNull: false,
        unique: 'groupnameAndMonthCompositeIndex',
      },
      average_engg_cost: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      bu_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: 'groupnameAndMonthCompositeIndex',
      },
    },
    {
      schema: 'prom_tool',
      freezeTableName: true,
      timestamps: false,
    },
  );
  return avinAverageEnggCost;
};
