const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db.config');

module.exports = () => {
  const expenseType = sequelize.define(
    'expense_type',
    {
      expense_type_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      expense_type: {
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

  return expenseType;
};
